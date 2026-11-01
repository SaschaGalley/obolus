import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance } from 'axios';

type Ref = { id: number; name: string } | null;

/** Single Bookamat amount line on a booking. */
export interface BookamatAmount {
  group: string;                // "1" = incoming
  amount: string;               // brutto, decimal as string
  amount_after_tax: string;     // netto
  tax_value: string;
  tax_percent?: string;
  deductibility_tax_percent?: string;
  deductibility_amount_percent?: string;
  bankaccount?: Ref;
  costaccount: { name: string; id?: number };
  purchasetaxaccount?: Ref;
  foreign_business_base?: { id: number; vatin: string } | null;
  country_dep?: string;
  country_rec?: string;
}

/** Booking row as returned by https://www.bookamat.com/api/v1/at/{year}/bookings. */
export interface BookamatBooking {
  id: number;
  status?: string;
  title: string;
  document_number?: string | null;
  date: string;          // ISO date
  date_invoice?: string | null;
  date_delivery?: string | null;
  date_order?: string | null;
  costcentre?: Ref;
  amounts: BookamatAmount[];
  attachments?: { id: number; name: string; size: number }[];
  vatin?: string;
  country?: string;
  description?: string;
}

/** Activated account as returned by the `/preferences/*` endpoints (union of all kinds). */
export interface BookamatPreference {
  id: number;
  name: string;
  section?: string;
  group?: string;
  active?: boolean;
  deductibility_tax_percent?: string;
  deductibility_amount_percent?: string;
  purchasetaxaccounts?: { id: number; name: string }[];
  reverse_charge?: boolean;
  ic_report?: boolean;
  ic_delivery?: boolean;
  ic_service?: boolean;
  tax_values?: string[];
  /** tax: UVA-Kennzahlen the account feeds, e.g. ["000","022","029"] (rate-specific ones by the line's rate). */
  index_purchasetax?: string[];
  /** cost: Kennzahlen of the income tax return (E1a). */
  index_incometax?: string[];
}

/** Grundeinstellungen of a year (`/user/settings/`). */
export interface BookamatSettings {
  id: number;
  purchasetax?: boolean;
  purchasetax_range?: string;     // "1" = monatlich, "2" = vierteljährlich
  accounting_method?: string;     // "cash" = Ist, "accrual" = Soll
  ic_report_range?: string;       // "1" = monatlich, "2" = vierteljährlich
}

export type BookamatPreferenceKind = 'costaccounts' | 'purchasetaxaccounts' | 'bankaccounts' | 'costcentres';

/** Body of `POST /bookings/`: accounts as IDs, decimals as strings. No `date` = offene Buchung. */
export interface BookamatBookingCreate {
  title: string;
  date?: string;
  date_invoice?: string;
  date_delivery?: string;
  date_order?: string;
  costcentre?: number;
  vatin?: string;
  country?: string;
  description?: string;
  amounts: {
    bankaccount: number;
    costaccount: number;
    purchasetaxaccount: number;
    amount: string;
    tax_percent: string;
    deductibility_tax_percent: string;
    deductibility_amount_percent: string;
    country_dep?: string;
    country_rec?: string;
  }[];
}

interface BookamatPage<T> {
  results: T[];
  next: string | null;
}

/**
 * Thin axios wrapper around the Bookamat REST API.
 *
 * Auth is `Authorization: ApiKey <user>:<key>` (header) – ported 1:1 from
 * the legacy accounting/data-api ConfigService.
 *
 * Pagination is recursive: the API returns `{ results, next }`, where `next`
 * is an absolute URL to the next page. We follow it until null.
 *
 * `BOOKAMAT_BASE_URL` points it elsewhere (a stub in development); unset, it is
 * the real API.
 */
@Injectable()
export class BookamatClient {
  private readonly logger = new Logger(BookamatClient.name);
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    const user = this.config.get<string>('BOOKAMAT_USER');
    const key = this.config.get<string>('BOOKAMAT_API_KEY');
    // `||`, not a get() default: compose passes an unset variable as ''.
    this.baseUrl = (this.config.get<string>('BOOKAMAT_BASE_URL') || 'https://www.bookamat.com/api/v1/at').replace(/\/$/, '');
    this.http = axios.create({
      headers: {
        Authorization: `ApiKey ${user}:${key}`,
      },
      timeout: 30_000,
    });
  }

  /** True when both credential env vars are set. */
  public isConfigured(): boolean {
    return !!this.config.get('BOOKAMAT_USER') && !!this.config.get('BOOKAMAT_API_KEY');
  }

  /**
   * Fetch all bookings of a single year, following pagination.
   * Returns `null` if the year is not available on Bookamat (404) – this
   * happens for years older than the user's Bookamat retention window.
   * Other HTTP errors propagate so the caller can decide whether to abort.
   */
  public async fetchYear(year: number): Promise<BookamatBooking[] | null> {
    return this.fetchListOrNull<BookamatBooking>(year, `${this.baseUrl}/${year}/bookings`);
  }

  /** The activated accounts of one kind in a year; `null` when the year is not on Bookamat. */
  public fetchPreferences(year: number, kind: BookamatPreferenceKind): Promise<BookamatPreference[] | null> {
    return this.fetchListOrNull<BookamatPreference>(year, `${this.baseUrl}/${year}/preferences/${kind}/`);
  }

  /** The year's Grundeinstellungen; `null` when the year is not on Bookamat. */
  public async fetchSettings(year: number): Promise<BookamatSettings | null> {
    const list = await this.fetchListOrNull<BookamatSettings>(year, `${this.baseUrl}/${year}/user/settings/`);
    return list?.[0] ?? null;
  }

  /** Create a booking in the year of its date. Returns the booking as Bookamat stored it. */
  public async createBooking(year: number, body: BookamatBookingCreate): Promise<BookamatBooking> {
    const { data } = await this.http.post<BookamatBooking>(`${this.baseUrl}/${year}/bookings/`, body);
    return data;
  }

  /** Attach a file (Bookamat allows three per booking). */
  public async addAttachment(year: number, bookingId: number, name: string, file: Buffer): Promise<void> {
    await this.http.post(`${this.baseUrl}/${year}/bookings/attachments/`, {
      booking: bookingId,
      name: name.slice(0, 50),
      file: file.toString('base64'),
    });
  }

  /**
   * Bookamat's error body as one line for the page: field errors come as
   * `{ field: ["message"] }`, possibly nested inside `amounts`.
   */
  public static describeError(err: unknown): string {
    if (!axios.isAxiosError(err)) return (err as Error).message;
    const data = err.response?.data;
    if (!data || typeof data !== 'object') return err.message;
    const parts: string[] = [];
    const walk = (value: unknown, path: string) => {
      if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
        parts.push(`${path}: ${value.join(' ')}`);
      } else if (Array.isArray(value)) {
        value.forEach((v, i) => walk(v, `${path}[${i}]`));
      } else if (value && typeof value === 'object') {
        for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k);
      } else if (value != null) {
        parts.push(path ? `${path}: ${value}` : String(value));
      }
    };
    walk(data, '');
    return parts.length ? parts.join('; ') : err.message;
  }

  private async fetchListOrNull<T>(year: number, url: string): Promise<T[] | null> {
    try {
      return await this.fetchPage<T>(url);
    } catch (err) {
      if (axios.isAxiosError(err) && (err as AxiosError).response?.status === 404) {
        this.logger.warn(`Year ${year} not available on Bookamat (404) – skipping`);
        return null;
      }
      throw err;
    }
  }

  private async fetchPage<T>(url: string): Promise<T[]> {
    const { data } = await this.http.get<BookamatPage<T>>(url);
    const results = data.results ?? [];
    if (data.next) {
      results.push(...await this.fetchPage<T>(data.next));
    }
    return results;
  }
}

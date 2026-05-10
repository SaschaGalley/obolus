import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosInstance } from 'axios';

/** Single Bookamat amount line on a booking. */
export interface BookamatAmount {
  group: string;                // "1" = incoming
  amount: string;               // brutto, decimal as string
  amount_after_tax: string;     // netto
  tax_value: string;
  costaccount: { name: string };
}

/** Booking row as returned by https://www.bookamat.com/api/v1/at/{year}/bookings. */
export interface BookamatBooking {
  id: number;
  title: string;
  date: string;          // ISO date
  amounts: BookamatAmount[];
}

interface BookamatPage {
  results: BookamatBooking[];
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
 */
@Injectable()
export class BookamatClient {
  private readonly logger = new Logger(BookamatClient.name);
  private readonly http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    const user = this.config.get<string>('BOOKAMAT_USER');
    const key = this.config.get<string>('BOOKAMAT_API_KEY');
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
    const url = `https://www.bookamat.com/api/v1/at/${year}/bookings`;
    try {
      return await this.fetchPage(url);
    } catch (err) {
      if (axios.isAxiosError(err) && (err as AxiosError).response?.status === 404) {
        this.logger.warn(`Year ${year} not available on Bookamat (404) – skipping`);
        return null;
      }
      throw err;
    }
  }

  private async fetchPage(url: string): Promise<BookamatBooking[]> {
    const { data } = await this.http.get<BookamatPage>(url);
    const results = data.results ?? [];
    if (data.next) {
      results.push(...await this.fetchPage(data.next));
    }
    return results;
  }
}

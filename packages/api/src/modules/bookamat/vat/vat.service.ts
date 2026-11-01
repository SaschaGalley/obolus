import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import {
  BookamatAccount, BookamatAccountData, Booking, VatMethod, VatPeriod, YearSettings,
} from '../../../database/entities';
import {
  AccountLookup, Period, Uva, VatBooking, VatLine, ZmRow,
  computeUva, computeZm, dueDates, inPeriod, pauschalen, periodsOf, toLines, yearPeriod,
} from './vat';
import { PAUSCHALE_RATE } from './kennzahlen';

export interface VatSettings {
  vatPeriod: VatPeriod;
  vatMethod: VatMethod;
  zmPeriod: VatPeriod;
  /** Where the values come from: the year's Bookamat settings, an earlier year, or the defaults. */
  source: 'year' | 'earlier' | 'default';
}

export interface VatPeriodReport extends Period {
  dueUva: string | null;
  dueZm: string | null;
  uva: Uva;
  /** Vorsteuerpauschale (1,8 % of KZ 000, capped per year); not in the Zahllast above. */
  pauschale: number;
  zahllastMitPauschale: number;
  zm: ZmRow[];
  /** Indexes into `lines`. */
  lineIdx: number[];
}

export interface VatReport {
  year: number;
  settings: VatSettings;
  pauschaleRate: number;
  periods: VatPeriodReport[];
  total: VatPeriodReport;
  lines: VatLine[];
  /** Lines paid in the year (Zufluss/Abfluss, the Einnahmen-Ausgaben-Rechnung's list); indexes into `lines`. */
  bookedIdx: number[];
  warnings: string[];
}

const DEFAULTS = { vatPeriod: 'quarter', vatMethod: 'cash', zmPeriod: 'quarter' } as const;

/**
 * Umsatzsteuervoranmeldung and Zusammenfassende Meldung from the stored
 * bookings, with Bookamat's Kennzahlen per VAT account.
 */
@Injectable()
export class VatService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(BookamatAccount)
    private readonly accountRepo: Repository<BookamatAccount>,
    @InjectRepository(YearSettings)
    private readonly yearSettingsRepo: Repository<YearSettings>,
  ) {}

  public async report(userId: number, year: number): Promise<VatReport> {
    const settings = await this.settings(userId, year);
    // A line's period can lie in the year before its booking (a December
    // service paid in January), so the neighbours come along.
    const years = [year - 1, year, year + 1];
    const [bookings, accounts] = await Promise.all([
      this.bookingRepo.find({ where: { userId, year: In(years) }, order: { date: 'ASC', id: 'ASC' } }),
      this.accountRepo.find({ where: { userId, kind: 'tax' } }),
    ]);

    const all = toLines(bookings.map(toVatBooking), lookupFor(accounts), settings.vatMethod);
    const yp = yearPeriod(year);
    const paidInYear = (l: VatLine) => l.date >= yp.from && l.date <= yp.to;
    const lines = all.filter((l) => inPeriod(yp)(l) || paidInYear(l));

    const periods = periodsOf(year, settings.vatPeriod);
    const zmPeriods = periodsOf(year, settings.zmPeriod);
    const reports = periods.map((p) => this.periodReport(p, lines, zmPeriods, true));
    const pauschale = pauschalen(year, reports.map((r) => kz000(r.uva)));
    reports.forEach((r, i) => {
      r.pauschale = pauschale[i];
      r.zahllastMitPauschale = round2(r.uva.zahllast - pauschale[i]);
    });
    const total = this.periodReport(yp, lines, zmPeriods, false);
    total.pauschale = round2(pauschale.reduce((a, b) => a + b, 0));
    total.zahllastMitPauschale = round2(total.uva.zahllast - total.pauschale);

    return {
      year,
      settings,
      pauschaleRate: PAUSCHALE_RATE,
      periods: reports,
      total,
      lines,
      bookedIdx: lines.flatMap((l, i) => (paidInYear(l) ? [i] : [])),
      warnings: this.warnings(year, bookings, accounts, lines),
    };
  }

  private periodReport(p: Period, lines: VatLine[], zmPeriods: Period[], withDue: boolean): VatPeriodReport {
    const lineIdx = lines.flatMap((l, i) => (inPeriod(p)(l) ? [i] : []));
    const own = lineIdx.map((i) => lines[i]);
    const due = withDue ? dueDates(p) : null;
    const uva = computeUva(own);
    return {
      ...p,
      dueUva: due?.uva ?? null,
      dueZm: due?.zm ?? null,
      uva,
      pauschale: 0,
      zahllastMitPauschale: uva.zahllast,
      zm: computeZm(own, zmPeriods),
      lineIdx,
    };
  }

  /** The year's own values, else the latest earlier year's, else quarterly Ist-Besteuerung. */
  private async settings(userId: number, year: number): Promise<VatSettings> {
    const own = await this.yearSettingsRepo.findOne({ where: { userId, year } });
    const earlier = await this.yearSettingsRepo.find({ where: { userId, year: LessThan(year) }, order: { year: 'DESC' } });
    const pick = <K extends 'vatPeriod' | 'vatMethod' | 'zmPeriod'>(key: K) =>
      own?.[key] ?? earlier.find((s) => s[key])?.[key] ?? DEFAULTS[key];
    const source = own?.vatPeriod ? 'year' : earlier.some((s) => s.vatPeriod) ? 'earlier' : 'default';
    return { vatPeriod: pick('vatPeriod'), vatMethod: pick('vatMethod'), zmPeriod: pick('zmPeriod'), source };
  }

  private warnings(year: number, bookings: Booking[], accounts: BookamatAccount[], lines: VatLine[]): string[] {
    const out: string[] = [];
    const thisYear = bookings.filter((b) => b.year === year);
    const bare = thisYear.filter((b) => !b.amounts).length;
    if (bare) {
      out.push(`${bare} Buchungen ${year} haben noch keine Kontodetails und fehlen in der UVA. `
        + 'Unter Buchhaltung „Alle synchronisieren“ ausführen.');
    }
    const taxAccounts = accounts.filter((a) => a.year === year);
    if (thisYear.length && !taxAccounts.length) {
      out.push(`Für ${year} sind keine USt-Konten gespeichert. Unter Buchhaltung „Alle synchronisieren“ ausführen.`);
    } else if (taxAccounts.some((a) => !a.data?.indexPurchasetax)) {
      out.push(`Die USt-Konten ${year} haben noch keine Kennzahlen. Unter Buchhaltung „Alle synchronisieren“ ausführen.`);
    }
    const unknown = lines.filter((l) => l.unknownAccount).length;
    if (unknown) out.push(`${unknown} Buchungszeilen haben ein USt-Konto, das in den gespeicherten Konten fehlt.`);
    return out;
  }
}

const round2 = (v: number) => Math.round(v * 100) / 100;
const kz000 = (uva: Uva) => uva.rows.find((r) => r.kz === '000')?.amount ?? 0;

function toVatBooking(b: Booking): VatBooking {
  return {
    id: b.id,
    bookamatId: b.bookamatId,
    year: b.year,
    date: b.date,
    dateInvoice: b.dateInvoice,
    dateDelivery: b.dateDelivery,
    title: b.title,
    documentNumber: b.documentNumber,
    vatin: b.vatin,
    country: b.country,
    attachmentCount: b.attachmentCount,
    amounts: b.amounts,
  };
}

/** By name in the booking's year; a year without stored accounts borrows the nearest year's. */
function lookupFor(accounts: BookamatAccount[]): AccountLookup {
  const byYear = new Map<number, Map<string, BookamatAccountData>>();
  for (const a of accounts) {
    if (!byYear.has(a.year)) byYear.set(a.year, new Map());
    byYear.get(a.year)!.set(a.name, a.data);
  }
  const years = [...byYear.keys()];
  return (year, name) => {
    const own = byYear.get(year);
    if (own) return own.get(name);
    const nearest = [...years].sort((a, b) => Math.abs(a - year) - Math.abs(b - year) || b - a)[0];
    return nearest == null ? undefined : byYear.get(nearest)!.get(name);
  };
}

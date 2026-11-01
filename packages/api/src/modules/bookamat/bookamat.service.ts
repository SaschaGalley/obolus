import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Booking, BookingAmountLine, YearSettings, BookamatAccount, BookamatAccountKind, BookamatAccountData,
} from '../../database/entities';
import {
  BookamatClient, BookamatBooking, BookamatPreference, BookamatPreferenceKind,
} from './bookamat.client';

/**
 * Cost-account name → classification flags.
 *
 * These match the strings the legacy accounting/data-api/src/bookamat
 * service used. They live here (instead of in the client) because they're
 * an obulus-side concern – the Bookamat API just returns the raw name.
 */
const TYPE_EST = new Set(['Einkommensteuer']);
const TYPE_UST = new Set(['Umsatzsteuer laufendes Jahr', 'Umsatzsteuer Vorjahr']);
const TYPE_SVS = new Set(['Sozialversicherung']);
const TYPE_PRIVATE = new Set(['Privateinlagen (allgemein)', 'Privatentnahmen (allgemein)']);

/** Which `/preferences/*` list feeds which account kind. */
const PREFERENCE_KINDS: [BookamatPreferenceKind, BookamatAccountKind][] = [
  ['costaccounts', 'cost'],
  ['purchasetaxaccounts', 'tax'],
  ['bankaccounts', 'bank'],
  ['costcentres', 'costcentre'],
];

const num = (v: string | number | null | undefined): number => {
  const n = typeof v === 'number' ? v : parseFloat(v ?? '');
  return Number.isFinite(n) ? n : 0;
};
const numOrNull = (v: string | null | undefined): number | null => (v == null || v === '' ? null : num(v));

export interface SyncResult {
  year: number;
  imported: number;
  /** True when Bookamat returned 404 for this year (skipped, not failed). */
  skipped?: boolean;
  /** Stored bookings of the year that Bookamat no longer has. */
  removed?: number;
}

@Injectable()
export class BookamatService {
  private readonly logger = new Logger(BookamatService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(YearSettings)
    private readonly yearSettingsRepo: Repository<YearSettings>,
    @InjectRepository(BookamatAccount)
    private readonly accountRepo: Repository<BookamatAccount>,
    private readonly client: BookamatClient,
    private readonly config: ConfigService,
  ) {}

  /**
   * Sync every year from STARTING_YEAR (env) to the current year.
   * Years that 404 on Bookamat (deleted from their retention window) are
   * skipped instead of aborting the batch – historical years are typically
   * seeded from the legacy dump anyway.
   */
  public async syncAll(userId: number): Promise<SyncResult[]> {
    if (!this.client.isConfigured()) {
      throw new BadRequestException(
        'Bookamat-Credentials fehlen. BOOKAMAT_USER und BOOKAMAT_API_KEY in der .env setzen.',
      );
    }
    const startingYear = parseInt(this.config.get('BOOKAMAT_STARTING_YEAR', '2015'), 10);
    const currentYear = new Date().getFullYear();
    const results: SyncResult[] = [];
    for (let year = startingYear; year <= currentYear; year++) {
      results.push(await this.syncYear(userId, year));
    }
    return results;
  }

  /**
   * Sync a single year. Idempotent – we use `repo.upsert()` keyed on
   * `(user_id, bookamat_id)` so re-runs don't create duplicates.
   *
   * Returns `imported: 0, skipped: true` when Bookamat doesn't have the year
   * (404). Existing data in obulus_bookings is left untouched in that case –
   * the year is presumed to be seeded historically.
   */
  public async syncYear(userId: number, year: number): Promise<SyncResult> {
    if (!this.client.isConfigured()) {
      throw new BadRequestException(
        'Bookamat-Credentials fehlen. BOOKAMAT_USER und BOOKAMAT_API_KEY in der .env setzen.',
      );
    }
    this.logger.log(`Sync ${year} for user ${userId}…`);
    const bookings = await this.client.fetchYear(year);
    if (bookings === null) {
      this.logger.log(`  → year unavailable on Bookamat, skipping`);
      return { year, imported: 0, skipped: true };
    }
    // The year's accounts come along: the reconciliation resolves names to
    // this year's IDs when it transfers a booking, the VAT report reads their
    // Kennzahlen.
    await this.syncAccounts(userId, year);
    // Ensure a year_settings row exists (so OverviewService doesn't have to
    // handle the missing-row case for years we've actually synced).
    await this.ensureYearSettings(userId, year);
    await this.syncSettings(userId, year);

    // Bookamat's list is the year: rows it no longer returns were deleted
    // there and must not count in the VAT report.
    const removed = await this.removeStale(userId, year, bookings.map((b) => b.id));

    if (bookings.length === 0) {
      this.logger.log(`  → no bookings`);
      return { year, imported: 0, removed };
    }

    const rows = bookings.map((b) => this.mapBooking(userId, b));
    await this.bookingRepo.upsert(rows, {
      conflictPaths: ['userId', 'bookamatId'],
      skipUpdateIfNoValuesChanged: true,
    });

    this.logger.log(`  → ${rows.length} bookings, ${removed} removed`);
    return { year, imported: rows.length, removed };
  }

  /** Map a Bookamat API booking to the obulus Booking entity. */
  private mapBooking(userId: number, b: BookamatBooking): Partial<Booking> {
    const amounts = b.amounts ?? [];
    const isIncoming = amounts[0]?.group === '1';
    const type = amounts[0]?.costaccount?.name ?? '';

    const sum = (key: keyof Pick<typeof amounts[number], 'amount' | 'amount_after_tax' | 'tax_value'>) =>
      amounts.reduce((acc, a) => acc + parseFloat(a[key] || '0'), 0);

    const date = new Date(b.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;

    const lines: BookingAmountLine[] = amounts.map((a) => ({
      group: a.group,
      bankaccount: a.bankaccount?.name ?? null,
      costaccount: a.costaccount?.name ?? null,
      purchasetaxaccount: a.purchasetaxaccount?.name ?? null,
      amount: num(a.amount),
      amountAfterTax: num(a.amount_after_tax),
      taxPercent: num(a.tax_percent),
      taxValue: num(a.tax_value),
      deductibilityTaxPercent: num(a.deductibility_tax_percent ?? '100'),
      deductibilityAmountPercent: num(a.deductibility_amount_percent ?? '100'),
      foreignBusinessBase: a.foreign_business_base?.vatin ?? null,
      countryDep: a.country_dep || null,
      countryRec: a.country_rec || null,
    }));

    return {
      userId,
      bookamatId: b.id,
      title: b.title ?? '',
      documentNumber: b.document_number ?? null,
      type,
      date: b.date,
      dateInvoice: b.date_invoice ?? null,
      dateDelivery: b.date_delivery ?? null,
      dateOrder: b.date_order ?? null,
      year,
      month,
      yearMonth,
      brutto: sum('amount'),
      netto: sum('amount_after_tax'),
      tax: sum('tax_value'),
      vatin: b.vatin || null,
      country: b.country || null,
      costcentre: b.costcentre?.name ?? null,
      description: b.description || null,
      amounts: lines,
      attachmentCount: b.attachments?.length ?? 0,
      isIncoming,
      isPrivate: TYPE_PRIVATE.has(type),
      isEst: TYPE_EST.has(type),
      isUst: TYPE_UST.has(type),
      isSvs: TYPE_SVS.has(type),
    };
  }

  /**
   * Replace the stored accounts of a year with Bookamat's current lists. A kind
   * Bookamat answers 404 for is left as it was.
   */
  public async syncAccounts(userId: number, year: number): Promise<void> {
    for (const [path, kind] of PREFERENCE_KINDS) {
      const list = await this.client.fetchPreferences(year, path);
      if (list === null) continue;
      const rows = list.map((p) => ({
        userId,
        year,
        kind,
        bookamatId: p.id,
        name: p.name,
        data: this.mapPreference(kind, p),
      }));
      await this.accountRepo.delete({ userId, year, kind });
      if (rows.length) await this.accountRepo.insert(rows);
    }
  }

  /**
   * Take the UVA/ZM periods and Ist/Soll from Bookamat's Grundeinstellungen.
   * Optional: a failure leaves the stored values and does not fail the sync.
   */
  private async syncSettings(userId: number, year: number): Promise<void> {
    try {
      const s = await this.client.fetchSettings(year);
      if (!s) return;
      const period = (v?: string) => (v === '1' ? 'month' : v === '2' ? 'quarter' : null);
      const method = s.accounting_method === 'cash' || s.accounting_method === 'accrual' ? s.accounting_method : null;
      await this.yearSettingsRepo.update(
        { userId, year },
        { vatPeriod: period(s.purchasetax_range), vatMethod: method, zmPeriod: period(s.ic_report_range) },
      );
    } catch (err) {
      this.logger.warn(`Settings ${year} not synced: ${(err as Error).message}`);
    }
  }

  private async removeStale(userId: number, year: number, keep: number[]): Promise<number> {
    const qb = this.bookingRepo.createQueryBuilder().delete()
      .where('user_id = :userId AND year = :year', { userId, year });
    if (keep.length) qb.andWhere('bookamat_id NOT IN (:...keep)', { keep });
    const result = await qb.execute();
    return result.affected ?? 0;
  }

  /** The accounts of a year, synced on demand when none are stored yet. */
  public async accountsForYear(userId: number, year: number): Promise<BookamatAccount[]> {
    let accounts = await this.accountRepo.find({ where: { userId, year }, order: { name: 'ASC' } });
    if (!accounts.length && this.client.isConfigured()) {
      await this.syncAccounts(userId, year);
      accounts = await this.accountRepo.find({ where: { userId, year }, order: { name: 'ASC' } });
    }
    return accounts;
  }

  private mapPreference(kind: BookamatAccountKind, p: BookamatPreference): BookamatAccountData {
    switch (kind) {
      case 'cost':
        return {
          group: p.group,
          section: p.section,
          active: p.active,
          purchasetaxaccounts: (p.purchasetaxaccounts ?? []).map((t) => t.name),
          deductibilityTaxPercent: numOrNull(p.deductibility_tax_percent),
          deductibilityAmountPercent: numOrNull(p.deductibility_amount_percent),
          indexIncometax: p.index_incometax ?? [],
        };
      case 'tax':
        return {
          group: p.group,
          section: p.section,
          active: p.active,
          reverseCharge: !!p.reverse_charge,
          icReport: !!p.ic_report,
          icDelivery: !!p.ic_delivery,
          icService: !!p.ic_service,
          taxValues: (p.tax_values ?? []).map(num),
          indexPurchasetax: p.index_purchasetax ?? [],
        };
      default:
        return {};
    }
  }

  private async ensureYearSettings(userId: number, year: number): Promise<void> {
    const existing = await this.yearSettingsRepo.findOne({ where: { userId, year } });
    if (existing) return;
    await this.yearSettingsRepo.insert({ userId, year });
  }

  /** Fetch raw bookings for a user (with optional filters). */
  public listBookings(
    userId: number,
    filter: { year?: number; month?: number } = {},
  ): Promise<Booking[]> {
    const where: Record<string, unknown> = { userId };
    if (filter.year) where.year = filter.year;
    if (filter.month) where.month = filter.month;
    return this.bookingRepo.find({ where, order: { date: 'DESC', id: 'DESC' } });
  }
}

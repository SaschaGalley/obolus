import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, YearSettings } from '../../database/entities';
import { BookamatClient, BookamatBooking } from './bookamat.client';

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

export interface SyncResult {
  year: number;
  imported: number;
  /** True when Bookamat returned 404 for this year (skipped, not failed). */
  skipped?: boolean;
}

@Injectable()
export class BookamatService {
  private readonly logger = new Logger(BookamatService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(YearSettings)
    private readonly yearSettingsRepo: Repository<YearSettings>,
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
    if (bookings.length === 0) {
      this.logger.log(`  → no bookings`);
      return { year, imported: 0 };
    }

    // Ensure a year_settings row exists (so OverviewService doesn't have to
    // handle the missing-row case for years we've actually synced).
    await this.ensureYearSettings(userId, year);

    const rows = bookings.map((b) => this.mapBooking(userId, b));
    await this.bookingRepo.upsert(rows, {
      conflictPaths: ['userId', 'bookamatId'],
      skipUpdateIfNoValuesChanged: true,
    });

    this.logger.log(`  → ${rows.length} bookings`);
    return { year, imported: rows.length };
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

    return {
      userId,
      bookamatId: b.id,
      title: b.title ?? '',
      type,
      date: b.date,
      year,
      month,
      yearMonth,
      brutto: sum('amount'),
      netto: sum('amount_after_tax'),
      tax: sum('tax_value'),
      isIncoming,
      isPrivate: TYPE_PRIVATE.has(type),
      isEst: TYPE_EST.has(type),
      isUst: TYPE_UST.has(type),
      isSvs: TYPE_SVS.has(type),
    };
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

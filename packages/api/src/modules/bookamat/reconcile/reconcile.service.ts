import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { BankMatch, BookamatAccount, Booking, Invoice } from '../../../database/entities';
import { PdfService } from '../../../pdf/pdf.service';
import { InvoicesService } from '../../invoices/invoices.service';
import { BookamatClient, BookamatBookingCreate } from '../bookamat.client';
import { BookamatService } from '../bookamat.service';
import { Match, matchTransactions } from './matcher';
import { needsInvoiceDate, normalizeVatin, suggest, SuggestContext, YearAccounts } from './suggest';
import { UmsatzClient } from './umsatz.client';
import { BankTx, Decision, HistBooking, InvoiceRef, Suggestion } from './types';
import { TransferDto } from './dto';

/** How many years back earlier bookings teach the suggestions. */
const LEARN_YEARS = 2;
/** Movements a few days outside the month still match its bookings (and vice versa). */
const EDGE_DAYS = 7;

export interface MatchedBooking {
  bookamatId: number;
  title: string;
  date: string;
  documentNumber: string | null;
  costaccount: string | null;
  attachmentCount: number;
}

export interface MonthEntry {
  tx: BankTx;
  status: 'open' | 'done' | 'ignored';
  match: (Match & { booking: MatchedBooking | null }) | null;
  suggestion: Suggestion | null;
}

export interface MonthCounts {
  month: number;
  open: number;
  done: number;
  ignored: number;
  bookamatOnly: number;
}

interface Loaded {
  txs: BankTx[];
  bookings: HistBooking[];
  byId: Map<number, HistBooking>;
  matches: Map<string, Match>;
  /** Movements marked as needing no booking. */
  ignored: Set<string>;
  bankaccount: string | null;
  invoices: InvoiceRef[];
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (day: string, n: number) => ymd(new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000));
const monthRange = (year: number, month: number) => ({
  from: `${year}-${String(month).padStart(2, '0')}-01`,
  to: ymd(new Date(Date.UTC(year, month, 0))),
});
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Monatsabgleich: which movements on the business account Bookamat still
 * lacks, and the booking form for each, filled in from obolus' invoices and
 * from how earlier payments were booked. The movements are read from Umsatz on
 * every request and never stored; only decisions (linked, ignored,
 * transferred) are.
 */
@Injectable()
export class ReconcileService {
  private readonly logger = new Logger(ReconcileService.name);

  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(BankMatch) private readonly matchRepo: Repository<BankMatch>,
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    private readonly umsatz: UmsatzClient,
    private readonly bookamat: BookamatService,
    private readonly bookamatClient: BookamatClient,
    private readonly invoices: InvoicesService,
    private readonly pdf: PdfService,
    private readonly config: ConfigService,
  ) {}

  /** Open, done and ignored movements per month of a year, and bookings missing at the bank. */
  async year(userId: number, year: number): Promise<{ year: number; months: MonthCounts[] }> {
    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    const data = await this.load(userId, from, to);
    const now = ymd(new Date());
    const months: MonthCounts[] = [];
    for (let month = 1; month <= 12; month++) {
      const range = monthRange(year, month);
      if (range.from > now) break;
      const entries = this.entries(data, range.from, range.to);
      months.push({
        month,
        open: entries.filter((e) => e.status === 'open').length,
        done: entries.filter((e) => e.status === 'done').length,
        ignored: entries.filter((e) => e.status === 'ignored').length,
        bookamatOnly: this.bookamatOnly(data, range.from, range.to).length,
      });
    }
    return { year, months };
  }

  /** One month: every movement with its booking or a filled-in form, and the year's accounts for the selects. */
  async month(userId: number, year: number, month: number) {
    const { from, to } = monthRange(year, month);
    const data = await this.load(userId, from, to);
    const accounts = await this.bookamat.accountsForYear(userId, year);
    const yearAccounts = this.yearAccounts(year, accounts);

    const pairs = [...data.matches.entries()]
      .map(([txId, m]) => ({ tx: data.txs.find((t) => t.id === txId), booking: data.byId.get(m.bookamatId) }))
      .filter((p): p is { tx: BankTx; booking: HistBooking } => !!p.tx && !!p.booking);
    const ctx: SuggestContext = {
      pairs,
      bookings: data.bookings,
      invoices: data.invoices,
      bankaccount: data.bankaccount,
      accounts: accounts.length ? yearAccounts : undefined,
    };

    const entries = this.entries(data, from, to).map((e) =>
      e.status === 'open' ? { ...e, suggestion: suggest(e.tx, ctx) } : e,
    );
    const bookamatOnly = this.bookamatOnly(data, from, to).map((b) => ({
      bookamatId: b.bookamatId,
      title: b.title,
      date: b.date,
      signed: b.signed,
      costaccount: b.amounts?.[0]?.costaccount ?? null,
    }));

    return {
      year,
      month,
      bankaccount: data.bankaccount,
      entries,
      bookamatOnly,
      accounts: {
        bank: accounts.filter((a) => a.kind === 'bank').map((a) => a.name),
        cost: accounts.filter((a) => a.kind === 'cost').map((a) => ({
          name: a.name, group: a.data.group ?? null, purchasetaxaccounts: a.data.purchasetaxaccounts ?? [],
          deductibilityTaxPercent: a.data.deductibilityTaxPercent ?? null,
          deductibilityAmountPercent: a.data.deductibilityAmountPercent ?? null,
        })),
        tax: accounts.filter((a) => a.kind === 'tax').map((a) => ({
          name: a.name, group: a.data.group ?? null, reverseCharge: !!a.data.reverseCharge,
          icReport: !!a.data.icReport, taxValues: a.data.taxValues ?? [],
        })),
        costcentre: accounts.filter((a) => a.kind === 'costcentre').map((a) => a.name),
      },
      counts: {
        open: entries.filter((e) => e.status === 'open').length,
        done: entries.filter((e) => e.status === 'done').length,
        ignored: entries.filter((e) => e.status === 'ignored').length,
        bookamatOnly: bookamatOnly.length,
      },
    };
  }

  /**
   * Bookings of a month a movement can be linked to by hand: unmatched ones,
   * and ones booked as a sum of several movements whose matched movements do
   * not cover the amount yet (`rest`).
   */
  async unmatchedBookings(userId: number, year: number, month: number) {
    const { from, to } = monthRange(year, month);
    const data = await this.load(userId, from, to);
    const covered = new Map<number, number>();
    for (const [txId, m] of data.matches) {
      const amount = data.txs.find((t) => t.id === txId)?.amount ?? NaN;
      covered.set(m.bookamatId, (covered.get(m.bookamatId) ?? 0) + amount);
    }
    return data.bookings
      .filter((b) => b.date >= addDays(from, -EDGE_DAYS) && b.date <= addDays(to, EDGE_DAYS))
      .map((b) => ({
        bookamatId: b.bookamatId, title: b.title, date: b.date, signed: b.signed,
        rest: covered.has(b.bookamatId) ? round2(b.signed - covered.get(b.bookamatId)!) : b.signed,
      }))
      // A sum's rest has the booking's sign; NaN (a matched movement outside the month) counts as covered.
      .filter((b) => !covered.has(b.bookamatId) || (Math.abs(b.rest) >= 0.01 && Math.sign(b.rest) === Math.sign(b.signed)));
  }

  async link(userId: number, umsatzId: string, bookamatId: number) {
    const booking = await this.bookingRepo.findOne({ where: { userId, bookamatId } });
    if (!booking) throw new NotFoundException('Buchung nicht gefunden (Bookamat-Sync nötig?).');
    await this.decide(userId, umsatzId, { bookamatId, ignored: false, transferredAt: null });
    return { ok: true };
  }

  /** Mark as needing no booking; un-ignoring forgets the decision, so it matches automatically again. */
  async ignore(userId: number, umsatzId: string, ignored: boolean) {
    if (ignored) await this.decide(userId, umsatzId, { bookamatId: null, ignored: true, transferredAt: null });
    else await this.matchRepo.delete({ userId, umsatzId, ignored: true });
    return { ok: true };
  }

  /** Forget the decision: the movement is matched automatically again. */
  async reset(userId: number, umsatzId: string) {
    await this.matchRepo.delete({ userId, umsatzId });
    return { ok: true };
  }

  /** Reload from Umsatz on the next request (after importing a statement). */
  refresh() {
    this.umsatz.clearCache();
    return { ok: true };
  }

  /**
   * Create the booking in Bookamat from the (checked, possibly edited) form.
   * `dryRun` returns the request instead. Afterwards: the invoice PDF and an
   * uploaded receipt are attached, the invoice is marked paid if asked, and the
   * year is synced so the booking shows up as matched.
   */
  async transfer(userId: number, dto: TransferDto) {
    const existing = await this.matchRepo.findOne({ where: { userId, umsatzId: dto.umsatzId } });
    if (existing?.bookamatId) {
      throw new ConflictException(existing.transferredAt
        ? `Schon übertragen (Bookamat-Buchung ${existing.bookamatId}).`
        : `Schon mit Bookamat-Buchung ${existing.bookamatId} verknüpft.`);
    }
    const b = dto.booking;
    if (!b.amounts?.length) throw new BadRequestException('Mindestens ein Betrag ist nötig.');

    const year = parseInt((dto.mode === 'book' ? b.date : b.dateInvoice ?? b.date).slice(0, 4), 10);
    const accounts = await this.bookamat.accountsForYear(userId, year);
    if (!accounts.length) {
      throw new BadRequestException(`Für ${year} sind keine Bookamat-Konten bekannt. Jahr in Bookamat anlegen und synchronisieren.`);
    }
    const idOf = (kind: BookamatAccount['kind'], name: string | null | undefined) =>
      name ? accounts.find((a) => a.kind === kind && a.name === name)?.bookamatId : undefined;

    const missing: string[] = [];
    const amounts = b.amounts.map((a) => {
      const bankaccount = idOf('bank', a.bankaccount);
      const costaccount = idOf('cost', a.costaccount);
      const purchasetaxaccount = idOf('tax', a.purchasetaxaccount);
      if (!bankaccount) missing.push(`Zahlungskonto „${a.bankaccount}“`);
      if (!costaccount) missing.push(`Steuerkonto „${a.costaccount}“`);
      if (!purchasetaxaccount) missing.push(`USt-Konto „${a.purchasetaxaccount}“`);
      return {
        bankaccount: bankaccount!,
        costaccount: costaccount!,
        purchasetaxaccount: purchasetaxaccount!,
        amount: a.amount.toFixed(2),
        tax_percent: a.taxPercent.toFixed(2),
        deductibility_tax_percent: a.deductibilityTaxPercent.toFixed(2),
        deductibility_amount_percent: a.deductibilityAmountPercent.toFixed(2),
        ...(a.countryDep ? { country_dep: a.countryDep.toUpperCase() } : {}),
        ...(a.countryRec ? { country_rec: a.countryRec.toUpperCase() } : {}),
      };
    });
    const costcentre = b.costcentre ? idOf('costcentre', b.costcentre) : undefined;
    if (b.costcentre && !costcentre) missing.push(`Kostenstelle „${b.costcentre}“`);
    if (missing.length) throw new BadRequestException(`In Bookamat ${year} nicht aktiviert: ${missing.join(', ')}.`);
    const strict = b.amounts
      .map((a) => accounts.find((x) => x.kind === 'tax' && x.name === a.purchasetaxaccount))
      .find((t) => needsInvoiceDate(t?.data));
    if (strict && !b.dateInvoice) {
      throw new BadRequestException(`Rechnungsdatum fehlt: Bookamat verlangt es beim USt-Konto „${strict.name}“.`);
    }

    const request: BookamatBookingCreate = {
      title: b.title.slice(0, 50),
      ...(dto.mode === 'book' ? { date: b.date } : {}),
      ...(b.dateInvoice ? { date_invoice: b.dateInvoice } : {}),
      ...(b.dateDelivery ? { date_delivery: b.dateDelivery } : {}),
      ...(costcentre ? { costcentre } : {}),
      ...(b.vatin ? { vatin: normalizeVatin(b.vatin) } : {}),
      ...(b.country ? { country: b.country.toUpperCase() } : {}),
      ...(b.description ? { description: b.description } : {}),
      amounts,
    };

    const invoice = dto.invoiceId ? await this.ownInvoice(userId, dto.invoiceId) : null;
    if (dto.dryRun) {
      return {
        dryRun: true,
        year,
        request,
        attachments: [
          ...(invoice && dto.attachInvoice ? [`Rechnung ${invoice.number}.pdf`] : []),
          ...(dto.attachment ? [dto.attachment.name] : []),
        ],
      };
    }

    let created;
    try {
      created = await this.bookamatClient.createBooking(year, request);
    } catch (err) {
      throw new BadRequestException(`Bookamat: ${BookamatClient.describeError(err)}`);
    }
    await this.decide(userId, dto.umsatzId, { bookamatId: created.id, ignored: false, transferredAt: new Date() });

    const warnings: string[] = [];
    if (invoice && dto.attachInvoice) {
      try {
        const file = await this.pdf.generateInvoicePdf(invoice.id);
        await this.bookamatClient.addAttachment(year, created.id, `Rechnung ${invoice.number}.pdf`, file);
      } catch (err) {
        warnings.push(`Rechnungs-PDF nicht angehängt: ${BookamatClient.describeError(err)}`);
      }
    }
    if (dto.attachment) {
      try {
        await this.bookamatClient.addAttachment(year, created.id, dto.attachment.name, Buffer.from(dto.attachment.data, 'base64'));
      } catch (err) {
        warnings.push(`Beleg nicht angehängt: ${BookamatClient.describeError(err)}`);
      }
    }
    if (invoice && dto.markInvoicePaid && dto.mode === 'book' && !invoice.payedAt) {
      await this.invoices.update(userId, invoice.id, { payedAt: b.date } as any);
    }
    try {
      await this.bookamat.syncYear(userId, year);
    } catch (err) {
      warnings.push(`Übertragen, aber der Sync danach schlug fehl: ${(err as Error).message}`);
    }

    this.logger.log(`Transferred movement as Bookamat booking ${created.id} (${year}, ${dto.mode})`);
    return {
      dryRun: false,
      year,
      bookamatId: created.id,
      documentNumber: created.document_number ?? null,
      status: created.status ?? null,
      warnings,
    };
  }

  // ---------------------------------------------------------------- internals

  private async load(userId: number, from: string, to: string): Promise<Loaded> {
    const learnFrom = `${parseInt(from.slice(0, 4), 10) - LEARN_YEARS}-01-01`;
    const until = addDays(to, EDGE_DAYS);

    const [txs, rows, decisionRows, invoiceRows] = await Promise.all([
      this.umsatz.transactions(learnFrom, until),
      this.bookingRepo.find({ where: { userId, date: Between(addDays(learnFrom, -EDGE_DAYS), until) }, order: { date: 'DESC' } }),
      this.matchRepo.find({ where: { userId } }),
      this.invoiceRepo.createQueryBuilder('invoice')
        .innerJoinAndSelect('invoice.client', 'client')
        .where('client.user_id = :userId', { userId })
        .andWhere('invoice.sent_at IS NOT NULL')
        .andWhere('invoice.sent_at >= :since', { since: learnFrom })
        .getMany(),
    ]);

    const all = rows.map((r) => this.toHist(r));
    const decisions: Decision[] = decisionRows.map((d) => ({
      umsatzId: d.umsatzId, bookamatId: d.bookamatId, ignored: !!d.ignored, transferredAt: d.transferredAt,
    }));

    // Which Bookamat Zahlungskonto is the business account: configured, or the
    // one most of the bookings matching these movements were paid from.
    let bankaccount = this.config.get<string>('BOOKAMAT_BANKACCOUNT') || null;
    if (!bankaccount) {
      const first = matchTransactions(txs, all, decisions);
      const counts = new Map<string, number>();
      for (const m of first.values()) {
        const name = all.find((b) => b.bookamatId === m.bookamatId)?.amounts?.[0]?.bankaccount;
        if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
      }
      bankaccount = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    }
    // Bookings paid from another account (Kassa, Kreditkarte) never show on this one.
    const bookings = all.filter((b) => !bankaccount || !b.amounts?.length || b.amounts.some((l) => l.bankaccount === bankaccount));
    const matches = matchTransactions(txs, bookings, decisions);

    const invoices: InvoiceRef[] = invoiceRows.map((i) => ({
      id: i.id,
      number: i.number,
      clientId: i.clientId,
      clientName: i.clientName || i.client?.name || '',
      clientVatNumber: i.clientVatNumber || i.client?.vatNumber || null,
      reverseCharge: !!i.reverseCharge,
      sentAt: i.sentAt,
      payedAt: i.payedAt,
      gross: round2(Number(i.calculatedCost) * (i.reverseCharge ? 1 : 1.2)),
    }));

    return {
      txs,
      bookings,
      byId: new Map(all.map((b) => [b.bookamatId, b])),
      matches,
      ignored: new Set(decisions.filter((d) => d.ignored).map((d) => d.umsatzId)),
      bankaccount,
      invoices,
    };
  }

  private entries(data: Loaded, from: string, to: string): MonthEntry[] {
    return data.txs
      .filter((t) => t.day >= from && t.day <= to)
      .map((tx) => {
        const match = data.matches.get(tx.id);
        if (match) {
          const b = data.byId.get(match.bookamatId);
          return {
            tx,
            status: 'done' as const,
            match: {
              ...match,
              booking: b ? {
                bookamatId: b.bookamatId, title: b.title, date: b.date, documentNumber: b.documentNumber,
                costaccount: b.amounts?.[0]?.costaccount ?? null, attachmentCount: b.attachmentCount,
              } : null,
            },
            suggestion: null,
          };
        }
        return { tx, status: data.ignored.has(tx.id) ? 'ignored' as const : 'open' as const, match: null, suggestion: null };
      });
  }

  private bookamatOnly(data: Loaded, from: string, to: string): HistBooking[] {
    const taken = new Set([...data.matches.values()].map((m) => m.bookamatId));
    return data.bookings.filter((b) => b.date >= from && b.date <= to && !taken.has(b.bookamatId) && b.amounts?.length);
  }

  private toHist(r: Booking): HistBooking {
    const lines = r.amounts;
    const signed = lines?.length
      ? round2(lines.reduce((s, l) => s + (l.group === '1' ? l.amount : -l.amount), 0))
      : round2((r.isIncoming ? 1 : -1) * Number(r.brutto));
    return {
      bookamatId: r.bookamatId,
      title: r.title,
      documentNumber: r.documentNumber,
      date: r.date,
      dateInvoice: r.dateInvoice,
      dateDelivery: r.dateDelivery,
      vatin: r.vatin,
      country: r.country,
      costcentre: r.costcentre,
      description: r.description,
      signed,
      amounts: lines,
      attachmentCount: r.attachmentCount,
    };
  }

  private yearAccounts(year: number, accounts: BookamatAccount[]): YearAccounts {
    return {
      year,
      cost: new Map(accounts.filter((a) => a.kind === 'cost').map((a) => [a.name, a.data])),
      tax: new Map(accounts.filter((a) => a.kind === 'tax').map((a) => [a.name, a.data])),
      bank: new Set(accounts.filter((a) => a.kind === 'bank').map((a) => a.name)),
      costcentre: new Set(accounts.filter((a) => a.kind === 'costcentre').map((a) => a.name)),
    };
  }

  private async ownInvoice(userId: number, id: number): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({ where: { id }, relations: ['client'] });
    if (!invoice || invoice.client.userId !== userId) throw new NotFoundException('Rechnung nicht gefunden.');
    return invoice;
  }

  private async decide(userId: number, umsatzId: string, values: Pick<BankMatch, 'bookamatId' | 'ignored' | 'transferredAt'>) {
    await this.matchRepo.upsert({ userId, umsatzId, ...values }, { conflictPaths: ['userId', 'umsatzId'] });
  }
}

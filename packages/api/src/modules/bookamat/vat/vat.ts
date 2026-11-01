import type { BookamatAccountData, BookingAmountLine, VatMethod, VatPeriod } from '../../../database/entities';
import { KENNZAHLEN, KZ_BY_CODE, KzDef, PAUSCHALE_RATE, VORSTEUER_MINUS, pauschaleCap } from './kennzahlen';

/** The parts of a stored booking the report needs. */
export interface VatBooking {
  id: number;
  bookamatId: number;
  year: number;
  date: string;
  dateInvoice: string | null;
  dateDelivery: string | null;
  title: string;
  documentNumber: string | null;
  vatin: string | null;
  country: string | null;
  attachmentCount: number;
  amounts: BookingAmountLine[] | null;
}

/** Which date put a line into its period. */
export type DateBasis = 'payment' | 'invoice' | 'delivery';

export type ZmType = 'L' | 'S';

/** One amount line of a booking, with what it adds to the UVA and the ZM. */
export interface VatLine {
  bookingId: number;
  bookamatId: number;
  line: number;
  date: string;
  periodDate: string;
  basis: DateBasis;
  title: string;
  documentNumber: string | null;
  vatin: string | null;
  country: string | null;
  dateInvoice: string | null;
  dateDelivery: string | null;
  attachmentCount: number;
  group: string;
  costaccount: string | null;
  purchasetaxaccount: string | null;
  net: number;
  taxPercent: number;
  tax: number;
  gross: number;
  /** Kennzahl → amount (net for base Kennzahlen, tax for tax ones). */
  kz: Record<string, number>;
  zm: { vatin: string | null; type: ZmType } | null;
  /** The VAT account was not found in the stored accounts. */
  unknownAccount: boolean;
}

/** The stored VAT account of a name in (or nearest to) a year. */
export type AccountLookup = (year: number, name: string) => BookamatAccountData | undefined;

export interface Period {
  key: string;
  label: string;
  from: string;
  to: string;
}

export interface UvaRow {
  kz: string;
  label: string;
  kind: KzDef['kind'];
  section: KzDef['section'];
  rate: number | null;
  amount: number;
  /** Tax of a rate Kennzahl (amount × rate); null for the others. */
  tax: number | null;
  lines: number;
}

export interface Uva {
  rows: UvaRow[];
  /** Umsatzsteuer incl. Erwerbsteuer and Steuerschuld nach § 19. */
  ust: number;
  vorsteuer: number;
  /** Positive: Vorauszahlung, negative: Überschuss (Gutschrift). */
  zahllast: number;
  /** Failed plausibility checks of FinanzOnline. */
  checks: string[];
}

export interface ZmRow {
  period: string;
  vatin: string | null;
  type: ZmType;
  amount: number;
  lines: number;
}

const cents = (v: number) => Math.round(v * 100);
const euros = (c: number) => c / 100;
const round2 = (v: number) => euros(cents(v));
const sameRate = (a: number, b: number) => Math.abs(a - b) < 0.001;
const pad = (n: number) => String(n).padStart(2, '0');
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
const fmt = (v: number) => v.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MONTHS = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export function normalizeVatin(v: string | null | undefined): string | null {
  const s = (v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s || null;
}

/**
 * The date that decides a line's period. Ist-Besteuerung takes the payment
 * (the booking's date), Soll-Besteuerung the invoice. Reverse charge and
 * ZM-relevant lines go by the service: Lieferdatum, else Rechnungsdatum.
 */
export function periodDateOf(
  b: Pick<VatBooking, 'date' | 'dateInvoice' | 'dateDelivery'>,
  account: BookamatAccountData | undefined,
  method: VatMethod,
): { date: string; basis: DateBasis } {
  if (account?.reverseCharge || account?.icReport) {
    if (b.dateDelivery) return { date: b.dateDelivery, basis: 'delivery' };
    if (b.dateInvoice) return { date: b.dateInvoice, basis: 'invoice' };
  } else if (method === 'accrual' && b.dateInvoice) {
    return { date: b.dateInvoice, basis: 'invoice' };
  }
  return { date: b.date, basis: 'payment' };
}

/** Split bookings into lines and work out each line's Kennzahlen. */
export function toLines(bookings: VatBooking[], account: AccountLookup, method: VatMethod): VatLine[] {
  const lines: VatLine[] = [];
  for (const b of bookings) {
    (b.amounts ?? []).forEach((a, i) => {
      const acc = a.purchasetaxaccount ? account(b.year, a.purchasetaxaccount) : undefined;
      const net = a.amountAfterTax;
      // Reverse charge: the invoice carries no VAT; the Steuerschuld is the rate on the net.
      const tax = a.taxValue === 0 && acc?.reverseCharge ? round2((net * a.taxPercent) / 100) : a.taxValue;
      const deductible = round2((tax * a.deductibilityTaxPercent) / 100);
      const kz: Record<string, number> = {};
      for (const code of acc?.indexPurchasetax ?? []) {
        const def = KZ_BY_CODE.get(code);
        if (!def) continue;
        if (def.rate != null && !sameRate(def.rate, a.taxPercent)) continue;
        const value = def.kind === 'base' ? net : def.section === 'vorsteuer' ? deductible : tax;
        kz[code] = round2((kz[code] ?? 0) + value);
      }
      const { date: periodDate, basis } = periodDateOf(b, acc, method);
      lines.push({
        bookingId: b.id,
        bookamatId: b.bookamatId,
        line: i,
        date: b.date,
        periodDate,
        basis,
        title: b.title,
        documentNumber: b.documentNumber,
        vatin: b.vatin,
        country: b.country,
        dateInvoice: b.dateInvoice,
        dateDelivery: b.dateDelivery,
        attachmentCount: b.attachmentCount,
        group: a.group,
        costaccount: a.costaccount,
        purchasetaxaccount: a.purchasetaxaccount,
        net,
        taxPercent: a.taxPercent,
        tax,
        gross: a.amount,
        kz,
        zm: a.group === '1' && acc?.icReport
          ? { vatin: normalizeVatin(b.vatin), type: acc.icService ? 'S' : 'L' }
          : null,
        unknownAccount: !!a.purchasetaxaccount && !acc,
      });
    });
  }
  return lines;
}

export function periodsOf(year: number, period: VatPeriod): Period[] {
  if (period === 'month') {
    return MONTHS.map((name, i) => ({
      key: `M${pad(i + 1)}`,
      label: `${name} ${year}`,
      from: `${year}-${pad(i + 1)}-01`,
      to: `${year}-${pad(i + 1)}-${pad(lastDay(year, i + 1))}`,
    }));
  }
  return [1, 2, 3, 4].map((q) => ({
    key: `Q${q}`,
    label: `${q}. Quartal ${year}`,
    from: `${year}-${pad(q * 3 - 2)}-01`,
    to: `${year}-${pad(q * 3)}-${pad(lastDay(year, q * 3))}`,
  }));
}

export function yearPeriod(year: number): Period {
  return { key: 'year', label: `Jahr ${year}`, from: `${year}-01-01`, to: `${year}-12-31` };
}

export const inPeriod = (p: Period) => (l: VatLine) => l.periodDate >= p.from && l.periodDate <= p.to;

/** UVA due on the 15th of the second month after the period, the ZM at the end of the first. */
export function dueDates(p: Period): { uva: string; zm: string } {
  const [y, m] = p.to.split('-').map(Number);
  const add = (n: number) => ({ y: y + Math.floor((m - 1 + n) / 12), m: ((m - 1 + n) % 12) + 1 });
  const u = add(2);
  const z = add(1);
  return { uva: `${u.y}-${pad(u.m)}-15`, zm: `${z.y}-${pad(z.m)}-${pad(lastDay(z.y, z.m))}` };
}

/** Sum the lines into the Kennzahlen, the Zahllast and FinanzOnline's checks. */
export function computeUva(lines: VatLine[]): Uva {
  const sums = new Map<string, { cents: number; lines: number }>();
  for (const l of lines) {
    for (const [code, value] of Object.entries(l.kz)) {
      const s = sums.get(code) ?? { cents: 0, lines: 0 };
      s.cents += cents(value);
      s.lines += 1;
      sums.set(code, s);
    }
  }
  const amount = (code: string) => euros(sums.get(code)?.cents ?? 0);

  let ustCents = 0;
  let vorsteuerCents = 0;
  const rows: UvaRow[] = [];
  for (const def of KENNZAHLEN) {
    const s = sums.get(def.kz);
    if (!s && def.kz !== '000') continue;
    const value = euros(s?.cents ?? 0);
    const rowTax = def.rate != null ? round2((value * def.rate) / 100) : null;
    if (rowTax != null) ustCents += cents(rowTax);
    else if (def.kind === 'tax' && def.section === 'umsatz') ustCents += cents(value);
    else if (def.kind === 'tax' && def.section === 'vorsteuer') {
      vorsteuerCents += VORSTEUER_MINUS.has(def.kz) ? -cents(value) : cents(value);
    }
    rows.push({
      kz: def.kz,
      label: def.label,
      kind: def.kind,
      section: def.section,
      rate: def.rate ?? null,
      amount: value,
      tax: rowTax,
      lines: s?.lines ?? 0,
    });
  }

  const sum = (codes: string[]) => euros(codes.reduce((acc, c) => acc + cents(amount(c)), 0));
  const checks: string[] = [];
  const taxable = euros(cents(amount('000')) + cents(amount('001')) - cents(amount('021')));
  const free = sum(['011', '012', '015', '016', '017', '018', '019', '020']);
  const rated = sum(['006', '007', '022', '029', '037', '052', '124']);
  if (free > taxable) {
    checks.push(`Die steuerfreien Umsätze (${fmt(free)}) sind größer als die steuerbaren (${fmt(taxable)}).`);
  }
  if (cents(rated) !== cents(taxable) - cents(free)) {
    checks.push(
      `Die Umsätze nach Steuersätzen (${fmt(rated)}) ergeben nicht KZ 000 abzüglich steuerfreier Umsätze `
      + `(${fmt(euros(cents(taxable) - cents(free)))}). Meist fehlt bei einer Buchung der Steuersatz oder das USt-Konto passt nicht.`,
    );
  }
  const erwerb = sum(['008', '072', '073', '088', '125']);
  if (sums.has('070') || erwerb !== 0) {
    if (amount('071') > amount('070')) checks.push('KZ 071 ist größer als KZ 070.');
    if (cents(erwerb) !== cents(amount('070')) - cents(amount('071'))) {
      checks.push(`Die Erwerbe nach Steuersätzen (${fmt(erwerb)}) ergeben nicht KZ 070 abzüglich KZ 071.`);
    }
  }
  if ((sums.has('065') || sums.has('071')) && !sums.has('070')) {
    checks.push('KZ 065 und KZ 071 gibt es nur zusammen mit KZ 070.');
  }
  for (const [vst, schuld] of [['066', '057'], ['082', '048'], ['087', '044'], ['089', '032']]) {
    if (amount(vst) > amount(schuld)) {
      checks.push(`KZ ${vst} (${fmt(amount(vst))}) darf nicht höher sein als KZ ${schuld} (${fmt(amount(schuld))}).`);
    }
  }

  return {
    rows,
    ust: euros(ustCents),
    vorsteuer: euros(vorsteuerCents),
    zahllast: euros(ustCents - vorsteuerCents),
    checks,
  };
}

/** ZM rows per period, UID and type (Lieferung/sonstige Leistung). */
export function computeZm(lines: VatLine[], periods: Period[]): ZmRow[] {
  const rows = new Map<string, ZmRow & { cents: number }>();
  for (const l of lines) {
    if (!l.zm) continue;
    const p = periods.find((x) => l.periodDate >= x.from && l.periodDate <= x.to);
    if (!p) continue;
    const key = `${p.key}|${l.zm.vatin ?? ''}|${l.zm.type}`;
    const row = rows.get(key) ?? { period: p.key, vatin: l.zm.vatin, type: l.zm.type, amount: 0, lines: 0, cents: 0 };
    row.cents += cents(l.net);
    row.lines += 1;
    rows.set(key, row);
  }
  return [...rows.values()]
    .map(({ cents: c, ...r }) => ({ ...r, amount: euros(c) }))
    .sort((a, b) => a.period.localeCompare(b.period) || (a.vatin ?? '').localeCompare(b.vatin ?? '') || a.type.localeCompare(b.type));
}

/**
 * Vorsteuerpauschale per period: 1,8 % of KZ 000, the year's cap used up in
 * order. Pass the periods of one year in order.
 */
export function pauschalen(year: number, kz000: number[]): number[] {
  let left = cents(pauschaleCap(year));
  return kz000.map((v) => {
    const c = Math.max(0, Math.min(cents((v * PAUSCHALE_RATE) / 100), left));
    left -= c;
    return euros(c);
  });
}

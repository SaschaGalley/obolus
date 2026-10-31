import type { BookamatAccountData } from '../../../database/entities/bookamat-account.entity';
import type { BookingAmountLine } from '../../../database/entities/booking.entity';
import { BankTx, Field, FieldKey, HistBooking, InvoiceRef, Profile, Suggestion } from './types';
import { daysBetween, sameAmount } from './matcher';

/** The accounts activated in the booking's year, by name. */
export interface YearAccounts {
  year: number;
  cost: Map<string, BookamatAccountData>;
  tax: Map<string, BookamatAccountData>;
  bank: Set<string>;
  costcentre: Set<string>;
}

export interface SuggestContext {
  /** Earlier movements and the bookings they matched: how this account's payments were booked. */
  pairs: { tx: BankTx; booking: HistBooking }[];
  /** All stored bookings, newest first. */
  bookings: HistBooking[];
  /** Sent invoices an incoming payment may settle. */
  invoices: InvoiceRef[];
  /** Bookamat name of the business account's Zahlungskonto. */
  bankaccount: string | null;
  /** Activated accounts of the payment's year, to check the suggestion against; absent = unchecked. */
  accounts?: YearAccounts;
}

/** How many of the newest similar bookings the date rules look at. */
const RULE_WINDOW = 6;
const TITLE_MAX = 50;

// ---------------------------------------------------------------- dates

const ymd = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const parts = (day: string) => day.split('-').map(Number) as [number, number, number];

/** Last day of the month of `day`, shifted by `offset` months. */
export function monthEnd(day: string, offset = 0): string {
  const [y, m] = parts(day);
  const last = new Date(Date.UTC(y, m - 1 + offset + 1, 0));
  return ymd(last.getUTCFullYear(), last.getUTCMonth() + 1, last.getUTCDate());
}

const monthIndex = (day: string) => {
  const [y, m] = parts(day);
  return y * 12 + (m - 1);
};

type DeliveryRule = 'empty' | 'same' | 'prevMonthEnd' | 'monthEnd' | 'payment' | 'other';

const DELIVERY_LABEL: Record<DeliveryRule, string> = {
  empty: 'bisher leer',
  same: 'wie bisher: = Rechnungsdatum',
  prevMonthEnd: 'Regel: Monatsletzter vor der Rechnung',
  monthEnd: 'Regel: Monatsletzter des Rechnungsmonats',
  payment: 'wie bisher: = Zahlungsdatum',
  other: 'bisher unregelmäßig, bitte eintragen',
};

function deliveryRuleOf(b: HistBooking): DeliveryRule {
  if (!b.dateDelivery) return 'empty';
  const ref = b.dateInvoice ?? b.date;
  if (b.dateDelivery === ref) return 'same';
  if (b.dateDelivery === monthEnd(ref, -1)) return 'prevMonthEnd';
  if (b.dateDelivery === monthEnd(ref)) return 'monthEnd';
  if (b.dateDelivery === b.date) return 'payment';
  return 'other';
}

function applyDeliveryRule(rule: DeliveryRule, invoiceDay: string, paymentDay: string): string | null {
  switch (rule) {
    case 'same': return invoiceDay;
    case 'prevMonthEnd': return monthEnd(invoiceDay, -1);
    case 'monthEnd': return monthEnd(invoiceDay);
    case 'payment': return paymentDay;
    default: return null;
  }
}

/** The most frequent value; ties go to the one seen first (the newest). */
function majority<T>(values: T[]): T | undefined {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: T | undefined;
  let bestCount = 0;
  for (const v of values) {
    const c = counts.get(v)!;
    if (c > bestCount) { best = v; bestCount = c; }
  }
  return best;
}

// ---------------------------------------------------------------- titles

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const shiftMonth = (month: number, year: number, by: number) => {
  const idx = year * 12 + (month - 1) + by;
  return { month: (idx % 12) + 1, year: Math.floor(idx / 12) };
};
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Carry an earlier booking's title over to a new one: the invoice number
 * swapped for the new one (any number of the same shape), and month or year
 * tokens moved by as many months as the new booking lies after the old one
 * ("OpenAI 09/2026" a month later → "OpenAI 10/2026").
 */
export function deriveTitle(prev: string, prevRef: string, newRef: string, invoiceNumber?: string | null): string {
  let title = prev;
  if (invoiceNumber) {
    const shape = new RegExp(escapeRe(invoiceNumber).replace(/\d/g, '\\d'));
    if (shape.test(title)) return title.replace(shape, invoiceNumber).slice(0, TITLE_MAX);
  }
  const by = monthIndex(newRef) - monthIndex(prevRef);
  if (by === 0) return title.slice(0, TITLE_MAX);
  let found = false;
  const pad = (n: number) => String(n).padStart(2, '0');

  // 09/2026, 9.2026, 09-2026
  title = title.replace(/\b(0?[1-9]|1[0-2])([/.-])(20\d{2})\b/g, (_, m, sep, y) => {
    found = true;
    const s = shiftMonth(+m, +y, by);
    return `${m.length === 2 ? pad(s.month) : s.month}${sep}${s.year}`;
  });
  // 2026-09
  title = title.replace(/\b(20\d{2})-(0[1-9]|1[0-2])\b/g, (_, y, m) => {
    found = true;
    const s = shiftMonth(+m, +y, by);
    return `${s.year}-${pad(s.month)}`;
  });
  // 09/26
  title = title.replace(/\b(0[1-9]|1[0-2])\/(\d{2})\b(?!\d)/g, (_, m, y) => {
    found = true;
    const s = shiftMonth(+m, 2000 + +y, by);
    return `${pad(s.month)}/${String(s.year).slice(2)}`;
  });
  // September 2026, September
  const prevYear = parts(prevRef)[0];
  title = title.replace(new RegExp(`\\b(${MONTHS.join('|')})(\\s+(20\\d{2}))?\\b`, 'g'), (_, name, __, y) => {
    found = true;
    const s = shiftMonth(MONTHS.indexOf(name) + 1, y ? +y : prevYear, by);
    return y ? `${MONTHS[s.month - 1]} ${s.year}` : MONTHS[s.month - 1];
  });
  // A bare year only when nothing finer was there: "Jahresabo 2025" → "Jahresabo 2026".
  if (!found) {
    const newYear = parts(newRef)[0];
    if (newYear !== prevYear) title = title.replace(new RegExp(`\\b${prevYear}\\b`), String(newYear));
  }
  return title.slice(0, TITLE_MAX);
}

// ---------------------------------------------------------------- similarity

/** Words of a bank text that say nothing about who was paid. */
const NOISE = new Set([
  'gmbh', 'sepa', 'lastschrift', 'kartenzahlung', 'zahlung', 'überweisung', 'ueberweisung', 'auftrag',
  'referenz', 'payment', 'einzug', 'debit', 'card', 'visa', 'mastercard', 'www', 'com', 'gutschrift',
  'online', 'europe', 'limited', 'ltd', 'inc', 'bank', 'konto', 'euro', 'subscription', 'rechnung',
]);

export const words = (text: string | null | undefined): string[] =>
  (text ?? '').toLowerCase().split(/[^a-zäöüß]+/).filter((w) => w.length >= 4 && !NOISE.has(w));

export const normalizeVatin = (v: string | null | undefined) => (v ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();

/** ISO country of a UID's prefix (Greece writes EL). */
export function countryOfVatin(vatin: string | null | undefined): string | null {
  const m = /^([A-Z]{2})/.exec(normalizeVatin(vatin));
  if (!m) return null;
  return m[1] === 'EL' ? 'GR' : m[1];
}

const sameSign = (tx: BankTx, b: HistBooking) => Math.sign(tx.amount) === Math.sign(b.signed);

/** An incoming payment's invoice: its number in the text, or its amount with the client's name, or its amount alone if unique. */
export function findInvoice(tx: BankTx, invoices: InvoiceRef[]): InvoiceRef | null {
  if (tx.amount <= 0) return null;
  const text = `${tx.description} ${tx.merchant ?? ''}`;
  const compact = text.replace(/\s+/g, '').toLowerCase();
  const sent = invoices.filter((i) => i.sentAt && i.sentAt <= tx.day);
  const open = (i: InvoiceRef) => !i.payedAt || daysBetween(i.payedAt, tx.day) <= 10;

  const byNumber = sent.filter((i) => i.number && compact.includes(i.number.replace(/\s+/g, '').toLowerCase()));
  if (byNumber.length) return byNumber.find((i) => sameAmount(i.gross, tx.amount)) ?? byNumber[0];

  const byAmount = sent.filter((i) => sameAmount(i.gross, tx.amount) && open(i));
  const textWords = new Set(words(text));
  const byName = byAmount.filter((i) => words(i.clientName).some((w) => textWords.has(w)));
  if (byName.length) return byName[0];
  return byAmount.length === 1 ? byAmount[0] : null;
}

interface Similar {
  basis: Suggestion['basis'];
  label: string;
  bookings: HistBooking[];
}

function findSimilar(tx: BankTx, invoice: InvoiceRef | null, ctx: SuggestContext): Similar {
  const newestFirst = (list: HistBooking[]) =>
    [...new Map(list.map((b) => [b.bookamatId, b])).values()].sort((a, b) => b.date.localeCompare(a.date));

  if (invoice) {
    const vat = normalizeVatin(invoice.clientVatNumber);
    const clientWords = words(invoice.clientName);
    const hits = ctx.bookings.filter((b) => b.signed > 0 && (
      (vat && normalizeVatin(b.vatin) === vat) ||
      clientWords.some((w) => b.title.toLowerCase().includes(w))
    ));
    if (hits.length) return { basis: 'invoice', label: `wie bisher bei ${invoice.clientName}`, bookings: newestFirst(hits) };
  }

  if (tx.merchantId) {
    const hits = ctx.pairs.filter((p) => p.tx.merchantId === tx.merchantId && p.tx.id !== tx.id).map((p) => p.booking);
    if (hits.length) return { basis: 'history', label: `wie bisher bei ${tx.merchant ?? 'diesem Händler'}`, bookings: newestFirst(hits) };
  }

  const txWords = words(tx.merchant || tx.description);
  if (txWords.length) {
    let best: HistBooking[] = [];
    let bestScore = 0;
    for (const b of ctx.bookings) {
      if (!sameSign(tx, b)) continue;
      const title = b.title.toLowerCase();
      const score = txWords.filter((w) => title.includes(w)).length;
      if (score > bestScore) { best = [b]; bestScore = score; } else if (score && score === bestScore) best.push(b);
    }
    if (best.length) return { basis: 'history', label: `Titel ähnlich („${best[0].title}“)`, bookings: newestFirst(best) };
  }

  if (tx.category) {
    const hits = ctx.pairs.filter((p) => p.tx.category === tx.category && sameSign(tx, p.booking) && p.tx.id !== tx.id).map((p) => p.booking);
    if (hits.length) {
      // The most common way this category was booked, not merely the newest.
      const top = majority(hits.filter((b) => b.amounts?.length).map(signatureOf));
      const bookings = newestFirst(hits.filter((b) => b.amounts?.length && signatureOf(b) === top));
      if (bookings.length) return { basis: 'category', label: `meist so bei Kategorie „${tx.category}“`, bookings };
    }
  }

  if (invoice) {
    // A first invoice to a new client: the newest income from the same country, else any income.
    const country = countryOfVatin(invoice.clientVatNumber);
    const income = ctx.bookings.filter((b) => b.signed > 0 && b.amounts?.length);
    const sameCountry = income.filter((b) => country && countryOfVatin(b.vatin) === country);
    const pick = sameCountry.length ? sameCountry : income;
    if (pick.length) {
      return { basis: 'category', label: sameCountry.length ? `wie Einnahmen aus ${country}` : 'wie die letzte Einnahme', bookings: newestFirst(pick).slice(0, 1) };
    }
  }

  return { basis: 'none', label: 'noch nie so gebucht', bookings: [] };
}

/** What makes two bookings "booked the same way": accounts, rates, shares, countries — not amount, dates, title or UID. */
export function signatureOf(b: HistBooking): string {
  const l = b.amounts?.[0];
  if (!l) return '';
  return JSON.stringify([l.costaccount, l.purchasetaxaccount, l.taxPercent, l.deductibilityTaxPercent, l.deductibilityAmountPercent, l.countryDep, l.countryRec, b.costcentre]);
}

export function profileLabel(l: BookingAmountLine): string {
  const tax = l.purchasetaxaccount ? ` · ${l.purchasetaxaccount}` : '';
  const rate = l.taxPercent ? ` ${l.taxPercent} %` : '';
  return `${l.costaccount ?? '?'}${tax}${rate}`;
}

// ---------------------------------------------------------------- suggestion

/**
 * The filled-in Bookamat form for one movement, each value with where it came
 * from. Everything is derived from obolus' invoices and how earlier payments
 * were booked; nothing is sent anywhere.
 */
export function suggest(tx: BankTx, ctx: SuggestContext): Suggestion {
  const invoice = findInvoice(tx, ctx.invoices);
  const similar = findSimilar(tx, invoice, ctx);
  const withLines = similar.bookings.filter((b) => b.amounts?.length);
  const chosen = withLines[0] ?? null;
  const line = chosen?.amounts?.[0] ?? null;
  const signature = chosen ? signatureOf(chosen) : '';
  const sameCount = withLines.filter((b) => signatureOf(b) === signature).length;
  const warnings: string[] = [];

  const known = (n: number) => (similar.basis === 'category' ? similar.label : n > 1 ? `wie ${n}× zuvor` : 'wie zuletzt');
  const fromHistory = sameCount ? known(sameCount) : 'neu, bitte wählen';
  const newRef = invoice?.sentAt ?? tx.day;
  const window = similar.bookings.slice(0, RULE_WINDOW);

  // Rechnungsdatum
  let dateInvoice: Field;
  if (invoice?.sentAt) {
    dateInvoice = { value: invoice.sentAt, source: `Rechnung ${invoice.number}` };
  } else if (!window.length) {
    dateInvoice = { value: tx.day, source: 'geschätzt, Beleg prüfen', estimated: true };
  } else {
    const rule = majority(window.map((b) => (!b.dateInvoice ? 'empty' : b.dateInvoice === b.date ? 'payment' : 'other')));
    dateInvoice = rule === 'empty'
      ? { value: null, source: 'bisher leer' }
      : rule === 'payment'
        ? { value: tx.day, source: 'wie bisher: = Zahlungsdatum' }
        : { value: tx.day, source: 'geschätzt, Beleg prüfen', estimated: true };
  }

  // Lieferdatum
  let dateDelivery: Field;
  const invoiceDay = (dateInvoice.value as string | null) ?? tx.day;
  if (window.length) {
    const rule = majority(window.map(deliveryRuleOf))!;
    const value = applyDeliveryRule(rule, invoiceDay, tx.day);
    dateDelivery = { value, source: DELIVERY_LABEL[rule], estimated: rule === 'other' };
  } else if (invoice) {
    dateDelivery = { value: monthEnd(invoiceDay, -1), source: 'Standard: Monatsletzter vor der Rechnung' };
  } else {
    dateDelivery = { value: null, source: 'leer' };
  }

  // Titel
  let title: Field;
  if (similar.basis !== 'category' && similar.bookings[0]) {
    const prev = similar.bookings[0];
    title = { value: deriveTitle(prev.title, prev.dateInvoice ?? prev.date, newRef, invoice?.number), source: `nach „${prev.title}“` };
  } else if (invoice) {
    title = { value: `${invoice.number} ${invoice.clientName}`.slice(0, TITLE_MAX), source: `Rechnung ${invoice.number}` };
  } else {
    title = { value: (tx.merchant || tx.description).trim().slice(0, TITLE_MAX), source: 'Kontoauszug', estimated: true };
  }

  // UID und Land
  const prevVatin = similar.basis === 'category' ? null : similar.bookings.find((b) => b.vatin)?.vatin ?? null;
  const vatin: Field = invoice?.clientVatNumber
    ? { value: normalizeVatin(invoice.clientVatNumber), source: 'Obolus-Kunde' }
    : prevVatin
      ? { value: prevVatin, source: 'wie zuletzt' }
      : { value: null, source: 'leer' };
  const prevCountry = similar.basis === 'category' ? null : similar.bookings.find((b) => b.country)?.country ?? null;
  const vatinCountry = countryOfVatin(vatin.value as string | null);
  const country: Field = vatinCountry
    ? { value: vatinCountry, source: 'aus der UID' }
    : prevCountry ? { value: prevCountry, source: 'wie zuletzt' } : { value: null, source: 'leer' };

  const fields: Record<FieldKey, Field> = {
    title,
    date: { value: tx.day, source: 'Kontoauszug' },
    dateInvoice,
    dateDelivery,
    bankaccount: ctx.bankaccount
      ? { value: ctx.bankaccount, source: 'Geschäftskonto' }
      : { value: line?.bankaccount ?? null, source: line ? 'wie zuletzt' : 'bitte wählen', estimated: !line },
    costaccount: { value: line?.costaccount ?? null, source: fromHistory, estimated: !line || similar.basis === 'category' },
    purchasetaxaccount: { value: line?.purchasetaxaccount ?? null, source: fromHistory, estimated: !line || similar.basis === 'category' },
    amount: { value: Math.abs(tx.amount), source: 'Kontoauszug' },
    taxPercent: { value: line ? line.taxPercent : null, source: fromHistory, estimated: !line },
    deductibilityTaxPercent: { value: line ? line.deductibilityTaxPercent : 100, source: line ? fromHistory : 'Standard' },
    deductibilityAmountPercent: { value: line ? line.deductibilityAmountPercent : 100, source: line ? fromHistory : 'Standard' },
    vatin,
    country,
    countryDep: { value: line?.countryDep ?? null, source: line?.countryDep ? fromHistory : 'leer' },
    countryRec: { value: line?.countryRec ?? null, source: line?.countryRec ? fromHistory : 'leer' },
    costcentre: { value: chosen?.costcentre ?? null, source: chosen?.costcentre ? fromHistory : 'leer' },
    description: { value: null, source: 'leer' },
  };

  if (invoice && !sameAmount(invoice.gross, tx.amount)) {
    warnings.push(`Betrag weicht von Rechnung ${invoice.number} ab (${invoice.gross.toFixed(2)} €).`);
  }
  if (withLines.length > 1 && signatureOf(withLines[1]) !== signature) {
    warnings.push(`Zuletzt anders gebucht als davor („${withLines[1].title}“: ${profileLabel(withLines[1].amounts![0])}).`);
  }
  warnings.push(...validate(fields, ctx.accounts));

  const profile: Profile | null = line ? { label: profileLabel(line), count: sameCount } : null;
  return {
    basis: similar.basis,
    basisLabel: similar.label,
    similar: similar.bookings.slice(0, 3).map((b) => ({ bookamatId: b.bookamatId, title: b.title, date: b.date })),
    profile,
    invoice,
    fields,
    warnings,
  };
}

/** What Bookamat would reject or what is likely wrong, checked against the year's activated accounts. */
export function validate(fields: Record<FieldKey, Field>, accounts?: YearAccounts): string[] {
  const out: string[] = [];
  const cost = fields.costaccount.value as string | null;
  const tax = fields.purchasetaxaccount.value as string | null;
  const rate = fields.taxPercent.value as number | null;
  const bank = fields.bankaccount.value as string | null;
  if (!accounts) return out;

  if (bank && accounts.bank.size && !accounts.bank.has(bank)) out.push(`Zahlungskonto „${bank}“ gibt es ${accounts.year} in Bookamat nicht.`);
  const costData = cost ? accounts.cost.get(cost) : undefined;
  if (cost && accounts.cost.size && !costData) out.push(`Steuerkonto „${cost}“ ist ${accounts.year} in Bookamat nicht aktiviert.`);
  const taxData = tax ? accounts.tax.get(tax) : undefined;
  if (tax && accounts.tax.size && !taxData) out.push(`USt-Konto „${tax}“ ist ${accounts.year} in Bookamat nicht aktiviert.`);
  if (cost && tax && costData?.purchasetaxaccounts?.length && !costData.purchasetaxaccounts.includes(tax)) {
    out.push(`USt-Konto „${tax}“ ist beim Steuerkonto „${cost}“ nicht erlaubt.`);
  }
  if (taxData?.taxValues?.length && rate != null && !taxData.taxValues.some((v) => Math.abs(v - rate) < 0.001)) {
    out.push(`USt-Satz ${rate} % passt nicht zu „${tax}“ (erlaubt: ${taxData.taxValues.join(', ')} %).`);
  }
  // Zusammenfassende Meldung needs the UID; reverse charge from outside the EU has none.
  if (taxData?.icReport && !fields.vatin.value) {
    out.push(`„${tax}“ braucht eine UID, die fehlt noch.`);
  }
  return out;
}

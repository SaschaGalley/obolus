import { BankTx, Decision, HistBooking } from './types';

export interface Match {
  bookamatId: number;
  /**
   * `manual` = linked by hand, `transferred` = created from obolus, `auto` = same amount, close date,
   * `sum` = one of several movements of a day that together make up the booking.
   */
  via: 'manual' | 'transferred' | 'auto' | 'sum';
  /** Days between payment and booking date (auto and sum matches). */
  dayDiff?: number;
  /** `sum`: how many movements the booking is made of. */
  parts?: number;
}

/** How far a booking's date may lie from the payment for an automatic match. */
export const MAX_DAY_DIFF = 5;

/** At most this many movements are added up to one booking. */
const MAX_PARTS = 4;
/** Days with more movements of one sign are not searched for sums. */
const MAX_DAY_GROUP = 12;

const DAY_MS = 86_400_000;

export const daysBetween = (a: string, b: string): number =>
  Math.round(Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / DAY_MS);

export const sameAmount = (a: number, b: number): boolean => Math.abs(a - b) < 0.005;

/**
 * Pair bank movements with Bookamat bookings.
 *
 * Stored decisions win: a movement linked or transferred keeps its booking, an
 * ignored one gets none. The rest pair automatically when the signed amount is
 * equal to the cent and the dates lie at most `maxDays` apart — in the
 * Einnahmen-Ausgaben-Rechnung the booking date is the payment date, so this is
 * tight. Closest dates pair first, so two equal amounts in a month (a monthly
 * subscription) each find their own booking. Movements left over may still
 * add up to one booking (`matchSums`).
 */
export function matchTransactions(
  txs: BankTx[],
  bookings: HistBooking[],
  decisions: Decision[],
  maxDays = MAX_DAY_DIFF,
): Map<string, Match> {
  const matches = new Map<string, Match>();
  const taken = new Set<number>();
  // A decision that neither links nor ignores (left over) does not keep a movement from matching.
  const decided = new Map(decisions.filter((d) => d.ignored || d.bookamatId != null).map((d) => [d.umsatzId, d]));

  for (const d of decisions) {
    if (d.ignored || d.bookamatId == null) continue;
    matches.set(d.umsatzId, { bookamatId: d.bookamatId, via: d.transferredAt ? 'transferred' : 'manual' });
    taken.add(d.bookamatId);
  }

  const candidates: { tx: BankTx; booking: HistBooking; dayDiff: number }[] = [];
  for (const tx of txs) {
    if (decided.has(tx.id)) continue;
    for (const booking of bookings) {
      if (taken.has(booking.bookamatId) || !sameAmount(tx.amount, booking.signed)) continue;
      const dayDiff = daysBetween(tx.day, booking.date);
      if (dayDiff <= maxDays) candidates.push({ tx, booking, dayDiff });
    }
  }
  candidates.sort((a, b) => a.dayDiff - b.dayDiff || a.tx.day.localeCompare(b.tx.day) || a.booking.bookamatId - b.booking.bookamatId);

  for (const { tx, booking, dayDiff } of candidates) {
    if (matches.has(tx.id) || taken.has(booking.bookamatId)) continue;
    matches.set(tx.id, { bookamatId: booking.bookamatId, via: 'auto', dayDiff });
    taken.add(booking.bookamatId);
  }

  const open = txs.filter((t) => !decided.has(t.id) && !matches.has(t.id));
  for (const { parts, booking, dayDiff } of matchSums(open, bookings.filter((b) => !taken.has(b.bookamatId)), maxDays)) {
    for (const t of parts) matches.set(t.id, { bookamatId: booking.bookamatId, via: 'sum', dayDiff, parts: parts.length });
  }
  return matches;
}

/**
 * Several movements of one day booked as one sum (two standing orders, one
 * Privatentnahme): movements of the same day and sign whose total equals a
 * booking to the cent. Only unambiguous combinations count — a booking that
 * more than one combination adds up to, or a movement that is part of more
 * than one, stays open.
 */
function matchSums(txs: BankTx[], bookings: HistBooking[], maxDays: number) {
  const cents = (n: number) => Math.round(n * 100);
  const groups = new Map<string, BankTx[]>();
  for (const t of txs) {
    const key = `${t.day}${t.amount < 0 ? '-' : '+'}`;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }

  const found: { parts: BankTx[]; booking: HistBooking; dayDiff: number }[] = [];
  for (const group of groups.values()) {
    if (group.length < 2 || group.length > MAX_DAY_GROUP) continue;
    const near = bookings.filter((b) => daysBetween(group[0].day, b.date) <= maxDays);
    if (!near.length) continue;
    for (const parts of subsets(group, 2, MAX_PARTS)) {
      const total = parts.reduce((s, t) => s + cents(t.amount), 0);
      for (const b of near) {
        if (cents(b.signed) === total) found.push({ parts, booking: b, dayDiff: daysBetween(group[0].day, b.date) });
      }
    }
  }

  const perBooking = countBy(found.map((f) => String(f.booking.bookamatId)));
  const perTx = countBy(found.flatMap((f) => f.parts.map((t) => t.id)));
  return found.filter((f) => perBooking.get(String(f.booking.bookamatId)) === 1 && f.parts.every((t) => perTx.get(t.id) === 1));
}

function* subsets<T>(items: T[], min: number, max: number, start = 0, picked: T[] = []): Generator<T[]> {
  if (picked.length >= min) yield picked;
  if (picked.length === max) return;
  for (let i = start; i < items.length; i++) yield* subsets(items, min, max, i + 1, [...picked, items[i]]);
}

const countBy = (keys: string[]) => keys.reduce((m, k) => m.set(k, (m.get(k) ?? 0) + 1), new Map<string, number>());

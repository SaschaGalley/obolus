import { BankTx, Decision, HistBooking } from './types';

export interface Match {
  bookamatId: number;
  /** `manual` = linked by hand, `transferred` = created from obolus, `auto` = same amount, close date. */
  via: 'manual' | 'transferred' | 'auto';
  /** Days between payment and booking date (auto matches). */
  dayDiff?: number;
}

/** How far a booking's date may lie from the payment for an automatic match. */
export const MAX_DAY_DIFF = 5;

const DAY_MS = 86_400_000;

export const daysBetween = (a: string, b: string): number =>
  Math.round(Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / DAY_MS);

export const sameAmount = (a: number, b: number): boolean => Math.abs(a - b) < 0.005;

/**
 * Pair bank movements with Bookamat bookings, one to one.
 *
 * Stored decisions win: a movement linked or transferred keeps its booking, an
 * ignored one gets none. The rest pair automatically when the signed amount is
 * equal to the cent and the dates lie at most `maxDays` apart — in the
 * Einnahmen-Ausgaben-Rechnung the booking date is the payment date, so this is
 * tight. Closest dates pair first, so two equal amounts in a month (a monthly
 * subscription) each find their own booking.
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
  return matches;
}

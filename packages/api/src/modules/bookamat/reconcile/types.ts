import type { BookingAmountLine } from '../../../database/entities/booking.entity';

/**
 * A movement on the business account, or on another account where it was
 * switched to obolus in Umsatz (a business expense paid privately), as Umsatz
 * sends it (`/integrations/obolus/transactions`).
 */
export interface BankTx {
  id: string;
  day: string;                 // YYYY-MM-DD
  /** Umsatz' name of the account it is on. */
  account: string;
  /** False when it is on another account and was switched to obolus. */
  businessAccount: boolean;
  amount: number;              // signed: + in, − out
  currency: string;
  description: string;
  type: string | null;
  merchant: string | null;
  merchantId: string | null;
  category: string | null;
  categoryKind: string | null;
}

/** What the reconciliation needs of a stored Bookamat booking. */
export interface HistBooking {
  bookamatId: number;
  title: string;
  documentNumber: string | null;
  date: string;
  dateInvoice: string | null;
  dateDelivery: string | null;
  vatin: string | null;
  country: string | null;
  costcentre: string | null;
  description: string | null;
  /** Signed brutto as it hits the account: + Einnahme, − Ausgabe. */
  signed: number;
  /** NULL when the row was seeded before the full fields were synced. */
  amounts: BookingAmountLine[] | null;
  attachmentCount: number;
}

/** An obolus invoice, for matching incoming payments. */
export interface InvoiceRef {
  id: number;
  number: string;
  clientId: number;
  clientName: string;
  clientVatNumber: string | null;
  reverseCharge: boolean;
  sentAt: string | null;
  payedAt: string | null;
  gross: number;
}

/** A stored decision (`obulus_bank_matches`). */
export interface Decision {
  umsatzId: string;
  bookamatId: number | null;
  ignored: boolean;
  transferredAt: Date | string | null;
}

/** The fields of a Bookamat booking form, in Bookamat's order. */
export const FIELD_KEYS = [
  'title', 'date', 'dateInvoice', 'dateDelivery',
  'bankaccount', 'costaccount', 'purchasetaxaccount',
  'amount', 'taxPercent', 'deductibilityTaxPercent', 'deductibilityAmountPercent',
  'vatin', 'country', 'countryDep', 'countryRec', 'costcentre', 'description',
] as const;
export type FieldKey = typeof FIELD_KEYS[number];

/** One suggested value and where it comes from, said for the page. */
export interface Field {
  value: string | number | null;
  source: string;
  /** Guessed rather than known: the page marks it for checking. */
  estimated?: boolean;
}

/** A field set that was booked identically before (signature of a booking). */
export interface Profile {
  label: string;
  count: number;
}

export interface Suggestion {
  /** What the suggestion rests on. */
  basis: 'invoice' | 'history' | 'category' | 'none';
  basisLabel: string;
  /** Similar earlier bookings (newest first, at most a few) to show as evidence. */
  similar: { bookamatId: number; title: string; date: string }[];
  profile: Profile | null;
  invoice: InvoiceRef | null;
  fields: Record<FieldKey, Field>;
  warnings: string[];
}

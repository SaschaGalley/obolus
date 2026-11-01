// Shapes of /bookamat/reconcile responses (see api/src/modules/bookamat/reconcile).

export interface BankTx {
  id: string;
  day: string;
  amount: number;
  currency: string;
  description: string;
  type: string | null;
  merchant: string | null;
  merchantId: string | null;
  category: string | null;
  categoryKind: string | null;
}

export type FieldKey =
  | 'title' | 'date' | 'dateInvoice' | 'dateDelivery'
  | 'bankaccount' | 'costaccount' | 'purchasetaxaccount'
  | 'amount' | 'taxPercent' | 'deductibilityTaxPercent' | 'deductibilityAmountPercent'
  | 'vatin' | 'country' | 'countryDep' | 'countryRec' | 'costcentre' | 'description';

export interface Field {
  value: string | number | null;
  source: string;
  estimated?: boolean;
}

export interface InvoiceRef {
  id: number;
  number: string;
  clientName: string;
  clientVatNumber: string | null;
  reverseCharge: boolean;
  sentAt: string | null;
  payedAt: string | null;
  gross: number;
}

export interface Suggestion {
  basis: 'invoice' | 'history' | 'category' | 'none';
  basisLabel: string;
  similar: { bookamatId: number; title: string; date: string }[];
  profile: { label: string; count: number } | null;
  invoice: InvoiceRef | null;
  fields: Record<FieldKey, Field>;
  warnings: string[];
}

export interface MonthEntry {
  tx: BankTx;
  status: 'open' | 'done' | 'ignored';
  match: {
    bookamatId: number;
    via: 'manual' | 'transferred' | 'auto' | 'sum';
    dayDiff?: number;
    /** `sum`: how many movements the booking is made of. */
    parts?: number;
    booking: { bookamatId: number; title: string; date: string; documentNumber: string | null; costaccount: string | null; attachmentCount: number } | null;
  } | null;
  suggestion: Suggestion | null;
}

export interface CostAccount {
  name: string;
  group: string | null;
  purchasetaxaccounts: string[];
  deductibilityTaxPercent: number | null;
  deductibilityAmountPercent: number | null;
}

export interface TaxAccount {
  name: string;
  group: string | null;
  reverseCharge: boolean;
  icReport: boolean;
  taxValues: number[];
}

export interface Accounts {
  bank: string[];
  cost: CostAccount[];
  tax: TaxAccount[];
  costcentre: string[];
}

export interface MonthView {
  year: number;
  month: number;
  bankaccount: string | null;
  entries: MonthEntry[];
  bookamatOnly: { bookamatId: number; title: string; date: string; signed: number; costaccount: string | null }[];
  accounts: Accounts;
  counts: { open: number; done: number; ignored: number; bookamatOnly: number };
}

export interface MonthCounts {
  month: number;
  open: number;
  done: number;
  ignored: number;
  bookamatOnly: number;
}

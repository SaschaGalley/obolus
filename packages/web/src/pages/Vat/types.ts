// Shapes of GET /bookamat/vat/:year (see the API's vat.service.ts).

export type DateBasis = 'payment' | 'invoice' | 'delivery';

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
  group: string;
  costaccount: string | null;
  purchasetaxaccount: string | null;
  net: number;
  taxPercent: number;
  tax: number;
  gross: number;
  kz: Record<string, number>;
  zm: { vatin: string | null; type: 'L' | 'S' } | null;
  unknownAccount: boolean;
}

export interface UvaRow {
  kz: string;
  label: string;
  kind: 'base' | 'tax';
  section: 'umsatz' | 'erwerb' | 'vorsteuer';
  rate: number | null;
  amount: number;
  tax: number | null;
  lines: number;
}

export interface ZmRow {
  period: string;
  vatin: string | null;
  type: 'L' | 'S';
  amount: number;
  lines: number;
}

export interface VatPeriodReport {
  key: string;
  label: string;
  from: string;
  to: string;
  dueUva: string | null;
  dueZm: string | null;
  uva: { rows: UvaRow[]; ust: number; vorsteuer: number; zahllast: number; checks: string[] };
  pauschale: number;
  zahllastMitPauschale: number;
  zm: ZmRow[];
  lineIdx: number[];
}

export interface VatReport {
  year: number;
  settings: {
    vatPeriod: 'month' | 'quarter';
    vatMethod: 'cash' | 'accrual';
    zmPeriod: 'month' | 'quarter';
    source: 'year' | 'earlier' | 'default';
  };
  pauschaleRate: number;
  periods: VatPeriodReport[];
  total: VatPeriodReport;
  lines: VatLine[];
  bookedIdx: number[];
  warnings: string[];
}

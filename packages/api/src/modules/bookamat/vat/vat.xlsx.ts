import * as ExcelJS from 'exceljs';
import type { VatPeriodReport, VatReport } from './vat.service';
import { KENNZAHLEN } from './kennzahlen';
import type { DateBasis, VatLine } from './vat';

const MONEY = '#,##0.00;-#,##0.00';
const DATE = 'dd.mm.yyyy';
const BASIS: Record<DateBasis, string> = { payment: 'Zahlung', invoice: 'Rechnung', delivery: 'Lieferung/Leistung' };
const METHOD = { cash: 'Ist-Besteuerung', accrual: 'Soll-Besteuerung' };
const PERIOD = { month: 'monatlich', quarter: 'vierteljährlich' };

const day = (iso: string | null) => (iso ? new Date(`${iso}T00:00:00Z`) : null);
const fmtDay = (iso: string | null) => (iso ? iso.split('-').reverse().join('.') : '');

/**
 * Excel file for the Steuerberater: UVA, ZM and the bookings of one period,
 * or of the whole year with a column per period.
 */
export async function buildVatWorkbook(report: VatReport, periodKey: string): Promise<Buffer> {
  const yearly = periodKey === 'year';
  const target = yearly ? report.total : report.periods.find((p) => p.key === periodKey);
  if (!target) throw new Error(`Unbekannter Zeitraum ${periodKey}`);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Obolus';
  wb.created = new Date();
  uvaSheet(wb, report, yearly ? report.periods : [target], yearly ? report.total : null);
  zmSheet(wb, report, target);
  if (yearly) {
    bookingsSheet(wb, report.bookedIdx.map((i) => report.lines[i]), `mit Buchungsdatum ${report.year}`,
      'Alle Zahlungen des Jahres (Einnahmen-Ausgaben-Rechnung); Spalte B zeigt den Zeitraum für UVA und ZM.');
  } else {
    bookingsSheet(wb, target.lineIdx.map((i) => report.lines[i]), target.label,
      'Eine Zeile je Betrag einer Buchung; im Zeitraum nach dem Datum in Spalte B.');
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}

function header(ws: ExcelJS.Worksheet, title: string, lines: string[]) {
  ws.addRow([title]).font = { bold: true, size: 14 };
  for (const l of lines) ws.addRow([l]);
  ws.addRow([]);
}

function uvaSheet(wb: ExcelJS.Workbook, report: VatReport, cols: VatPeriodReport[], total: VatPeriodReport | null) {
  const ws = wb.addWorksheet('UVA');
  const single = !total;
  header(ws, `Umsatzsteuervoranmeldung ${single ? cols[0].label : report.year}`, [
    single ? `Zeitraum ${fmtDay(cols[0].from)} – ${fmtDay(cols[0].to)}, fällig ${fmtDay(cols[0].dueUva)}` : 'Kennzahlen je Zeitraum',
    `${METHOD[report.settings.vatMethod]}, UVA ${PERIOD[report.settings.vatPeriod]}`,
  ]);
  const all = total ? [...cols, total] : cols;
  const head = ws.addRow(['KZ', 'Bezeichnung', ...(single ? ['Betrag', 'Steuer'] : all.map((c) => c.key === 'year' ? 'Jahr' : c.key))]);
  head.font = { bold: true };

  const used = KENNZAHLEN.filter((k) => all.some((c) => c.uva.rows.some((r) => r.kz === k.kz)));
  for (const k of used) {
    const values = all.map((c) => c.uva.rows.find((r) => r.kz === k.kz));
    if (single) ws.addRow([k.kz, k.label, values[0]?.amount ?? 0, values[0]?.tax ?? null]);
    else ws.addRow([k.kz, k.label, ...values.map((v) => v?.amount ?? 0)]);
  }
  ws.addRow([]);
  const sum = (label: string, get: (c: VatPeriodReport) => number, bold = false) => {
    const row = ws.addRow(['', label, ...(single ? [null, get(all[0])] : all.map(get))]);
    if (bold) row.font = { bold: true };
  };
  sum('Umsatzsteuer', (c) => c.uva.ust);
  sum('Vorsteuer', (c) => c.uva.vorsteuer);
  sum('Zahllast (+) / Überschuss (−) laut Buchungen', (c) => c.uva.zahllast, true);
  sum(`Vorsteuerpauschale ${report.pauschaleRate.toLocaleString('de-AT')} % von KZ 000`, (c) => c.pauschale);
  sum('Zahllast mit Vorsteuerpauschale', (c) => c.zahllastMitPauschale, true);

  const checks = all.flatMap((c) => c.uva.checks.map((m) => `${c.label}: ${m}`));
  if (checks.length) {
    ws.addRow([]);
    ws.addRow(['', 'Prüfung wie FinanzOnline']).font = { bold: true };
    for (const m of checks) ws.addRow(['', m]);
  }

  ws.getColumn(1).width = 6;
  ws.getColumn(2).width = 62;
  for (let i = 3; i < 3 + (single ? 2 : all.length); i++) {
    ws.getColumn(i).width = 14;
    ws.getColumn(i).numFmt = MONEY;
  }
}

function zmSheet(wb: ExcelJS.Workbook, report: VatReport, target: VatPeriodReport) {
  const ws = wb.addWorksheet('ZM');
  header(ws, `Zusammenfassende Meldung ${target.label}`, [
    `ZM ${PERIOD[report.settings.zmPeriod]}${target.dueZm ? `, fällig ${fmtDay(target.dueZm)}` : ''}`,
    'Art: L = innergemeinschaftliche Lieferung, S = sonstige Leistung',
  ]);
  ws.addRow(['Zeitraum', 'UID', 'Art', 'Bemessungsgrundlage', 'Buchungen']).font = { bold: true };
  for (const r of target.zm) ws.addRow([r.period, r.vatin ?? 'UID fehlt', r.type, r.amount, r.lines]);
  if (!target.zm.length) ws.addRow(['', 'keine meldepflichtigen Umsätze']);
  ws.getColumn(1).width = 10;
  ws.getColumn(2).width = 18;
  ws.getColumn(3).width = 6;
  ws.getColumn(4).width = 20;
  ws.getColumn(4).numFmt = MONEY;
}

function bookingsSheet(wb: ExcelJS.Workbook, lines: VatLine[], label: string, note: string) {
  const ws = wb.addWorksheet('Buchungen');
  header(ws, `Buchungen ${label}`, [note]);
  ws.addRow([
    'Buchungsdatum', 'Zeitraum nach', 'Grundlage', 'Belegnr.', 'Titel', 'Steuerkonto', 'USt-Konto', 'Kennzahlen',
    'Netto', 'USt %', 'USt', 'Brutto', 'UID', 'Land', 'Rechnungsdatum', 'Lieferdatum', 'Anhänge',
  ]).font = { bold: true };
  for (const l of lines) {
    const sign = l.group === '2' ? -1 : 1;
    ws.addRow([
      day(l.date), day(l.periodDate), BASIS[l.basis], l.documentNumber ?? '', l.title, l.costaccount ?? '',
      l.purchasetaxaccount ?? '', Object.keys(l.kz).join(', '),
      sign * l.net, l.taxPercent, sign * l.tax, sign * l.gross,
      l.vatin ?? '', l.country ?? '', day(l.dateInvoice), day(l.dateDelivery), l.attachmentCount,
    ]);
  }
  const widths = [13, 13, 18, 10, 40, 28, 28, 14, 12, 7, 11, 12, 16, 6, 14, 13, 8];
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));
  for (const c of [1, 2, 15, 16]) ws.getColumn(c).numFmt = DATE;
  for (const c of [9, 11, 12]) ws.getColumn(c).numFmt = MONEY;
  ws.views = [{ state: 'frozen', ySplit: 4 }];
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: widths.length } };
}

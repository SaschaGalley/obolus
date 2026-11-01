import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import type { BookamatAccountData, BookingAmountLine } from '../../../database/entities';
import {
  AccountLookup, VatBooking, computeUva, computeZm, dueDates, pauschalen, periodDateOf, periodsOf, toLines, inPeriod,
} from './vat';

// Invented data only. Accounts as Bookamat predefines them.
const ACCOUNTS: Record<string, BookamatAccountData> = {
  'Umsatzsteuer Inland': { group: '1', indexPurchasetax: ['000', '022', '124', '029', '006'] },
  'IG Lieferung': { group: '1', icReport: true, icDelivery: true, indexPurchasetax: ['000', '017'] },
  'IG Leistung': { group: '1', icReport: true, icService: true, indexPurchasetax: [] },
  'Vorsteuer Inland': { group: '2', indexPurchasetax: ['060'] },
  'Reverse Charge Leistungen': { group: '2', reverseCharge: true, indexPurchasetax: ['057', '066'] },
  'keine USt': { group: '2', indexPurchasetax: [] },
};
const lookup: AccountLookup = (_year, name) => ACCOUNTS[name];

let nextId = 1;
const line = (taxAccount: string, net: number, taxPercent: number, over: Partial<BookingAmountLine> = {}): BookingAmountLine => ({
  group: ACCOUNTS[taxAccount]?.group ?? '2',
  bankaccount: 'Bank',
  costaccount: 'Konto',
  purchasetaxaccount: taxAccount,
  amount: net + (net * taxPercent) / 100,
  amountAfterTax: net,
  taxPercent,
  taxValue: Math.round(net * taxPercent) / 100,
  deductibilityTaxPercent: 100,
  deductibilityAmountPercent: 100,
  foreignBusinessBase: null,
  countryDep: null,
  countryRec: null,
  ...over,
});
const booking = (date: string, amounts: BookingAmountLine[], over: Partial<VatBooking> = {}): VatBooking => {
  const id = nextId++;
  return {
    id, bookamatId: 1000 + id, year: +date.slice(0, 4), date, dateInvoice: null, dateDelivery: null,
    title: `Buchung ${id}`, documentNumber: null, vatin: null, country: null, attachmentCount: 0, amounts, ...over,
  };
};
const kz = (uva: ReturnType<typeof computeUva>, code: string) => uva.rows.find((r) => r.kz === code);

test('domestic income goes into 000 and the Kennzahl of its rate', () => {
  const lines = toLines([
    booking('2026-08-03', [line('Umsatzsteuer Inland', 1000, 20)]),
    booking('2026-08-05', [line('Umsatzsteuer Inland', 200, 10)]),
  ], lookup, 'cash');
  const uva = computeUva(lines);
  assert.equal(kz(uva, '000')?.amount, 1200);
  assert.equal(kz(uva, '022')?.amount, 1000);
  assert.equal(kz(uva, '022')?.tax, 200);
  assert.equal(kz(uva, '029')?.amount, 200);
  assert.equal(kz(uva, '006'), undefined);
  assert.equal(uva.ust, 220);
  assert.deepEqual(uva.checks, []);
});

test('reverse charge without VAT on the invoice owes and deducts the rate on the net', () => {
  const lines = toLines([
    booking('2026-09-20', [line('Reverse Charge Leistungen', 20, 20, { amount: 20, taxValue: 0 })], { dateInvoice: '2026-09-20' }),
  ], lookup, 'cash');
  const uva = computeUva(lines);
  assert.equal(kz(uva, '057')?.amount, 4);
  assert.equal(kz(uva, '066')?.amount, 4);
  assert.equal(uva.zahllast, 0);
  assert.equal(kz(uva, '000')?.amount, 0);
});

test('Vorsteuer counts with its deductible share only', () => {
  const lines = toLines([
    booking('2026-07-10', [line('Vorsteuer Inland', 100, 20, { deductibilityTaxPercent: 50 })]),
  ], lookup, 'cash');
  const uva = computeUva(lines);
  assert.equal(kz(uva, '060')?.amount, 10);
  assert.equal(uva.zahllast, -10);
});

test('EU service: no UVA amount, ZM by Lieferdatum and UID', () => {
  const periods = periodsOf(2026, 'quarter');
  const b = booking('2026-10-03', [line('IG Leistung', 4800, 0)], {
    dateInvoice: '2026-09-22', dateDelivery: '2026-08-31', vatin: 'de 123 456 789',
  });
  const lines = toLines([b], lookup, 'cash');
  assert.equal(lines[0].periodDate, '2026-08-31');
  assert.equal(lines[0].basis, 'delivery');
  assert.deepEqual(lines[0].kz, {});
  assert.deepEqual(computeZm(lines, periods), [{ period: 'Q3', vatin: 'DE123456789', type: 'S', amount: 4800, lines: 1 }]);
});

test('EU goods go into 000 and 017 and the ZM as Lieferung', () => {
  const lines = toLines([
    booking('2026-05-02', [line('IG Lieferung', 500, 0)], { dateInvoice: '2026-04-28', vatin: 'IT00000000000' }),
  ], lookup, 'cash');
  const uva = computeUva(lines);
  assert.equal(kz(uva, '000')?.amount, 500);
  assert.equal(kz(uva, '017')?.amount, 500);
  assert.deepEqual(uva.checks, []);
  assert.equal(computeZm(lines, periodsOf(2026, 'quarter'))[0].period, 'Q2');
});

test('a December service paid in January belongs to the old year', () => {
  const lines = toLines([
    booking('2027-01-08', [line('IG Leistung', 3000, 0)], { dateDelivery: '2026-12-31', vatin: 'DE123456789' }),
    booking('2027-01-09', [line('Umsatzsteuer Inland', 100, 20)], { dateInvoice: '2026-12-20' }),
  ], lookup, 'cash');
  const q4 = periodsOf(2026, 'quarter')[3];
  assert.deepEqual(lines.filter(inPeriod(q4)).map((l) => l.bookamatId), [lines[0].bookamatId]);
});

test('Soll-Besteuerung takes the invoice date for domestic income', () => {
  const acc = ACCOUNTS['Umsatzsteuer Inland'];
  assert.deepEqual(periodDateOf({ date: '2026-10-02', dateInvoice: '2026-09-28', dateDelivery: null }, acc, 'accrual'),
    { date: '2026-09-28', basis: 'invoice' });
  assert.deepEqual(periodDateOf({ date: '2026-10-02', dateInvoice: '2026-09-28', dateDelivery: null }, acc, 'cash'),
    { date: '2026-10-02', basis: 'payment' });
});

test('a rate without Kennzahl fails the FinanzOnline sum check', () => {
  const uva = computeUva(toLines([booking('2026-08-03', [line('Umsatzsteuer Inland', 100, 0)])], lookup, 'cash'));
  assert.equal(kz(uva, '000')?.amount, 100);
  assert.equal(uva.checks.length, 1);
});

test('lines of an unknown VAT account are flagged', () => {
  const lines = toLines([booking('2026-08-03', [line('Gibt es nicht', 100, 20)])], lookup, 'cash');
  assert.equal(lines[0].unknownAccount, true);
  assert.deepEqual(lines[0].kz, {});
});

test('the Vorsteuerpauschale stops at the year cap', () => {
  assert.deepEqual(pauschalen(2026, [100000, 200000, 150000, 50000]), [1800, 3600, 2160, 0]);
  assert.deepEqual(pauschalen(2024, [100000, 200000]), [1800, 2160]);
});

test('due dates of UVA and ZM', () => {
  const [, , q3, q4] = periodsOf(2026, 'quarter');
  assert.deepEqual(dueDates(q3), { uva: '2026-11-15', zm: '2026-10-31' });
  assert.deepEqual(dueDates(q4), { uva: '2027-02-15', zm: '2027-01-31' });
  assert.equal(periodsOf(2026, 'month')[1].to, '2026-02-28');
});

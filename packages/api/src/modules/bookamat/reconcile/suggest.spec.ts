import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { deriveTitle, findInvoice, monthEnd, suggest, SuggestContext, validate, YearAccounts } from './suggest';
import { BankTx, HistBooking, InvoiceRef } from './types';
import type { BookingAmountLine } from '../../../database/entities/booking.entity';

// Invented data only: "Beispiel GmbH" stands for a recurring client, "CloudTool" for a software vendor.

const tx = (over: Partial<BankTx>): BankTx => ({
  id: 'tx', day: '2026-10-03', account: 'Geschäftskonto', businessAccount: true, amount: -10, currency: 'EUR', description: '', type: null,
  merchant: null, merchantId: null, category: null, categoryKind: null, ...over,
});

const line = (over: Partial<BookingAmountLine>): BookingAmountLine => ({
  group: '2', bankaccount: 'Bank', costaccount: 'Software', purchasetaxaccount: 'Vorsteuer Inland',
  amount: 10, amountAfterTax: 10, taxPercent: 20, taxValue: 0,
  deductibilityTaxPercent: 100, deductibilityAmountPercent: 100,
  foreignBusinessBase: null, countryDep: null, countryRec: null, ...over,
});

const booking = (over: Partial<HistBooking>): HistBooking => ({
  bookamatId: 1, title: 'B', documentNumber: null, date: '2026-01-01', dateInvoice: null, dateDelivery: null,
  vatin: null, country: null, costcentre: null, description: null, signed: -10,
  amounts: [line({})], attachmentCount: 0, ...over,
});

const invoice = (over: Partial<InvoiceRef>): InvoiceRef => ({
  id: 7, number: '2026-014', clientId: 3, clientName: 'Beispiel GmbH', clientVatNumber: 'DE 123456789',
  reverseCharge: true, sentAt: '2026-09-22', payedAt: null, gross: 4800, ...over,
});

const ctx = (over: Partial<SuggestContext>): SuggestContext => ({
  pairs: [], bookings: [], invoices: [], bankaccount: 'Bank', ...over,
});

test('monthEnd crosses year ends and leap years', () => {
  assert.equal(monthEnd('2026-01-10', -1), '2025-12-31');
  assert.equal(monthEnd('2028-03-01', -1), '2028-02-29');
  assert.equal(monthEnd('2026-09-22'), '2026-09-30');
});

test('deriveTitle moves months and years and swaps invoice numbers', () => {
  assert.equal(deriveTitle('CloudTool 09/2026', '2026-09-14', '2026-10-14'), 'CloudTool 10/2026');
  assert.equal(deriveTitle('Hosting 2026-12', '2026-12-01', '2027-01-01'), 'Hosting 2027-01');
  assert.equal(deriveTitle('Miete Dezember 2026', '2026-12-01', '2027-01-01'), 'Miete Januar 2027');
  assert.equal(deriveTitle('Jahresabo 2025', '2025-05-02', '2026-05-02'), 'Jahresabo 2026');
  assert.equal(deriveTitle('RE 2026-013 Beispiel', '2026-08-20', '2026-09-22', '2026-014'), 'RE 2026-014 Beispiel');
  assert.equal(deriveTitle('Ohne Datum', '2026-08-20', '2026-09-22'), 'Ohne Datum');
});

test('findInvoice: by number in the text, else by amount and client name', () => {
  const invoices = [invoice({}), invoice({ id: 8, number: '2026-015', gross: 4800, clientName: 'Andere AG', clientVatNumber: null })];
  assert.equal(findInvoice(tx({ amount: 4800, description: 'Zahlung RE 2026-014' }), invoices)?.id, 7);
  assert.equal(findInvoice(tx({ amount: 4800, description: 'BEISPIEL GMBH Honorar' }), invoices)?.id, 7);
  // Two invoices of the same amount and no hint which: no guess.
  assert.equal(findInvoice(tx({ amount: 4800, description: 'Gutschrift' }), invoices), null);
  assert.equal(findInvoice(tx({ amount: -4800, description: '2026-014' }), invoices), null);
});

test('incoming invoice payment: dates from the invoice, delivery by the learned rule, accounts as before', () => {
  const earlier = booking({
    bookamatId: 50, title: 'RE 2026-013 Beispiel', date: '2026-09-02', dateInvoice: '2026-08-20',
    dateDelivery: '2026-07-31', vatin: 'DE123456789', country: 'DE', signed: 4000,
    amounts: [line({ group: '1', costaccount: 'Erlöse EU', purchasetaxaccount: 'IG Leistung', taxPercent: 0 })],
  });
  const s = suggest(
    tx({ id: 'in', day: '2026-10-03', amount: 4800, description: 'BEISPIEL GMBH RE 2026-014' }),
    ctx({ bookings: [earlier], invoices: [invoice({})] }),
  );
  assert.equal(s.basis, 'invoice');
  assert.equal(s.invoice?.id, 7);
  assert.equal(s.fields.title.value, 'RE 2026-014 Beispiel');
  assert.equal(s.fields.date.value, '2026-10-03');
  assert.equal(s.fields.dateInvoice.value, '2026-09-22');
  assert.equal(s.fields.dateDelivery.value, '2026-08-31');
  assert.equal(s.fields.dateDelivery.source, 'Regel: Monatsletzter vor der Rechnung');
  assert.equal(s.fields.costaccount.value, 'Erlöse EU');
  assert.equal(s.fields.purchasetaxaccount.value, 'IG Leistung');
  assert.equal(s.fields.vatin.value, 'DE123456789');
  assert.equal(s.fields.country.value, 'DE');
  assert.equal(s.fields.amount.value, 4800);
  assert.deepEqual(s.warnings, []);
});

test('first invoice to a client without history still gets the default delivery rule', () => {
  const s = suggest(tx({ amount: 4800, description: 'RE 2026-014' }), ctx({ invoices: [invoice({})] }));
  assert.equal(s.fields.dateDelivery.value, '2026-08-31');
  assert.equal(s.fields.title.value, '2026-014 Beispiel GmbH');
  assert.equal(s.fields.costaccount.value, null);
  assert.equal(s.fields.costaccount.estimated, true);
});

test('recurring vendor: everything as the last times, title moved a month on', () => {
  const rc = line({ costaccount: 'Software', purchasetaxaccount: 'Reverse Charge Leistungen', taxPercent: 20 });
  const pairs = [
    { tx: tx({ id: 'p1', day: '2026-09-14', merchantId: 'cloudtool' }), booking: booking({ bookamatId: 21, title: 'CloudTool 09/2026', date: '2026-09-14', dateInvoice: '2026-09-14', vatin: 'IE9999999X', signed: -21.6, amounts: [rc] }) },
    { tx: tx({ id: 'p2', day: '2026-08-14', merchantId: 'cloudtool' }), booking: booking({ bookamatId: 20, title: 'CloudTool 08/2026', date: '2026-08-14', dateInvoice: '2026-08-14', vatin: 'IE9999999X', signed: -21.6, amounts: [rc] }) },
  ];
  const s = suggest(tx({ id: 'now', day: '2026-10-14', amount: -21.6, merchant: 'CloudTool', merchantId: 'cloudtool' }), ctx({ pairs }));
  assert.equal(s.basis, 'history');
  assert.equal(s.profile?.count, 2);
  assert.equal(s.fields.title.value, 'CloudTool 10/2026');
  assert.equal(s.fields.dateInvoice.value, '2026-10-14');
  assert.equal(s.fields.dateInvoice.source, 'wie bisher: = Zahlungsdatum');
  assert.equal(s.fields.dateDelivery.value, null);
  assert.equal(s.fields.purchasetaxaccount.value, 'Reverse Charge Leistungen');
  assert.equal(s.fields.costaccount.source, 'wie 2× zuvor');
  assert.equal(s.fields.vatin.value, 'IE9999999X');
  assert.equal(s.fields.country.value, 'IE');
});

test('a never-seen payment asks rather than guesses', () => {
  const s = suggest(tx({ amount: -99, description: 'Unbekannter Laden' }), ctx({}));
  assert.equal(s.basis, 'none');
  assert.equal(s.fields.costaccount.value, null);
  assert.equal(s.fields.title.value, 'Unbekannter Laden');
  assert.equal(s.fields.dateInvoice.estimated, true);
});

test('checks against the year: tax account not allowed, rate not allowed, UID missing for the Zusammenfassende Meldung', () => {
  const accounts: YearAccounts = {
    year: 2026,
    cost: new Map([['Software', { purchasetaxaccounts: ['Vorsteuer Inland'] }]]),
    tax: new Map([
      ['Vorsteuer Inland', { taxValues: [20, 10] }],
      ['Reverse Charge Leistungen', { reverseCharge: true, icReport: true, taxValues: [20] }],
    ]),
    bank: new Set(['Bank']),
    costcentre: new Set(),
  };
  const pairs = [{
    tx: tx({ id: 'p', day: '2026-09-01', merchantId: 'x' }),
    booking: booking({ amounts: [line({ purchasetaxaccount: 'Reverse Charge Leistungen', taxPercent: 13 })] }),
  }];
  const s = suggest(tx({ amount: -10, merchantId: 'x' }), ctx({ pairs, accounts }));
  assert.ok(s.warnings.some((w) => w.includes('nicht erlaubt')));
  assert.ok(s.warnings.some((w) => w.includes('USt-Satz 13 %')));
  assert.ok(s.warnings.some((w) => w.includes('braucht eine UID')));
});

test('reverse charge without a learned invoice date: Bookamat requires one, so it is estimated', () => {
  const accounts: YearAccounts = {
    year: 2026,
    cost: new Map([['Software', {}]]),
    tax: new Map([['Reverse Charge Leistungen', { reverseCharge: true, taxValues: [20] }]]),
    bank: new Set(['Bank']),
    costcentre: new Set(),
  };
  const rc = line({ purchasetaxaccount: 'Reverse Charge Leistungen' });
  const pairs = [
    { tx: tx({ id: 'p1', day: '2026-09-14', merchantId: 'cloudtool' }), booking: booking({ bookamatId: 21, date: '2026-09-14', vatin: 'IE9999999X', amounts: [rc] }) },
    { tx: tx({ id: 'p2', day: '2026-08-14', merchantId: 'cloudtool' }), booking: booking({ bookamatId: 20, date: '2026-08-14', vatin: 'IE9999999X', amounts: [rc] }) },
  ];
  const s = suggest(tx({ id: 'now', day: '2026-10-14', merchantId: 'cloudtool' }), ctx({ pairs, accounts }));
  assert.equal(s.fields.dateInvoice.value, '2026-10-14');
  assert.equal(s.fields.dateInvoice.estimated, true);
  assert.match(s.fields.dateInvoice.source, /Pflicht/);
  assert.equal(s.fields.dateDelivery.value, '2026-10-14');
  assert.equal(s.fields.dateDelivery.estimated, true);
  assert.ok(!s.warnings.some((w) => w.includes('Rechnungsdatum')));

  const cleared = validate({ ...s.fields, dateInvoice: { value: null, source: '' } }, accounts);
  assert.ok(cleared.some((w) => w.includes('verlangt ein Rechnungsdatum')));
});

test('rows synced before the dates were stored do not teach an empty invoice date', () => {
  const pairs = [
    { tx: tx({ id: 'p1', day: '2026-09-14', merchantId: 'cloudtool' }), booking: booking({ bookamatId: 22, date: '2026-09-14', amounts: null }) },
    { tx: tx({ id: 'p2', day: '2026-08-14', merchantId: 'cloudtool' }), booking: booking({ bookamatId: 21, date: '2026-08-14', amounts: null }) },
    { tx: tx({ id: 'p3', day: '2026-07-14', merchantId: 'cloudtool' }), booking: booking({ bookamatId: 20, date: '2026-07-14', dateInvoice: '2026-07-14' }) },
  ];
  const s = suggest(tx({ id: 'now', day: '2026-10-14', merchantId: 'cloudtool' }), ctx({ pairs }));
  assert.equal(s.fields.dateInvoice.value, '2026-10-14');
  assert.equal(s.fields.dateInvoice.source, 'wie bisher: = Zahlungsdatum');
});

test('a business expense paid by private card: Zahlungskonto as that card was booked before, never the business one', () => {
  const card = (over: Partial<BankTx>) => tx({ account: 'Kreditkarte', businessAccount: false, merchantId: 'cloudtool', merchant: 'CloudTool', ...over });
  const paidBy = (bankaccount: string, id: number) => booking({ bookamatId: id, title: 'CloudTool', amounts: [line({ bankaccount })] });
  const earlier = { tx: card({ id: 'k1', day: '2026-08-03' }), booking: paidBy('Privat', 1) };
  const s = suggest(card({}), ctx({ pairs: [earlier] }));
  assert.equal(s.fields.bankaccount.value, 'Privat');
  assert.equal(s.fields.bankaccount.source, 'wie bisher bei „Kreditkarte“');

  // Only ever paid from the business account so far: leave the choice to the user.
  const business = { tx: tx({ id: 'b1', merchantId: 'cloudtool', merchant: 'CloudTool' }), booking: paidBy('Bank', 2) };
  const fresh = suggest(card({}), ctx({ pairs: [business] }));
  assert.equal(fresh.fields.bankaccount.value, null);
  assert.equal(fresh.fields.bankaccount.estimated, true);
  assert.equal(fresh.fields.costaccount.value, 'Software');
});

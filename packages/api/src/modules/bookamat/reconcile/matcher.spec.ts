import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { matchTransactions } from './matcher';
import { BankTx, HistBooking } from './types';

// Invented data only.
const tx = (id: string, day: string, amount: number): BankTx => ({
  id, day, account: 'Geschäftskonto', businessAccount: true, amount, currency: 'EUR', description: `Text ${id}`, type: null,
  merchant: null, merchantId: null, category: null, categoryKind: null,
});
const booking = (bookamatId: number, date: string, signed: number): HistBooking => ({
  bookamatId, title: `B${bookamatId}`, documentNumber: null, date, dateInvoice: null, dateDelivery: null,
  vatin: null, country: null, costcentre: null, description: null, signed, amounts: null, attachmentCount: 0,
});

test('pairs equal amounts a few days apart, not further', () => {
  const m = matchTransactions(
    [tx('a', '2026-03-10', -20), tx('b', '2026-03-10', -30)],
    [booking(1, '2026-03-08', -20), booking(2, '2026-03-20', -30)],
    [],
  );
  assert.deepEqual(m.get('a'), { bookamatId: 1, via: 'auto', dayDiff: 2 });
  assert.equal(m.has('b'), false);
});

test('two equal subscriptions each find the booking closest to them', () => {
  const m = matchTransactions(
    [tx('mar', '2026-03-14', -21.6), tx('apr', '2026-04-14', -21.6)],
    [booking(11, '2026-04-13', -21.6), booking(10, '2026-03-14', -21.6)],
    [],
    40,
  );
  assert.equal(m.get('mar')?.bookamatId, 10);
  assert.equal(m.get('apr')?.bookamatId, 11);
});

test('sign matters: an income does not match an expense of the same size', () => {
  const m = matchTransactions([tx('a', '2026-03-10', 100)], [booking(1, '2026-03-10', -100)], []);
  assert.equal(m.size, 0);
});

test('decisions win: linked by hand, transferred, ignored', () => {
  const m = matchTransactions(
    [tx('a', '2026-03-10', -50), tx('b', '2026-03-10', -50), tx('c', '2026-03-11', -50)],
    [booking(1, '2026-03-10', -50), booking(2, '2026-02-01', -49), booking(3, '2026-03-11', -50)],
    [
      { umsatzId: 'a', bookamatId: 2, ignored: false, transferredAt: null },
      { umsatzId: 'b', bookamatId: null, ignored: true, transferredAt: null },
      { umsatzId: 'c', bookamatId: 3, ignored: false, transferredAt: '2026-03-12T10:00:00Z' },
    ],
  );
  assert.deepEqual(m.get('a'), { bookamatId: 2, via: 'manual' });
  assert.equal(m.has('b'), false);
  assert.deepEqual(m.get('c'), { bookamatId: 3, via: 'transferred' });
});

test('two transfers of one day booked as one sum both match that booking', () => {
  const m = matchTransactions(
    [tx('a', '2026-05-02', -700), tx('b', '2026-05-02', -500), tx('c', '2026-05-02', -45.9)],
    [booking(1, '2026-05-02', -1200), booking(2, '2026-05-02', -45.9)],
    [],
  );
  assert.deepEqual(m.get('a'), { bookamatId: 1, via: 'sum', dayDiff: 0, parts: 2 });
  assert.deepEqual(m.get('b'), { bookamatId: 1, via: 'sum', dayDiff: 0, parts: 2 });
  assert.equal(m.get('c')?.via, 'auto');
});

test('sums: only one day, one sign, and only when unambiguous', () => {
  // Different days: no sum.
  assert.equal(matchTransactions([tx('a', '2026-05-02', -700), tx('b', '2026-05-03', -500)], [booking(1, '2026-05-02', -1200)], []).size, 0);
  // An income and an expense never add up.
  assert.equal(matchTransactions([tx('a', '2026-05-02', 1700), tx('b', '2026-05-02', -500)], [booking(1, '2026-05-02', 1200)], []).size, 0);
  // Two combinations reach the same total: leave it to the user.
  const m = matchTransactions(
    [tx('a', '2026-05-02', -700), tx('b', '2026-05-02', -500), tx('c', '2026-05-02', -500)],
    [booking(1, '2026-05-02', -1200)],
    [],
  );
  assert.equal(m.size, 0);
});

test('a movement linked by hand is not added into a sum', () => {
  const m = matchTransactions(
    [tx('a', '2026-05-02', -700), tx('b', '2026-05-02', -500)],
    [booking(1, '2026-05-02', -1200), booking(2, '2026-05-01', -999)],
    [{ umsatzId: 'a', bookamatId: 2, ignored: false, transferredAt: null }],
  );
  assert.equal(m.get('a')?.via, 'manual');
  assert.equal(m.has('b'), false);
});

test('a movement switched over from a private card pairs only with bookings paid from elsewhere', () => {
  const card = (id: string, day: string, amount: number): BankTx => ({ ...tx(id, day, amount), account: 'Kreditkarte', businessAccount: false });
  // Booking 1 went over the business account, booking 2 over another Zahlungskonto.
  const fits = (t: BankTx, b: HistBooking) => t.businessAccount === (b.bookamatId === 1);
  const m = matchTransactions(
    [tx('a', '2026-05-04', -50), card('k', '2026-05-02', -50)],
    [booking(1, '2026-05-02', -50), booking(2, '2026-05-04', -50)],
    [],
    undefined,
    fits,
  );
  assert.equal(m.get('a')?.bookamatId, 1);
  assert.equal(m.get('k')?.bookamatId, 2);
  // Movements of different accounts never add up to one booking.
  const sums = matchTransactions([tx('a', '2026-05-02', -700), card('k', '2026-05-02', -500)], [booking(2, '2026-05-02', -1200)], []);
  assert.equal(sums.size, 0);
});

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');

function orderDb() {
  return {
    orders: [
      { id: 1, date: '15/03/2022' },
      { id: 2, date: '30/01/2022' },
      { id: 3, date: '28/12/2021' }
    ]
  };
}

function customerDb() {
  return {
    nextSettlementId: 501,
    customers: [{
      id: 1,
      name: 'Meera Joshi',
      openingBalance: 450,
      totalBilled: 1982.01,
      totalSettled: 1200,
      balance: 1232.01
    }],
    settlements: []
  };
}

test('CURRENT BEHAVIOUR: orders.list default order is newest first by chronological date', function () {
  const result = orders.list(orderDb());
  assert.deepEqual(result.map(function (order) { return order.date; }), [
    '15/03/2022', '30/01/2022', '28/12/2021'
  ]);
});

test('CURRENT BEHAVIOUR: orders.list from/to filters include dates in the YYYY-MM-DD range', function () {
  const result = orders.list(orderDb(), { from: '2022-01-01', to: '2022-02-28' });
  assert.deepEqual(result.map(function (order) { return order.date; }), ['30/01/2022']);
});

test('CURRENT BEHAVIOUR: dates.normalizeDateKey returns sortable YYYY-MM-DD keys', function () {
  assert.equal(dates.normalizeDateKey('2022-03-15'), '2022-03-15');
  assert.equal(dates.normalizeDateKey('15/03/2022'), '2022-03-15');
  assert.equal(dates.normalizeDateKey('2022-13-40'), '2022-13-40');
  assert.equal(dates.getFiscalYear('15/03/2022'), 'FY21-22');
  assert.equal(dates.getFiscalYear('04/04/2022'), 'FY22-23');
});

test('CURRENT BEHAVIOUR: dates.normalizeDateKey trims other strings and returns empty for empty input', function () {
  assert.equal(dates.normalizeDateKey(' 15/03/2022 '), '2022-03-15');
  assert.equal(dates.normalizeDateKey(''), '');
});

test('CURRENT BEHAVIOUR: numeric settlement amount 500 updates totals arithmetically', function () {
  const db = customerDb();
  const result = ledger.recordSettlement(db, 1, 500, 'cash', 'Counter payment');
  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
  assert.equal(db.settlements.length, 1);
});

test('CURRENT BEHAVIOUR: string settlement amount "500" is treated as a number', function () {
  const db = customerDb();
  const result = ledger.recordSettlement(db, 1, '500', 'cash', 'Counter payment');
  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, 1700);
  assert.equal(result.customer.balance, 732.01);
  assert.equal(result.settlement.amount, 500);
});

test('CURRENT BEHAVIOUR: zero and negative settlement amounts are rejected without changes', function () {
  for (const amount of [0, -500]) {
    const db = customerDb();
    const result = ledger.recordSettlement(db, 1, amount);
    assert.deepEqual(result, { ok: false, error: 'Settlement amount must be greater than zero' });
    assert.equal(db.customers[0].totalSettled, 1200);
    assert.equal(db.settlements.length, 0);
  }
});

test('CURRENT BEHAVIOUR: non-numeric string settlement is rejected without changing customer totals', function () {
  const db = customerDb();
  const result = ledger.recordSettlement(db, 1, 'not-a-number');
  assert.deepEqual(result, { ok: false, error: 'Settlement amount must be greater than zero' });
  assert.equal(db.customers[0].totalSettled, 1200);
  assert.equal(db.customers[0].balance, 1232.01);
  assert.equal(db.settlements.length, 0);
});


test('CORRECT BEHAVIOUR: order history uses chronological dates and settlement values are validated numerically', function () {
  const db = orderDb();
  assert.deepEqual(orders.list(db).map(function (order) { return order.date; }), [
    '15/03/2022', '30/01/2022', '28/12/2021'
  ]);
  assert.deepEqual(orders.list(db, { from: '2022-01-01', to: '2022-02-28' }).map(function (order) { return order.date; }), [
    '30/01/2022'
  ]);

  const numericDb = customerDb();
  const numericResult = ledger.recordSettlement(numericDb, 1, '500');
  assert.equal(numericResult.customer.totalSettled, 1700);
  assert.equal(numericResult.customer.balance, 732.01);

  for (const amount of [0, -1, 'not-a-number', Infinity]) {
    const invalidDb = customerDb();
    const invalidResult = ledger.recordSettlement(invalidDb, 1, amount);
    assert.equal(invalidResult.ok, false);
    assert.equal(invalidDb.customers[0].totalSettled, 1200);
    assert.equal(invalidDb.settlements.length, 0);
  }
});

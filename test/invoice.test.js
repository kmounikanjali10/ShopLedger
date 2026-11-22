'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

// Stored order lines have price, qty and HSN; gstRate is not populated by checkout.
function line(name, price, qty, hsn) {
  return { name, price, qty, hsn, gstRate: undefined };
}

function assertCurrent(order, expectedInvoice, expectedPricing) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual(invoiceFigures, expectedInvoice);
  assert.deepEqual(
    {
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      cgst: checkoutFigures.cgst,
      sgst: checkoutFigures.sgst,
      total: checkoutFigures.total
    },
    expectedPricing
  );
}

test('INVOICE MATCHES CHECKOUT: order #1001 uses 5% and 12% HSN items', function () {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      line('Rice', 640, 1, '1006'),
      line('Ghee', 450, 1, '0405')
    ]
  };

  assertCurrent(order, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 1, price: 640, gstPercent: 5, line: 640, lineTax: 32 },
      { name: 'Ghee', sku: '-', hsn: '0405', qty: 1, price: 450, gstPercent: 12, line: 450, lineTax: 54 }
    ]
  }, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176
  });
});

test('INVOICE MATCHES CHECKOUT: order #1002 applies SAVE10 before tax', function () {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      line('Rice', 500, 1, '1006'),
      line('Ghee', 500, 1, '0405')
    ]
  };

  assertCurrent(order, {
    subtotal: 1000,
    discount: 100,
    tax: 76.5,
    cgst: 38.25,
    sgst: 38.25,
    total: 976.5,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 1, price: 500, gstPercent: 5, line: 500, lineTax: 22.5 },
      { name: 'Ghee', sku: '-', hsn: '0405', qty: 1, price: 500, gstPercent: 12, line: 500, lineTax: 54 }
    ]
  }, {
    subtotal: 1000,
    discount: 100,
    tax: 76.5,
    cgst: 38.25,
    sgst: 38.25,
    total: 976.5
  });
});

test('INVOICE MATCHES CHECKOUT: order #1004 applies the SAVE10 cap before tax', function () {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      line('Rice', 640, 2, '1006'),
      line('Ghee', 480, 2, '0405')
    ]
  };

  assertCurrent(order, {
    subtotal: 2240,
    discount: 150,
    tax: 167.2,
    cgst: 83.6,
    sgst: 83.6,
    total: 2257.2,
    rows: [
      { name: 'Rice', sku: '-', hsn: '1006', qty: 2, price: 640, gstPercent: 5, line: 1280, lineTax: 59.71 },
      { name: 'Ghee', sku: '-', hsn: '0405', qty: 2, price: 480, gstPercent: 12, line: 960, lineTax: 107.49 }
    ]
  }, {
    subtotal: 2240,
    discount: 150,
    tax: 167.2,
    cgst: 83.6,
    sgst: 83.6,
    total: 2257.2
  });
});

test('CURRENT BEHAVIOUR: order #1008 invoice matches checkout when all items use the 18% slab and no coupon applies', function () {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      line('Tea', 140, 1, '0902'),
      line('Coffee', 310, 1, '0901'),
      line('Sherbet', 180, 1, '2106')
    ]
  };

  assertCurrent(order, {
    subtotal: 630,
    discount: 0,
    tax: 113.4,
    cgst: 56.7,
    sgst: 56.7,
    total: 743.4,
    rows: [
      { name: 'Tea', sku: '-', hsn: '0902', qty: 1, price: 140, gstPercent: 18, line: 140, lineTax: 25.2 },
      { name: 'Coffee', sku: '-', hsn: '0901', qty: 1, price: 310, gstPercent: 18, line: 310, lineTax: 55.8 },
      { name: 'Sherbet', sku: '-', hsn: '2106', qty: 1, price: 180, gstPercent: 18, line: 180, lineTax: 32.4 }
    ]
  }, {
    subtotal: 630,
    discount: 0,
    tax: 113.4,
    cgst: 56.7,
    sgst: 56.7,
    total: 743.4
  });
});



test('INVOICE MATCHES CHECKOUT: order #1004 uses capped pre-tax coupon and per-line HSN GST', function () {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [
      line('Rice', 640, 2, '1006'),
      line('Ghee', 480, 2, '0405')
    ]
  };
  const checkout = pricing.computeTotals(order.items, order.coupon);
  const figures = invoice.computeInvoiceFigures(order);

  assert.equal(figures.discount, 150);
  assert.deepEqual(
    {
      subtotal: figures.subtotal,
      discount: figures.discount,
      tax: figures.tax,
      cgst: figures.cgst,
      sgst: figures.sgst,
      total: figures.total
    },
    {
      subtotal: checkout.subtotal,
      discount: checkout.discount,
      tax: checkout.tax,
      cgst: checkout.cgst,
      sgst: checkout.sgst,
      total: checkout.total
    }
  );
  assert.deepEqual(
    figures.rows.map(function (row) { return { gstPercent: row.gstPercent, tax: row.lineTax }; }),
    checkout.lines.map(function (row) { return { gstPercent: row.gstPercent, tax: row.tax }; })
  );
});

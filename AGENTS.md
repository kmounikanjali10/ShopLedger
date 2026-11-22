# ShopLedger

## Stack
- Node.js with CommonJS modules; Express 4 and body-parser provide the HTTP server and JSON request parsing.
- Browser UI uses HTML, CSS, and JavaScript in `public/`.
- Application data is stored as JSON in `data/db.json` by `lib/store.js`.

## Module map
- `routes/customers.js` — lists customers and settlements; records Khata settlements.
- `routes/orders.js` — lists, reads, places, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons from config.
- `lib/dates.js` — formats today’s date, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — finds products, checks sellable stock, reserves/releases stock, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — customer balances, Khata order debits/reversals, and settlement records.
- `lib/orders.js` — adds, finds, cancels, and filters orders.
- `lib/pricing.js` — subtotal, coupon discount, per-line GST, and order total calculations.
- `lib/reports.js` — dashboard summaries and comparisons of stored orders with invoice figures.
- `lib/store.js` — reads/writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves item GST rates and splits GST into CGST and SGST.

## Commands
- Start the app: `node server.js` (equivalent to the package `start` script).
- Run tests with Node’s test runner: `node --test` (the current package `test` script is only a placeholder).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed. Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).

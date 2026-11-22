# ShopLedger

## Stack
- Node.js application using CommonJS modules, Express 4, and body-parser for JSON request parsing.
- Browser UI uses HTML, CSS, and JavaScript in `public/`.
- Application data is stored as JSON in `data/db.json` through `lib/store.js`.

## Module map
- `routes/customers.js` — lists customers and recent settlements; records Khata settlements.
- `routes/orders.js` — lists, reads, places, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — serves dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — normalizes, validates, calculates, and lists configured coupons.
- `lib/dates.js` — formats today’s date, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — looks up products, checks sellable stock, reserves/releases stock, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — handles customer balances, Khata debits/reversals, and settlement records.
- `lib/orders.js` — adds, finds, cancels, and filters orders.
- `lib/pricing.js` — calculates subtotal, coupon discount, per-line GST, and order total.
- `lib/reports.js` — builds dashboard summaries and compares stored orders with invoice figures.
- `lib/store.js` — reads/writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves item GST rates and splits GST into CGST and SGST.

## Commands
- Start the app: `node server.js`.
- Run tests with Node’s test runner: `node --test`.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Order history sorting and date filter are broken, and Khata settlements corrupt customer balances. Allowed files: `lib/orders.js` (`list` only), `lib/dates.js`, `lib/ledger.js`, `routes/customers.js`.

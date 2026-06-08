# CAMS — Career & Application Management System

Vite + React + TypeScript app for finance students to track recruiting,
manage contacts, monitor a managed portfolio, and connect with alumni.

## Getting started

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`.

## Environment variables

Copy [`.env.example`](./.env.example) to `.env.local` and fill in the values.

### Financial Modeling Prep (FMP) — Portfolio live data

The Portfolio page pulls live (15-min delayed) quotes and 1-year end-of-day
price history from [Financial Modeling Prep](https://site.financialmodelingprep.com/developer/docs).

1. Sign up for a free FMP account and grab your API key.
2. Add it to `.env.local`:

   ```env
   VITE_FMP_API_KEY=your_fmp_api_key_here
   ```

3. Restart `npm run dev` so Vite picks up the new env var.

The free tier allows ~250 calls/day. The page batches symbols (5 per request),
auto-refreshes quotes every 60 seconds while the tab is visible, and pauses
when the tab is in the background. If FMP is unreachable or the key is
missing, the page falls back to the static seed values in
[`src/app/data/portfolioHoldings.ts`](./src/app/data/portfolioHoldings.ts) and
shows a "cached values" status badge above the trend chart.

### Symbol overrides

A few holdings need a different symbol on FMP (for example, LVMH trades as
`MC.PA` on Euronext Paris). Maintain those mappings in `FMP_SYMBOL_OVERRIDES`
inside [`src/app/data/portfolioHoldings.ts`](./src/app/data/portfolioHoldings.ts).

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run lint` — run ESLint
- `npm run test:e2e` — run Playwright smoke tests

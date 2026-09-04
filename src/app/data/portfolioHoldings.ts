// AUTO-GENERATED FROM `CAMS Portfolio.xlsx`.
// Run `py -3 scripts/extract_portfolio.py` to regenerate.
//
// `currentPrice`/`currentValue`/`changePct` are seed values used as
// fallback display when the FMP plug-in is unavailable. Add
// `VITE_FMP_API_KEY` to `.env.local` to fetch live quotes.

export interface PortfolioHolding {
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  sector: string;
  currentValue: number;
  unrealizedGain: number;
  changePct: number;
}

export interface FixedIncomePosition {
  name: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
  value: number;
  unrealizedGain: number;
}

export interface MutualFundPosition {
  ticker: string;
  name: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
  value: number;
  unrealizedGain: number;
}

/**
 * Some portfolio tickers map to a different symbol on Financial Modeling Prep.
 * Anything not listed here is sent to FMP as-is.
 *
 * Known caveats on the free tier:
 * - `GTBIF` (Green Thumb, OTC) usually returns no data; falls back to seed values.
 * - `MC` is LVMH on Euronext Paris -> FMP wants `MC.PA`.
 */
export const FMP_SYMBOL_OVERRIDES: Record<string, string> = {
  MC: "MC.PA",
};

/**
 * FMP symbols (post-`FMP_SYMBOL_OVERRIDES`) confirmed unavailable on the free plan — FMP
 * returns HTTP 402 "not available under your current subscription" for these on quote,
 * historical-price, and dividends alike (verified directly against the live API on
 * 2026-09-04, not assumed). No paid plan is in use, so rather than hit FMP for a guaranteed
 * 402 on every refresh — which the browser logs to the console itself and JS can't suppress,
 * since it's not an application-level error — these are filtered out of the live-fetch list
 * entirely in usePortfolioLiveData.ts. They fall back to their static seed values below (the
 * same fallback path already used for any symbol with no live quote), same as before, just
 * without spamming the console every refresh. FMP's free-tier whitelist could change
 * independently of this list.
 */
export const FMP_FREE_TIER_UNAVAILABLE = new Set([
  "VRTX", "APO", "LLY", "MA", "WM", "NVO", "GTBIF", "WMS", "ACN", "SG",
  "ISRG", "CVE", "UNM", "ULTA", "RDNT", "MC.PA", "CMG", "CCJ", "VST",
]);

export const PORTFOLIO_AS_OF = "2026-05-05";
export const PORTFOLIO_CASH = 177155;

export const PORTFOLIO_HOLDINGS: PortfolioHolding[] = [
  // Seed values mirror `CAMS Portfolio.xlsx` cached closes.
  // As-of: 2026-05-05. Run `py -3 scripts/extract_portfolio.py` to refresh.
  { ticker: "VRTX", name: "Vertex Pharmaceuticals Incorporated", shares: 121, avgCost: 199.27, currentPrice: 442.32, sector: "Healthcare", currentValue: 53521, unrealizedGain: 29409, changePct: 121.97 },
  { ticker: "GS", name: "The Goldman Sachs Group, Inc.", shares: 50, avgCost: 355.19, currentPrice: 960.92, sector: "Financials", currentValue: 48046, unrealizedGain: 30286, changePct: 170.54 },
  { ticker: "AMZN", name: "Amazon.com, Inc.", shares: 230, avgCost: 177.7, currentPrice: 270.66, sector: "Technology", currentValue: 62252, unrealizedGain: 21381, changePct: 52.31 },
  { ticker: "APO", name: "Apollo Global Management", shares: 15, avgCost: 69.56, currentPrice: 128.53, sector: "Financials", currentValue: 1928, unrealizedGain: 885, changePct: 84.78 },
  { ticker: "LLY", name: "Eli Lilly and Company", shares: 53, avgCost: 416.24, currentPrice: 908.32, sector: "Healthcare", currentValue: 48141, unrealizedGain: 26080, changePct: 118.22 },
  { ticker: "AAPL", name: "Apple Inc.", shares: 90, avgCost: 163.64, currentPrice: 274.82, sector: "Technology", currentValue: 24734, unrealizedGain: 10006, changePct: 67.94 },
  { ticker: "MA", name: "Mastercard Incorporated", shares: 31, avgCost: 360.16, currentPrice: 521.45, sector: "Financials", currentValue: 16165, unrealizedGain: 5000, changePct: 44.78 },
  { ticker: "WM", name: "Waste Management, Inc.", shares: 100, avgCost: 165.15, currentPrice: 233.78, sector: "Industrials", currentValue: 23378, unrealizedGain: 6863, changePct: 41.56 },
  { ticker: "NVO", name: "Novo Nordisk A/S", shares: 200, avgCost: 77.99, currentPrice: 42.91, sector: "Healthcare", currentValue: 8581, unrealizedGain: -7017, changePct: -44.98 },
  { ticker: "CVX", name: "Chevron Corporation", shares: 90, avgCost: 163.77, currentPrice: 189.89, sector: "Industrials", currentValue: 17090, unrealizedGain: 2351, changePct: 15.95 },
  { ticker: "GTBIF", name: "Green Thumb Industries Inc.", shares: 2861, avgCost: 9.73, currentPrice: 7.93, sector: "Contrarian", currentValue: 22693, unrealizedGain: -5145, changePct: -18.5 },
  { ticker: "WMS", name: "Advanced Drainage Systems, Inc.", shares: 100, avgCost: 123.09, currentPrice: 158.05, sector: "Industrials", currentValue: 15805, unrealizedGain: 3496, changePct: 28.4 },
  { ticker: "UBER", name: "Uber Technologies, Inc.", shares: 225, avgCost: 67.75, currentPrice: 78.72, sector: "Technology", currentValue: 17712, unrealizedGain: 2468, changePct: 16.19 },
  { ticker: "ACN", name: "Accenture plc", shares: 80, avgCost: 311.43, currentPrice: 185.28, sector: "Contrarian", currentValue: 14822, unrealizedGain: -10092, changePct: -40.51 },
  { ticker: "SG", name: "Sweetgreen, Inc.", shares: 674, avgCost: 22.26, currentPrice: 7.17, sector: "Consumer", currentValue: 4833, unrealizedGain: -10170, changePct: -67.79 },
  { ticker: "ISRG", name: "Intuitive Surgical, Inc.", shares: 27, avgCost: 377.08, currentPrice: 488.63, sector: "Healthcare", currentValue: 13193, unrealizedGain: 3012, changePct: 29.58 },
  { ticker: "CVE", name: "Cenovus Energy", shares: 1228, avgCost: 16.29, currentPrice: 27.68, sector: "Industrials", currentValue: 33994, unrealizedGain: 13990, changePct: 69.92 },
  { ticker: "UNM", name: "Unum Group", shares: 205, avgCost: 63.68, currentPrice: 79.95, sector: "Financials", currentValue: 16390, unrealizedGain: 3336, changePct: 25.55 },
  { ticker: "ULTA", name: "Ulta Beauty, Inc.", shares: 20, avgCost: 369.2, currentPrice: 556.3, sector: "Consumer", currentValue: 11126, unrealizedGain: 3742, changePct: 50.68 },
  { ticker: "RDNT", name: "RadNet, Inc.", shares: 100, avgCost: 68.16, currentPrice: 60.85, sector: "Healthcare", currentValue: 6085, unrealizedGain: -731, changePct: -10.72 },
  { ticker: "PYPL", name: "PayPal Holdings, Inc.", shares: 256, avgCost: 78.13, currentPrice: 51.38, sector: "Technology", currentValue: 13154, unrealizedGain: -6847, changePct: -34.24 },
  { ticker: "NVDA", name: "NVIDIA Corporation", shares: 348, avgCost: 115.06, currentPrice: 220.16, sector: "Technology", currentValue: 76614, unrealizedGain: 36573, changePct: 91.34 },
  { ticker: "UNH", name: "UnitedHealth Group Incorporated", shares: 103, avgCost: 359.98, currentPrice: 361.77, sector: "Healthcare", currentValue: 37262, unrealizedGain: 184, changePct: 0.5 },
  { ticker: "MC", name: "LVMH Moet Hennessy Louis Vuitton SE", shares: 48, avgCost: 720.5, currentPrice: 565.0, sector: "Consumer", currentValue: 27120, unrealizedGain: -7464, changePct: -21.58 },
  { ticker: "CMG", name: "Chipotle Mexican Grill", shares: 470, avgCost: 34.14, currentPrice: 35.1, sector: "Consumer", currentValue: 16497, unrealizedGain: 451, changePct: 2.81 },
  { ticker: "CCJ", name: "Cameco Corporation", shares: 400, avgCost: 90.59, currentPrice: 125.45, sector: "Industrials", currentValue: 50181, unrealizedGain: 13945, changePct: 38.48 },
  { ticker: "VST", name: "Vistra Corp.", shares: 120, avgCost: 171.62, currentPrice: 172.28, sector: "Industrials", currentValue: 20673, unrealizedGain: 79, changePct: 0.38 },
];

export const PORTFOLIO_BONDS: FixedIncomePosition[] = [
  { name: "MGM 5\u00bd 04/15/2027", shares: 142, purchasePrice: 105.63, currentPrice: 100.25, value: 14236, unrealizedGain: -763 },
  { name: "RTX 4\u00bd 6/1/2042", shares: 79, purchasePrice: 124.11, currentPrice: 111.66, value: 8821, unrealizedGain: -984 },
  { name: "IEP 6\u00bc 05/15/2026", shares: 140, purchasePrice: 96.33, currentPrice: 96.75, value: 13545, unrealizedGain: 59 },
];

export const PORTFOLIO_MUTUAL_FUNDS: MutualFundPosition[] = [
  { ticker: "GHYIX", name: "Goldman Sachs High Yield Municipal Fund", shares: 1300, purchasePrice: 8.5, currentPrice: 9.37, value: 12183, unrealizedGain: 1133 },
  { ticker: "VEMBX", name: "Vanguard Emerging Markets Bond Fund", shares: 1000, purchasePrice: 9.54, currentPrice: 11.08, value: 11083, unrealizedGain: 1543 },
  { ticker: "CQQQ", name: "Invesco China Technology ETF", shares: 667, purchasePrice: 31.39, currentPrice: 51.86, value: 34590, unrealizedGain: 13653 },
  { ticker: "JPST", name: "JPMorgan Ultra-Short Income ETF", shares: 336, purchasePrice: 50.56, currentPrice: 52.16, value: 17527, unrealizedGain: 539 },
];

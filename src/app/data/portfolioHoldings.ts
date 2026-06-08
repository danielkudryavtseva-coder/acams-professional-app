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

export const PORTFOLIO_AS_OF = "2026-05-05";
export const PORTFOLIO_CASH = 177155;

export const PORTFOLIO_HOLDINGS: PortfolioHolding[] = [
  // Seed values mirror `CAMS Portfolio.xlsx` cached closes.
  // As-of: 2026-05-05. Run `py -3 scripts/extract_portfolio.py` to refresh.
  { ticker: "VRTX", name: "Vertex Pharmaceuticals Incorporated", shares: 121, avgCost: 199.27, currentPrice: 429.02, sector: "Healthcare", currentValue: 51911, unrealizedGain: 27799, changePct: 115.29 },
  { ticker: "GS", name: "The Goldman Sachs Group, Inc.", shares: 50, avgCost: 355.19, currentPrice: 932.02, sector: "Financials", currentValue: 46601, unrealizedGain: 28841, changePct: 162.4 },
  { ticker: "AMZN", name: "Amazon.com, Inc.", shares: 230, avgCost: 177.7, currentPrice: 262.52, sector: "Technology", currentValue: 60380, unrealizedGain: 19508, changePct: 47.73 },
  { ticker: "APO", name: "Apollo Global Management", shares: 15, avgCost: 69.56, currentPrice: 124.64, sector: "Financials", currentValue: 1870, unrealizedGain: 826, changePct: 79.2 },
  { ticker: "LLY", name: "Eli Lilly and Company", shares: 53, avgCost: 416.24, currentPrice: 881.0, sector: "Healthcare", currentValue: 46693, unrealizedGain: 24632, changePct: 111.66 },
  { ticker: "AAPL", name: "Apple Inc.", shares: 90, avgCost: 163.64, currentPrice: 266.56, sector: "Technology", currentValue: 23990, unrealizedGain: 9262, changePct: 62.89 },
  { ticker: "MA", name: "Mastercard Incorporated", shares: 31, avgCost: 360.16, currentPrice: 505.79, sector: "Financials", currentValue: 15679, unrealizedGain: 4515, changePct: 40.43 },
  { ticker: "WM", name: "Waste Management, Inc.", shares: 100, avgCost: 165.15, currentPrice: 226.75, sector: "Industrials", currentValue: 22675, unrealizedGain: 6160, changePct: 37.3 },
  { ticker: "NVO", name: "Novo Nordisk A/S", shares: 200, avgCost: 77.99, currentPrice: 41.62, sector: "Healthcare", currentValue: 8323, unrealizedGain: -7275, changePct: -46.64 },
  { ticker: "CVX", name: "Chevron Corporation", shares: 90, avgCost: 163.77, currentPrice: 184.18, sector: "Industrials", currentValue: 16576, unrealizedGain: 1837, changePct: 12.46 },
  { ticker: "GTBIF", name: "Green Thumb Industries Inc.", shares: 2861, avgCost: 9.73, currentPrice: 7.69, sector: "Contrarian", currentValue: 22010, unrealizedGain: -5831, changePct: -20.94 },
  { ticker: "WMS", name: "Advanced Drainage Systems, Inc.", shares: 100, avgCost: 123.09, currentPrice: 153.3, sector: "Industrials", currentValue: 15330, unrealizedGain: 3021, changePct: 24.54 },
  { ticker: "UBER", name: "Uber Technologies, Inc.", shares: 225, avgCost: 67.75, currentPrice: 76.35, sector: "Technology", currentValue: 17179, unrealizedGain: 1935, changePct: 12.69 },
  { ticker: "ACN", name: "Accenture plc", shares: 80, avgCost: 311.43, currentPrice: 179.7, sector: "Contrarian", currentValue: 14376, unrealizedGain: -10538, changePct: -42.3 },
  { ticker: "SG", name: "Sweetgreen, Inc.", shares: 674, avgCost: 22.26, currentPrice: 6.96, sector: "Consumer", currentValue: 4688, unrealizedGain: -10316, changePct: -68.76 },
  { ticker: "ISRG", name: "Intuitive Surgical, Inc.", shares: 27, avgCost: 377.08, currentPrice: 473.94, sector: "Healthcare", currentValue: 12796, unrealizedGain: 2615, changePct: 25.69 },
  { ticker: "CVE", name: "Cenovus Energy", shares: 1228, avgCost: 16.29, currentPrice: 26.85, sector: "Industrials", currentValue: 32972, unrealizedGain: 12968, changePct: 64.83 },
  { ticker: "UNM", name: "Unum Group", shares: 205, avgCost: 63.68, currentPrice: 77.55, sector: "Financials", currentValue: 15897, unrealizedGain: 2842, changePct: 21.77 },
  { ticker: "ULTA", name: "Ulta Beauty, Inc.", shares: 20, avgCost: 369.2, currentPrice: 539.55, sector: "Consumer", currentValue: 10791, unrealizedGain: 3407, changePct: 46.14 },
  { ticker: "RDNT", name: "RadNet, Inc.", shares: 100, avgCost: 68.16, currentPrice: 59.02, sector: "Healthcare", currentValue: 5902, unrealizedGain: -914, changePct: -13.41 },
  { ticker: "PYPL", name: "PayPal Holdings, Inc.", shares: 256, avgCost: 78.13, currentPrice: 49.84, sector: "Technology", currentValue: 12758, unrealizedGain: -7244, changePct: -36.22 },
  { ticker: "NVDA", name: "NVIDIA Corporation", shares: 348, avgCost: 115.06, currentPrice: 213.53, sector: "Technology", currentValue: 74310, unrealizedGain: 34269, changePct: 85.59 },
  { ticker: "UNH", name: "UnitedHealth Group Incorporated", shares: 103, avgCost: 359.98, currentPrice: 350.88, sector: "Healthcare", currentValue: 36141, unrealizedGain: -937, changePct: -2.53 },
  { ticker: "MC", name: "LVMH Moet Hennessy Louis Vuitton SE", shares: 48, avgCost: 720.5, currentPrice: 547.99, sector: "Consumer", currentValue: 26304, unrealizedGain: -8280, changePct: -23.94 },
  { ticker: "CMG", name: "Chipotle Mexican Grill", shares: 470, avgCost: 34.14, currentPrice: 34.05, sector: "Consumer", currentValue: 16001, unrealizedGain: -45, changePct: -0.28 },
  { ticker: "CCJ", name: "Cameco Corporation", shares: 400, avgCost: 90.59, currentPrice: 121.68, sector: "Industrials", currentValue: 48672, unrealizedGain: 12436, changePct: 34.32 },
  { ticker: "VST", name: "Vistra Corp.", shares: 120, avgCost: 171.62, currentPrice: 167.07, sector: "Industrials", currentValue: 20048, unrealizedGain: -546, changePct: -2.65 },
];

export const PORTFOLIO_BONDS: FixedIncomePosition[] = [
  { name: "MGM 5\u00bd 04/15/2027", shares: 142, purchasePrice: 105.63, currentPrice: 97.24, value: 13808, unrealizedGain: -1191 },
  { name: "RTX 4\u00bd 6/1/2042", shares: 79, purchasePrice: 124.11, currentPrice: 108.3, value: 8556, unrealizedGain: -1249 },
  { name: "IEP 6\u00bc 05/15/2026", shares: 140, purchasePrice: 96.33, currentPrice: 93.84, value: 13138, unrealizedGain: -349 },
];

export const PORTFOLIO_MUTUAL_FUNDS: MutualFundPosition[] = [
  { ticker: "GHYIX", name: "Goldman Sachs High Yield Municipal Fund", shares: 1300, purchasePrice: 8.5, currentPrice: 9.09, value: 11817, unrealizedGain: 767 },
  { ticker: "VEMBX", name: "Vanguard Emerging Markets Bond Fund", shares: 1000, purchasePrice: 9.54, currentPrice: 10.75, value: 10750, unrealizedGain: 1210 },
  { ticker: "CQQQ", name: "Invesco China Technology ETF", shares: 667, purchasePrice: 31.39, currentPrice: 50.3, value: 33550, unrealizedGain: 12613 },
  { ticker: "JPST", name: "JPMorgan Ultra-Short Income ETF", shares: 336, purchasePrice: 50.56, currentPrice: 50.59, value: 17000, unrealizedGain: 12 },
];

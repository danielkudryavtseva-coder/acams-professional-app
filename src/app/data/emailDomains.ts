/**
 * Known finance firm email domains for contact matching and validation.
 */
export const FINANCE_EMAIL_DOMAINS: Record<string, string> = {
  "gs.com": "Goldman Sachs",
  "ms.com": "Morgan Stanley",
  "jpmorgan.com": "JPMorgan Chase",
  "bofa.com": "Bank of America",
  "citi.com": "Citigroup",
  "blackstone.com": "Blackstone",
  "kkr.com": "KKR",
  "apolloglobal.com": "Apollo Global Management",
  "carlyle.com": "The Carlyle Group",
  "tpg.com": "TPG",
  "bain.com": "Bain Capital",
  "warburg.com": "Warburg Pincus",
  "silverlake.com": "Silver Lake",
  "vista.com": "Vista Equity Partners",
  "thoma.com": "Thoma Bravo",
  "bridgewater.com": "Bridgewater Associates",
  "citadel.com": "Citadel",
  "deshaw.com": "D.E. Shaw",
  "twosigma.com": "Two Sigma",
  "renaissance.com": "Renaissance Technologies",
  "lazard.com": "Lazard",
  "evercore.com": "Evercore",
  "centerview.com": "Centerview Partners",
  "perella.com": "Perella Weinberg",
  "rothschild.com": "Rothschild & Co",
  "pwc.com": "PwC",
  "deloitte.com": "Deloitte",
  "ey.com": "Ernst & Young",
  "kpmg.com": "KPMG",
  "mckinsey.com": "McKinsey",
  "bcg.com": "BCG",
};

export function getFirmFromEmail(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase();
  return FINANCE_EMAIL_DOMAINS[domain] || null;
}

export function isFinanceEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? domain in FINANCE_EMAIL_DOMAINS : false;
}

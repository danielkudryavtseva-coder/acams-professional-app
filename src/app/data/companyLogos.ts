/**
 * Firm name -> domain, used to pull a logo via Google's public favicon
 * service (`https://www.google.com/s2/favicons`, no key required).
 *
 * Clearbit's old free logo API (logo.clearbit.com) was discontinued and no
 * longer resolves — don't switch back to it.
 *
 * Only covers recognizable/major firms from the alumni rolodex — firms not
 * listed here fall back to an initials badge on the Placements map. Add
 * entries here as new notable placements come in.
 */
export const COMPANY_DOMAINS: Record<string, string> = {
  "Goldman Sachs": "goldmansachs.com",
  "JP Morgan": "jpmorgan.com",
  "J.P. Morgan": "jpmorgan.com",
  "Morgan Stanley": "morganstanley.com",
  "BlackRock": "blackrock.com",
  "KPMG": "kpmg.com",
  "PwC": "pwc.com",
  "EY": "ey.com",
  "Deloitte": "deloitte.com",
  "PNC": "pnc.com",
  "Lockheed Martin": "lockheedmartin.com",
  "Regions": "regions.com",
  "Regions Bank": "regions.com",
  "Fidelity Investments": "fidelity.com",
  "Wells Fargo": "wellsfargo.com",
  "Protiviti": "protiviti.com",
  "UBS": "ubs.com",
  "GE Aerospace": "geaerospace.com",
  "Charles Schwab": "schwab.com",
  "Merrill Lynch": "ml.com",
  "Northern Trust": "northerntrust.com",
  "Aerotek": "aerotek.com",
  "Mizuho": "mizuhogroup.com",
  "Capgemini": "capgemini.com",
  "Polen Capital": "polencapital.com",
  "JMP Securities": "jmpsecurities.com",
  "TD Ameritrade": "tdameritrade.com",
  "Comcast": "comcast.com",
  "Comcast NBCUniversal": "comcast.com",
  "Crowe": "crowe.com",
  "ADTRAN": "adtran.com",
  "Piper Sandler": "pipersandler.com",
  "Leerink Partners": "leerink.com",
  "McMaster-Carr": "mcmaster.com",
  "S&P Global Market Intelligence": "spglobal.com",
  "Texas Capital": "texascapitalbank.com",
  "RSM": "rsmus.com",
  "Northrup Grumman": "northropgrumman.com",
  "Shell": "shell.com",
  "Amazon Web Services": "aws.amazon.com",
  "Boston Consulting Group": "bcg.com",
  "Cresset Capital": "cressetcapital.com",
  "Fisher Investments": "fisherinvestments.com",
  "CBRE": "cbre.com",
  "Walt Disney": "disney.com",
  "FORVIS": "forvis.com",
  "Plante Moran": "plantemoran.com",
  "Linde": "linde.com",
  "Capital One": "capitalone.com",
  "Raymond James": "raymondjames.com",
  "Sazerac": "sazerac.com",
  "Garmin": "garmin.com",
  "Kroll": "kroll.com",
  "Norfolk Southern": "nscorp.com",
  "UL Solutions": "ul.com",
  "Point72": "point72.com",
  "Armanino LLP": "armaninollp.com",
  "Deutsche Bank": "db.com",
  "Citi": "citigroup.com",
  "Gordon Brothers": "gordonbrothers.com",
};

export function logoUrlForFirm(firm: string): string | null {
  const domain = COMPANY_DOMAINS[firm.trim()];
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

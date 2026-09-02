import * as React from "react";
import { MOCK_ALUMNI } from "../data/mockData";
import { logoUrlForFirm, prestigeRank } from "../data/companyLogos";
import usaMapCrimson from "../../assets/map/usa-map-crimson.png";

/** How many firms to show in the top-companies logo wall. */
const TOP_COMPANIES_COUNT = 20;

/** Firms excluded from the "Top Placements" logo wall specifically (still counted toward totals). */
const TOP_PLACEMENTS_EXCLUDE = new Set(["Point72"]);

interface Company {
  firm: string;
  count: number;
  logo: string | null;
}

function sortCompanies(companies: Company[]): Company[] {
  return [...companies].sort((a, b) => {
    // Most-prestigious firms first (hedge funds, bulge bracket, Big 4, ...),
    // then recognizable (logo'd) firms, then by headcount.
    const rankDiff = prestigeRank(a.firm) - prestigeRank(b.firm);
    if (rankDiff !== 0) return rankDiff;
    if (!!a.logo !== !!b.logo) return a.logo ? -1 : 1;
    if (b.count !== a.count) return b.count - a.count;
    return a.firm.localeCompare(b.firm);
  });
}

/** Merge companies across every alumnus, summing headcounts for repeats. */
function mergeAllCompanies(): Company[] {
  const merged = new Map<string, Company>();
  for (const a of MOCK_ALUMNI) {
    const firm = a.firm?.trim();
    if (!firm || firm === "—") continue;
    const existing = merged.get(firm);
    if (existing) existing.count += 1;
    else merged.set(firm, { firm, count: 1, logo: logoUrlForFirm(firm) });
  }
  return sortCompanies(Array.from(merged.values()));
}

/** Plain logo-wall tile — no card, no chrome, matches a clean recruiting-page grid look. */
function LogoTile({ firm, logo }: Company) {
  const [errored, setErrored] = React.useState(false);
  const initials = firm
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const showLogo = !!logo && !errored;

  return (
    <div
      className="flex flex-col items-center justify-center gap-1.5 px-1 py-2 text-center"
      title={firm}
    >
      <div className="flex h-9 w-full items-center justify-center">
        {showLogo ? (
          <img
            src={logo!}
            alt={firm}
            loading="lazy"
            onError={() => setErrored(true)}
            className="max-h-9 max-w-full object-contain"
          />
        ) : (
          <span className="text-xs font-semibold text-[#7a142e]">{initials}</span>
        )}
      </div>
      <p className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">{firm}</p>
    </div>
  );
}

export function PlacementsMap() {
  const topCompanies = React.useMemo(
    () => mergeAllCompanies().filter((c) => !TOP_PLACEMENTS_EXCLUDE.has(c.firm)).slice(0, TOP_COMPANIES_COUNT),
    [],
  );

  const placedCount = MOCK_ALUMNI.filter(
    (a) => Number.isFinite(a.mapLat) && Number.isFinite(a.mapLng),
  ).length;

  return (
    <div>
      <div className="flex flex-col-reverse md:flex-row md:items-center">
        <div className="w-full md:flex-1">
          <img src={usaMapCrimson} alt="Map of the United States" className="mx-auto w-full max-w-xl" />
        </div>
        <aside className="w-full shrink-0 bg-paper p-4 dark:bg-card md:w-64">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Top placements
          </p>
          <div className="grid grid-cols-3 gap-x-1 gap-y-1 sm:grid-cols-4 md:grid-cols-2">
            {topCompanies.map((c) => (
              <LogoTile key={c.firm} {...c} />
            ))}
          </div>
        </aside>
      </div>
      <p className="px-1 pt-2 text-center text-xs text-muted-foreground">
        {placedCount} CAMS alumni nationwide
      </p>
    </div>
  );
}

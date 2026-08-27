import * as React from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MOCK_ALUMNI } from "../data/mockData";
import { logoUrlForFirm, prestigeRank } from "../data/companyLogos";
import pinImage from "../../assets/map/pin.png";

const CARTO_LIGHT_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    "osm-light": {
      type: "raster",
      // CARTO's free basemap CDN started requiring an API key — switched to the
      // standard OSM tile servers, which stay free/keyless for this traffic level.
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm-base", type: "raster", source: "osm-light" }],
};

/** How many firms to show in the always-visible top-companies overview. */
const TOP_COMPANIES_COUNT = 20;

/** Firms excluded from the "Top Placements" logo wall specifically (still counted toward city totals). */
const TOP_PLACEMENTS_EXCLUDE = new Set(["Point72"]);

/** Fixed pins: the 25 largest US metros + Birmingham (CAMS's home city), always shown regardless of data. */
const MAJOR_CITIES: { city: string; lat: number; lng: number }[] = [
  { city: "New York, NY", lat: 40.7128, lng: -74.006 },
  { city: "Los Angeles, CA", lat: 34.0522, lng: -118.2437 },
  { city: "Chicago, IL", lat: 41.8781, lng: -87.6298 },
  { city: "Dallas, TX", lat: 32.7767, lng: -96.797 },
  { city: "Houston, TX", lat: 29.7604, lng: -95.3698 },
  { city: "Washington, DC", lat: 38.9072, lng: -77.0369 },
  { city: "Miami, FL", lat: 25.7617, lng: -80.1918 },
  { city: "Philadelphia, PA", lat: 39.9526, lng: -75.1652 },
  { city: "Atlanta, GA", lat: 33.749, lng: -84.388 },
  { city: "Phoenix, AZ", lat: 33.4484, lng: -112.074 },
  { city: "Boston, MA", lat: 42.3601, lng: -71.0589 },
  { city: "San Francisco, CA", lat: 37.7749, lng: -122.4194 },
  { city: "Detroit, MI", lat: 42.3314, lng: -83.0458 },
  { city: "Seattle, WA", lat: 47.6062, lng: -122.3321 },
  { city: "Minneapolis, MN", lat: 44.9778, lng: -93.265 },
  { city: "San Diego, CA", lat: 32.7157, lng: -117.1611 },
  { city: "Tampa, FL", lat: 27.9506, lng: -82.4572 },
  { city: "Denver, CO", lat: 39.7392, lng: -104.9903 },
  { city: "St. Louis, MO", lat: 38.627, lng: -90.1994 },
  { city: "Baltimore, MD", lat: 39.2904, lng: -76.6122 },
  { city: "Charlotte, NC", lat: 35.2271, lng: -80.8431 },
  { city: "Orlando, FL", lat: 28.5383, lng: -81.3792 },
  { city: "San Antonio, TX", lat: 29.4241, lng: -98.4936 },
  { city: "Portland, OR", lat: 45.5152, lng: -122.6784 },
  { city: "Nashville, TN", lat: 36.1627, lng: -86.7816 },
  { city: "Birmingham, AL", lat: 33.5186, lng: -86.8104 },
];

interface Company {
  firm: string;
  count: number;
  logo: string | null;
}

interface CityPin {
  city: string;
  lat: number;
  lng: number;
  alumniCount: number;
  companies: Company[];
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

/** Buckets every alumnus with map coordinates into whichever major-city pin is geographically nearest. */
function buildCityPins(): CityPin[] {
  const buckets = new Map<string, typeof MOCK_ALUMNI>();
  for (const city of MAJOR_CITIES) buckets.set(city.city, []);

  for (const a of MOCK_ALUMNI) {
    if (!Number.isFinite(a.mapLat) || !Number.isFinite(a.mapLng)) continue;
    let nearest = MAJOR_CITIES[0];
    let bestDist = Infinity;
    for (const city of MAJOR_CITIES) {
      const dLat = city.lat - a.mapLat;
      const dLng = city.lng - a.mapLng;
      const dist = dLat * dLat + dLng * dLng;
      if (dist < bestDist) {
        bestDist = dist;
        nearest = city;
      }
    }
    buckets.get(nearest.city)!.push(a);
  }

  return MAJOR_CITIES.map((city) => {
    const alumni = buckets.get(city.city) ?? [];
    const companyCounts = new Map<string, number>();
    for (const a of alumni) {
      const firm = a.firm?.trim();
      if (!firm || firm === "—") continue;
      companyCounts.set(firm, (companyCounts.get(firm) ?? 0) + 1);
    }
    const companies = sortCompanies(
      Array.from(companyCounts.entries()).map(([firm, count]) => ({
        firm,
        count,
        logo: logoUrlForFirm(firm),
      })),
    );
    return { city: city.city, lat: city.lat, lng: city.lng, alumniCount: alumni.length, companies };
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

/** Square pin image size in px, scaled by alumni count. */
function pinSize(count: number): number {
  return Math.round(Math.min(48, 28 + count * 2));
}

function CompanyTile({ firm, count, logo }: Company) {
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
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-white px-2.5 py-2 dark:bg-card">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#fdecef]">
        {showLogo ? (
          <img
            src={logo!}
            alt={firm}
            loading="lazy"
            onError={() => setErrored(true)}
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <span className="text-[10px] font-semibold text-[#7a142e]">{initials}</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-foreground">{firm}</p>
        {count > 1 && (
          <p className="text-[10px] text-muted-foreground">{count} alumni</p>
        )}
      </div>
    </div>
  );
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

const PANEL_ANIMATION_CSS = `
.cams-panel-fade {
  animation: camsPanelIn 200ms ease-out;
}
@keyframes camsPanelIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

export function PlacementsMap() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);

  const [selectedCity, setSelectedCity] = React.useState<string | null>(null);

  const cityPins = React.useMemo(() => buildCityPins(), []);
  const topCompanies = React.useMemo(
    () => mergeAllCompanies().filter((c) => !TOP_PLACEMENTS_EXCLUDE.has(c.firm)).slice(0, TOP_COMPANIES_COUNT),
    [],
  );
  const selectedPin = selectedCity ? cityPins.find((c) => c.city === selectedCity) ?? null : null;

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (!document.getElementById("cams-panel-style")) {
      const style = document.createElement("style");
      style.id = "cams-panel-style";
      style.textContent = PANEL_ANIMATION_CSS;
      document.head.appendChild(style);
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: CARTO_LIGHT_STYLE,
      center: [-96, 38.5],
      zoom: 3.6,
      // Fully static — no pan, zoom, rotate, or scroll interaction. This is a
      // fixed overview of major-city pins, not a pannable/zoomable map.
      interactive: false,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    for (const pin of cityPins) {
      const size = pinSize(pin.alumniCount);

      // MapLibre applies its own positioning transform (translate) directly
      // to the marker's root element — never set `transform` on `el` itself
      // or it clobbers that positioning. Hover scaling goes on this inner
      // `img` instead, which MapLibre never touches.
      const el = document.createElement("div");
      el.style.cursor = "pointer";
      const img = document.createElement("img");
      img.src = pinImage;
      img.alt = "";
      img.style.width = `${size}px`;
      img.style.height = `${size}px`;
      img.style.display = "block";
      img.style.transition = "transform 120ms ease-out";
      img.style.transformOrigin = "bottom center";
      img.style.filter = "drop-shadow(0 2px 3px rgba(0,0,0,0.35))";
      el.appendChild(img);

      el.addEventListener("mouseenter", () => {
        img.style.transform = "scale(1.15)";
      });
      el.addEventListener("mouseleave", () => {
        img.style.transform = "scale(1)";
      });
      el.addEventListener("click", () => {
        setSelectedCity((prev) => (prev === pin.city ? null : pin.city));
      });

      new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placedCount = MOCK_ALUMNI.filter(
    (a) => Number.isFinite(a.mapLat) && Number.isFinite(a.mapLng),
  ).length;

  return (
    <div>
      <div className="flex flex-col-reverse md:flex-row">
        <div ref={containerRef} className="h-[420px] w-full sm:h-[480px] md:flex-1" />
        <aside className="w-full shrink-0 bg-paper p-4 dark:bg-card sm:h-[480px] md:w-64">
          {!selectedPin ? (
            <div className="cams-panel-fade">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Top placements
              </p>
              <div className="grid max-h-[280px] grid-cols-3 gap-x-1 gap-y-1 overflow-y-auto pr-1 sm:max-h-[420px] sm:grid-cols-4 md:max-h-[360px] md:grid-cols-2">
                {topCompanies.map((c) => (
                  <LogoTile key={c.firm} {...c} />
                ))}
              </div>
            </div>
          ) : selectedPin.companies.length === 0 ? (
            <div key={selectedPin.city} className="cams-panel-fade">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {selectedPin.city}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                No tracked placements near {selectedPin.city} yet.
              </p>
            </div>
          ) : (
            <div key={selectedPin.city} className="cams-panel-fade">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {selectedPin.city}
              </p>
              <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1 sm:max-h-[400px] md:max-h-[340px]">
                {selectedPin.companies.map((c) => (
                  <CompanyTile key={c.firm} {...c} />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
      <p className="px-1 pt-2 text-center text-xs text-muted-foreground">
        {placedCount} CAMS alumni &middot; click a pin to see placements in that area
      </p>
    </div>
  );
}

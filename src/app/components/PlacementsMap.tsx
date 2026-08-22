import * as React from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MOCK_ALUMNI } from "../data/mockData";
import { logoUrlForFirm } from "../data/companyLogos";
import pinImage from "../../assets/map/pin.png";

const CARTO_LIGHT_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sources: {
    "carto-light": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    },
  },
  layers: [{ id: "carto-base", type: "raster", source: "carto-light" }],
};

/** Below this zoom level the side panel shows the top companies overview instead of a per-city breakdown. */
const ZOOM_REVEAL_THRESHOLD = 4.2;

/** How many firms to show in the always-visible top-companies overview. */
const TOP_COMPANIES_COUNT = 20;

interface Company {
  firm: string;
  count: number;
  logo: string | null;
}

interface CityCluster {
  city: string;
  lat: number;
  lng: number;
  alumniCount: number;
  companies: Company[];
}

function buildCityClusters(): CityCluster[] {
  const byCity = new Map<
    string,
    { lat: number; lng: number; alumni: typeof MOCK_ALUMNI }
  >();
  for (const a of MOCK_ALUMNI) {
    if (!Number.isFinite(a.mapLat) || !Number.isFinite(a.mapLng)) continue;
    const key = a.mapCity || `${a.mapLat},${a.mapLng}`;
    const existing = byCity.get(key);
    if (existing) {
      existing.alumni.push(a);
    } else {
      byCity.set(key, { lat: a.mapLat, lng: a.mapLng, alumni: [a] });
    }
  }

  return Array.from(byCity.entries()).map(([city, { lat, lng, alumni }]) => {
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
    return { city, lat, lng, alumniCount: alumni.length, companies };
  });
}

function sortCompanies(companies: Company[]): Company[] {
  return [...companies].sort((a, b) => {
    // Recognizable (logo'd) firms surface first, then by headcount.
    if (!!a.logo !== !!b.logo) return a.logo ? -1 : 1;
    if (b.count !== a.count) return b.count - a.count;
    return a.firm.localeCompare(b.firm);
  });
}

/** Merge companies across every city currently in view, summing headcounts for repeats. */
function mergeCompanies(clusters: CityCluster[]): Company[] {
  const merged = new Map<string, Company>();
  for (const cluster of clusters) {
    for (const co of cluster.companies) {
      const existing = merged.get(co.firm);
      if (existing) existing.count += co.count;
      else merged.set(co.firm, { ...co });
    }
  }
  return sortCompanies(Array.from(merged.values()));
}

/** Square pin image size in px, scaled by alumni count. */
function pinSize(count: number): number {
  return Math.round(Math.min(52, 26 + count * 3));
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
  const clustersRef = React.useRef<CityCluster[]>([]);

  const [zoomedIn, setZoomedIn] = React.useState(false);
  const [panelLabel, setPanelLabel] = React.useState<string | null>(null);
  const [visibleCompanies, setVisibleCompanies] = React.useState<Company[]>([]);

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (!document.getElementById("cams-panel-style")) {
      const style = document.createElement("style");
      style.id = "cams-panel-style";
      style.textContent = PANEL_ANIMATION_CSS;
      document.head.appendChild(style);
    }

    const clusters = buildCityClusters();
    clustersRef.current = clusters;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: CARTO_LIGHT_STYLE,
      center: [-88, 36],
      zoom: 3.4,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    for (const cluster of clusters) {
      const size = pinSize(cluster.alumniCount);

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
        map.flyTo({
          center: [cluster.lng, cluster.lat],
          zoom: Math.max(map.getZoom(), ZOOM_REVEAL_THRESHOLD + 1.5),
          duration: 700,
          essential: true,
        });
      });

      new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([cluster.lng, cluster.lat])
        .addTo(map);
    }

    const updatePanel = () => {
      const zoom = map.getZoom();
      if (zoom < ZOOM_REVEAL_THRESHOLD) {
        setZoomedIn(false);
        setPanelLabel(null);
        setVisibleCompanies([]);
        return;
      }
      setZoomedIn(true);
      const bounds = map.getBounds();
      const inView = clustersRef.current.filter((c) =>
        bounds.contains([c.lng, c.lat]),
      );
      if (inView.length === 0) {
        setPanelLabel(null);
        setVisibleCompanies([]);
        return;
      }
      setPanelLabel(
        inView.length === 1 ? inView[0].city : `${inView.length} cities in view`,
      );
      setVisibleCompanies(mergeCompanies(inView));
    };

    updatePanel();

    map.on("moveend", updatePanel);
    map.on("zoomend", updatePanel);

    return () => {
      map.off("moveend", updatePanel);
      map.off("zoomend", updatePanel);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const clusterCount = React.useMemo(() => buildCityClusters().length, []);
  const placedCount = MOCK_ALUMNI.filter(
    (a) => Number.isFinite(a.mapLat) && Number.isFinite(a.mapLng),
  ).length;
  const topCompanies = React.useMemo(
    () => mergeCompanies(buildCityClusters()).slice(0, TOP_COMPANIES_COUNT),
    [],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-sm">
      <div className="flex flex-col md:flex-row">
        <div ref={containerRef} className="h-[420px] w-full sm:h-[480px] md:flex-1" />
        <aside className="w-full shrink-0 border-t border-border bg-paper p-4 dark:bg-card sm:h-[480px] md:w-64 md:border-l md:border-t-0">
          {!zoomedIn ? (
            <div className="cams-panel-fade">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Top placements
              </p>
              <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1 sm:max-h-[400px] md:max-h-[340px]">
                {topCompanies.map((c) => (
                  <CompanyTile key={c.firm} {...c} />
                ))}
              </div>
            </div>
          ) : visibleCompanies.length === 0 ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              No tracked placements in this view yet — pan toward a pin.
            </p>
          ) : (
            <div key={panelLabel ?? ""} className="cams-panel-fade">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {panelLabel}
              </p>
              <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1 sm:max-h-[400px] md:max-h-[340px]">
                {visibleCompanies.map((c) => (
                  <CompanyTile key={c.firm} {...c} />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
      <div className="border-t border-border bg-paper px-4 py-2 text-center text-xs text-muted-foreground dark:bg-card">
        {placedCount} CAMS alumni across {clusterCount} cities &middot; zoom in to see the firms
      </div>
    </div>
  );
}

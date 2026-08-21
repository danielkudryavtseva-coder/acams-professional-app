import * as React from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MOCK_ALUMNI } from "../data/mockData";
import { logoUrlForFirm } from "../data/companyLogos";

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

interface CityCluster {
  city: string;
  lat: number;
  lng: number;
  alumniCount: number;
  companies: { firm: string; count: number; logo: string | null }[];
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
    const companies = Array.from(companyCounts.entries())
      .map(([firm, count]) => ({ firm, count, logo: logoUrlForFirm(firm) }))
      .sort((a, b) => {
        // Recognizable (logo'd) firms surface first, then by headcount.
        if (!!a.logo !== !!b.logo) return a.logo ? -1 : 1;
        if (b.count !== a.count) return b.count - a.count;
        return a.firm.localeCompare(b.firm);
      });
    return { city, lat, lng, alumniCount: alumni.length, companies };
  });
}

function markerSize(count: number): number {
  return Math.round(Math.min(38, 18 + count * 2.5));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function popupHtmlFor(cluster: CityCluster): string {
  const shown = cluster.companies.slice(0, 12);
  const extra = cluster.companies.length - shown.length;

  const tiles = shown
    .map((c) => {
      const initials = c.firm
        .split(/\s+/)
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
      const safeFirm = escapeHtml(c.firm);
      const logoImg = c.logo
        ? `<img src="${c.logo}" alt="${safeFirm}" loading="lazy"
             style="width:100%;height:100%;object-fit:contain;border-radius:6px;"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
           <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;
             font-size:11px;font-weight:600;color:#7a142e;border-radius:6px;background:#fdecef;">${initials}</div>`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;
             font-size:11px;font-weight:600;color:#7a142e;border-radius:6px;background:#fdecef;">${initials}</div>`;

      return `
        <div class="cams-logo-tile" title="${safeFirm}${c.count > 1 ? ` (${c.count})` : ""}"
             style="display:flex;flex-direction:column;align-items:center;gap:4px;width:64px;">
          <div style="width:44px;height:44px;border:1px solid #e5e0e0;border-radius:8px;overflow:hidden;
               background:white;display:flex;align-items:center;justify-content:center;">
            ${logoImg}
          </div>
          <span style="font-size:10px;line-height:1.2;text-align:center;color:#555;
               display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
            ${safeFirm}
          </span>
        </div>`;
    })
    .join("");

  return `
    <div class="cams-popup-enter" style="font-family:inherit;min-width:220px;max-width:280px;">
      <div style="font-weight:700;font-size:14px;">${escapeHtml(cluster.city)}</div>
      <div style="font-size:11px;color:#888;margin-top:1px;margin-bottom:10px;">
        ${cluster.alumniCount} alum${cluster.alumniCount === 1 ? "" : "ni"} placed
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;">
        ${tiles}
      </div>
      ${extra > 0 ? `<div style="margin-top:8px;font-size:11px;color:#999;">+${extra} more</div>` : ""}
    </div>
  `;
}

const POPUP_ANIMATION_CSS = `
.cams-popup-enter {
  animation: camsPopupIn 160ms ease-out;
  transform-origin: bottom center;
}
@keyframes camsPopupIn {
  from { opacity: 0; transform: scale(0.92) translateY(4px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.maplibregl-popup-content {
  border-radius: 10px !important;
  padding: 14px !important;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18) !important;
}
`;

export function PlacementsMap() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (!document.getElementById("cams-popup-style")) {
      const style = document.createElement("style");
      style.id = "cams-popup-style";
      style.textContent = POPUP_ANIMATION_CSS;
      document.head.appendChild(style);
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: CARTO_LIGHT_STYLE,
      center: [-88, 36],
      zoom: 3.4,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const clusters = buildCityClusters();

    for (const cluster of clusters) {
      const size = markerSize(cluster.alumniCount);
      const el = document.createElement("div");
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.borderRadius = "9999px";
      el.style.background = "var(--crimson, #a3123c)";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.35)";
      el.style.cursor = "pointer";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.color = "white";
      el.style.fontSize = "11px";
      el.style.fontWeight = "700";
      el.style.transition = "transform 120ms ease-out";
      if (cluster.alumniCount > 1) el.textContent = String(cluster.alumniCount);
      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.12)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
      });

      const popup = new maplibregl.Popup({ offset: size / 2 + 6, maxWidth: "300px" }).setHTML(
        popupHtmlFor(cluster),
      );

      new maplibregl.Marker({ element: el })
        .setLngLat([cluster.lng, cluster.lat])
        .setPopup(popup)
        .addTo(map);

      // `marker.setPopup()` already binds its own click-to-toggle handler on
      // `el` — only handle the fly-to zoom here, don't also toggle the popup.
      el.addEventListener("click", () => {
        map.flyTo({
          center: [cluster.lng, cluster.lat],
          zoom: Math.max(map.getZoom(), 8.5),
          duration: 700,
          essential: true,
        });
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const clusterCount = React.useMemo(() => buildCityClusters().length, []);
  const placedCount = MOCK_ALUMNI.filter(
    (a) => Number.isFinite(a.mapLat) && Number.isFinite(a.mapLng),
  ).length;

  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-sm">
      <div ref={containerRef} className="h-[420px] w-full sm:h-[480px]" />
      <div className="border-t border-border bg-paper px-4 py-2 text-center text-xs text-muted-foreground dark:bg-card">
        {placedCount} CAMS alumni across {clusterCount} cities &middot; click a pin to zoom in and see the firms
      </div>
    </div>
  );
}

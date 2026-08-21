import * as React from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MOCK_ALUMNI } from "../data/mockData";

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

export function PlacementsMap() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);

  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: CARTO_LIGHT_STYLE,
      center: [-88, 36],
      zoom: 3.4,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    const placed = MOCK_ALUMNI.filter(
      (a) => Number.isFinite(a.mapLat) && Number.isFinite(a.mapLng),
    );

    for (const alum of placed) {
      const el = document.createElement("div");
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.borderRadius = "9999px";
      el.style.background = "var(--crimson, #a3123c)";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.35)";
      el.style.cursor = "pointer";

      const popupHtml = `
        <div style="font-family:inherit;min-width:160px">
          <div style="font-weight:600;font-size:13px">${alum.firstName} ${alum.lastName}</div>
          <div style="font-size:12px;color:#555;margin-top:2px">${alum.role}</div>
          <div style="font-size:12px;font-weight:500;margin-top:2px">${alum.firm}</div>
          <div style="font-size:11px;color:#888;margin-top:4px">${alum.mapCity} &middot; Class of ${alum.graduationYear}</div>
        </div>
      `;

      new maplibregl.Marker({ element: el })
        .setLngLat([alum.mapLng, alum.mapLat])
        .setPopup(new maplibregl.Popup({ offset: 14 }).setHTML(popupHtml))
        .addTo(map);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const placedCount = MOCK_ALUMNI.filter(
    (a) => Number.isFinite(a.mapLat) && Number.isFinite(a.mapLng),
  ).length;

  return (
    <div className="overflow-hidden rounded-xl border border-border shadow-sm">
      <div ref={containerRef} className="h-[420px] w-full sm:h-[480px]" />
      <div className="border-t border-border bg-paper px-4 py-2 text-center text-xs text-muted-foreground dark:bg-card">
        {placedCount} CAMS alumni placements shown &middot; click a pin for details
      </div>
    </div>
  );
}

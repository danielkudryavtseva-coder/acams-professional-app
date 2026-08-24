import * as React from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Search, X, ZoomIn } from "lucide-react";
import type { AlumniProfile } from "../data/mockData";

const TRACK_HEX: Record<string, string> = {
  IB: "#3b82f6",
  PE: "#a855f7",
  VC: "#22c55e",
  ER: "#f59e0b",
  AM: "#c73867",
  Consulting: "#94a3b8",
};

function alumniToGeoJSON(alumni: AlumniProfile[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: alumni.map((a) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [a.mapLng, a.mapLat] },
      properties: { id: a.id },
    })),
  };
}

interface AlumniMapProps {
  alumni: AlumniProfile[];
  onSelect?: (a: AlumniProfile) => void;
  focusRequest?: { id: string; seq: number } | null;
}

export default function AlumniMap({ alumni, onSelect, focusRequest }: AlumniMapProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const popupRef = React.useRef<maplibregl.Popup | null>(null);
  const alumniRef = React.useRef(alumni);
  alumniRef.current = alumni;

  const [ready, setReady] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [listResults, setListResults] = React.useState<AlumniProfile[]>([]);
  const [listLabel, setListLabel] = React.useState<string | null>(null);

  const byId = React.useMemo(() => {
    const m = new Map<string, AlumniProfile>();
    alumni.forEach((a) => m.set(a.id, a));
    return m;
  }, [alumni]);

  // Init map once
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          "carto-dark": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
              "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
              "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
          },
        },
        layers: [
          { id: "carto-dark-layer", type: "raster", source: "carto-dark", paint: { "raster-opacity": 0.85 } },
        ],
      },
      center: [-93, 38],
      zoom: 3.6,
      minZoom: 2.5,
      maxZoom: 14,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      map.addSource("alumni", {
        type: "geojson",
        data: alumniToGeoJSON(alumniRef.current),
        cluster: true,
        clusterMaxZoom: 9,
        clusterRadius: 40,
      });

      // glow underlay for high-tech feel
      map.addLayer({
        id: "alumni-glow",
        type: "circle",
        source: "alumni",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 12,
          "circle-color": "#c73867",
          "circle-opacity": 0.18,
          "circle-blur": 1,
        },
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "alumni",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#c73867",
          "circle-opacity": 0.85,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff5f8",
          "circle-radius": ["step", ["get", "point_count"], 16, 5, 20, 15, 26],
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "alumni",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Open Sans Bold"],
          "text-size": 12,
        },
        paint: { "text-color": "#ffffff" },
      });

      map.addLayer({
        id: "alumni-points",
        type: "circle",
        source: "alumni",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 6,
          "circle-color": "#c73867",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.on("mouseenter", "alumni-points", (e: maplibregl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = e.features?.[0];
        if (!feature) return;
        const id = feature.properties?.id as string;
        const a = alumniRef.current.find((al) => al.id === id);
        if (!a) return;

        popupRef.current?.remove();
        const html = `
          <div class="alumni-popup">
            <div class="alumni-popup-head">
              <span class="alumni-popup-name">${a.firstName} ${a.lastName}</span>
              <span class="alumni-popup-year">'${String(a.graduationYear).slice(-2)}</span>
            </div>
            <div class="alumni-popup-role">${a.role} · ${a.firm}</div>
            <div class="alumni-popup-city">${a.mapCity}</div>
            <span class="alumni-popup-track" style="background:${TRACK_HEX[a.track] || "#64748b"}">${a.track}</span>
          </div>`;
        popupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 14,
          className: "alumni-popup-wrap",
        })
          .setLngLat((feature.geometry as GeoJSON.Point).coordinates as [number, number])
          .setHTML(html)
          .addTo(map);
      });

      map.on("mouseleave", "alumni-points", () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
        popupRef.current = null;
      });

      map.on("click", "alumni-points", (e: maplibregl.MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        const id = feature?.properties?.id as string;
        const a = alumniRef.current.find((al) => al.id === id);
        if (a) onSelect?.(a);
      });

      map.on("click", "clusters", async (e: maplibregl.MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const clusterId = feature.properties?.cluster_id;
        const source = map.getSource("alumni") as maplibregl.GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        map.easeTo({ center: (feature.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
      });

      map.on("mouseenter", "clusters", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "clusters", () => (map.getCanvas().style.cursor = ""));

      setReady(true);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep source data in sync with filtered alumni prop
  React.useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource("alumni") as maplibregl.GeoJSONSource | undefined;
    source?.setData(alumniToGeoJSON(alumni));
  }, [alumni, ready]);

  // Fly to a specific alumnus when requested externally (e.g. rolodex row click)
  React.useEffect(() => {
    if (!ready || !focusRequest) return;
    const a = byId.get(focusRequest.id);
    const map = mapRef.current;
    if (!a || !map) return;
    map.flyTo({ center: [a.mapLng, a.mapLat], zoom: 10, speed: 1.1 });
    popupRef.current?.remove();
    const html = `
      <div class="alumni-popup">
        <div class="alumni-popup-head">
          <span class="alumni-popup-name">${a.firstName} ${a.lastName}</span>
          <span class="alumni-popup-year">'${String(a.graduationYear).slice(-2)}</span>
        </div>
        <div class="alumni-popup-role">${a.role} · ${a.firm}</div>
        <div class="alumni-popup-city">${a.mapCity}</div>
        <span class="alumni-popup-track" style="background:${TRACK_HEX[a.track] || "#64748b"}">${a.track}</span>
      </div>`;
    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      offset: 14,
      className: "alumni-popup-wrap",
    })
      .setLngLat([a.mapLng, a.mapLat])
      .setHTML(html)
      .addTo(map);
  }, [focusRequest, ready, byId]);

  // Search: matches name / firm / city / track; opens a results list and flies to
  // the first match's city (or re-centers on all matches if multiple cities involved)
  React.useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setListResults([]);
      setListLabel(null);
      return;
    }
    const matches = alumniRef.current.filter(
      (a) =>
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
        a.firm.toLowerCase().includes(q) ||
        a.mapCity.toLowerCase().includes(q) ||
        a.track.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q)
    );
    setListResults(matches);
    setListLabel(`"${query}"`);

    const map = mapRef.current;
    if (!map || matches.length === 0) return;
    if (matches.length === 1) {
      map.flyTo({ center: [matches[0].mapLng, matches[0].mapLat], zoom: 10, speed: 1.1 });
    } else {
      const lngs = matches.map((m) => m.mapLng);
      const lats = matches.map((m) => m.mapLat);
      const bounds = new maplibregl.LngLatBounds(
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)]
      );
      map.fitBounds(bounds, { padding: 80, maxZoom: 9, speed: 1.1 });
    }
  }, [query]);

  // Show a results box on zoom-in too (e.g. zoomed to a city cluster) — samples
  // whichever alumni currently sit within the visible viewport once zoomed past city level
  React.useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    if (!map) return;
    const onMoveEnd = () => {
      if (query.trim()) return; // search box already owns the list
      const zoom = map.getZoom();
      if (zoom < 7) {
        setListResults([]);
        setListLabel(null);
        return;
      }
      const bounds = map.getBounds();
      const visible = alumniRef.current.filter((a) => bounds.contains([a.mapLng, a.mapLat]));
      if (visible.length > 0 && visible.length <= 40) {
        setListResults(visible);
        setListLabel(visible.length === 1 ? visible[0].mapCity : `this area (${visible.length})`);
      } else {
        setListResults([]);
        setListLabel(null);
      }
    };
    map.on("moveend", onMoveEnd);
    return () => {
      map.off("moveend", onMoveEnd);
    };
  }, [ready, query]);

  const clearList = () => {
    setQuery("");
    setListResults([]);
    setListLabel(null);
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border border-[#2e3348] bg-[#0b0d15]">
      <div ref={containerRef} className="h-full w-full" />

      {/* Search bar */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex w-[min(340px,calc(100%-1.5rem))] flex-col gap-2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-[#2e3348] bg-[#141826]/90 px-3 py-2 shadow-lg backdrop-blur-md">
          <Search className="h-4 w-4 shrink-0 text-[#c73867]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, firm, city, track..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button type="button" onClick={clearList} className="text-slate-400 hover:text-slate-200">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {listResults.length > 0 && (
          <div className="pointer-events-auto max-h-[min(50vh,420px)] overflow-y-auto rounded-lg border border-[#2e3348] bg-[#141826]/95 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-1.5 border-b border-[#2e3348] px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-slate-400">
              <ZoomIn className="h-3 w-3" />
              {listLabel} &middot; {listResults.length} profile{listResults.length === 1 ? "" : "s"}
            </div>
            {listResults.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  mapRef.current?.flyTo({ center: [a.mapLng, a.mapLat], zoom: 11, speed: 1.2 });
                  onSelect?.(a);
                }}
                className="flex w-full flex-col gap-0.5 border-b border-[#20243444] px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-white/5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-slate-100">
                    {a.firstName} {a.lastName}
                  </span>
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold text-white"
                    style={{ backgroundColor: TRACK_HEX[a.track] || "#64748b" }}
                  >
                    {a.track}
                  </span>
                </div>
                <span className="truncate text-[11px] text-slate-400">
                  {a.role} · {a.firm}
                </span>
                <span className="flex items-center gap-1 truncate text-[10px] text-slate-500">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  {a.mapCity}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 hidden rounded-lg border border-[#2e3348] bg-[#141826]/90 px-3 py-2 text-[10px] text-slate-300 shadow-lg backdrop-blur-md sm:flex sm:flex-wrap sm:gap-x-3 sm:gap-y-1">
        {Object.entries(TRACK_HEX).map(([track, color]) => (
          <span key={track} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {track}
          </span>
        ))}
      </div>
    </div>
  );
}

export { TRACK_HEX };

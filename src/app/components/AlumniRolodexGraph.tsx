import * as React from "react";
import ForceGraph from "force-graph";
import type { AlumniProfile, FinanceTrack } from "../data/mockData";

/** Crimson-family palette to match the app's white + red brand theme.
 * Brand primary: hsl(343.9 53.6% 51.2%) ≈ #c73867. Tracks fan out across
 * shades of that hue, with Consulting kept neutral slate so it reads as "other". */
const TRACK_NODE_COLOR: Record<FinanceTrack, string> = {
  IB: "#c73867",
  PE: "#8a1a3a",
  VC: "#e25b82",
  ER: "#a82550",
  AM: "#f08aa8",
  Consulting: "#94a3b8",
};

const GRAPH_BG = "#ffffff";
const LINK_COLOR = "rgba(199, 56, 103, 0.22)";
const NODE_RING = "#7a142e";

export type GraphFocusRequest = { id: string; seq: number };

type GraphNode = AlumniProfile & { id: string; x?: number; y?: number };

interface AlumniRolodexGraphProps {
  alumni: AlumniProfile[];
  focusRequest: GraphFocusRequest | null;
  onNodeSelect?: (id: string) => void;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Builds city chains so alumni in the same location cluster without O(n²) edges. */
function buildGraphData(alumni: AlumniProfile[]) {
  const nodes: GraphNode[] = alumni.map((a) => ({ ...a, id: a.id }));
  const byCity = new Map<string, AlumniProfile[]>();
  for (const a of alumni) {
    if (!byCity.has(a.mapCity)) byCity.set(a.mapCity, []);
    byCity.get(a.mapCity)!.push(a);
  }
  const links: { source: string; target: string }[] = [];
  for (const group of byCity.values()) {
    const sorted = [...group].sort((x, y) => x.id.localeCompare(y.id));
    for (let i = 0; i < sorted.length - 1; i++) {
      links.push({ source: sorted[i].id, target: sorted[i + 1].id });
    }
  }
  return { nodes, links };
}

/** Kapsule API: `new ForceGraph()(element)` per https://github.com/vasturiano/force-graph examples. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createForceGraph(el: HTMLElement): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (ForceGraph as any)()(el);
}

export default function AlumniRolodexGraph({ alumni, focusRequest, onNodeSelect }: AlumniRolodexGraphProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = React.useRef<any>(null);
  const onNodeSelectRef = React.useRef(onNodeSelect);
  onNodeSelectRef.current = onNodeSelect;

  React.useEffect(() => {
    if (alumni.length === 0) return;
    const el = rootRef.current;
    if (!el) return;

    const data = buildGraphData(alumni);
    const fg = createForceGraph(el);
    fgRef.current = fg;

    const applySize = () => {
      const w = Math.max(280, Math.floor(el.clientWidth));
      const h = Math.max(280, Math.floor(el.clientHeight));
      fg.width(w);
      fg.height(h);
    };

    let didInitialFit = false;
    const fitToView = () => {
      try {
        fg.zoomToFit(400, 48);
      } catch {
        /* graph may have been torn down */
      }
    };

    fg.graphData(data)
      .backgroundColor(GRAPH_BG)
      .nodeId("id")
      .nodeLabel((n: GraphNode) => {
        const rows: Array<[string, string]> = [
          ["ID", n.id],
          ["Track", n.track],
          ["Graduation Year", String(n.graduationYear)],
          ["Firm", n.firm],
          ["Role", n.role],
          ["City", n.mapCity],
          ["Coordinates", `${n.mapLat.toFixed(4)}, ${n.mapLng.toFixed(4)}`],
          ["LinkedIn", n.linkedin],
          ["Available For Chat", n.availableForChat ? "Yes" : "No"],
          ["Bio", n.bio],
        ];
        if (n.email) rows.splice(7, 0, ["Email", n.email]);
        if (n.phone) rows.splice(8, 0, ["Phone", n.phone]);
        const body = rows
          .map(
            ([label, value]) =>
              `<div style="margin-top:4px"><span style="display:inline-block;min-width:118px;font-weight:600;color:#7a142e">${escapeHtml(label)}:</span><span>${escapeHtml(value)}</span></div>`,
          )
          .join("");
        return `<div style="max-width:420px;padding:10px 12px;font-size:12px;line-height:1.4;color:#1f2937;background:#ffffff;border:1px solid ${NODE_RING};border-left:4px solid ${NODE_RING};border-radius:8px;box-shadow:0 8px 18px rgba(122,20,46,0.16)"><div style="font-size:14px;font-weight:700;margin-bottom:6px">${escapeHtml(n.firstName)} ${escapeHtml(n.lastName)}</div>${body}</div>`;
      })
      .nodeColor((n: GraphNode) => TRACK_NODE_COLOR[n.track] ?? "#94a3b8")
      .nodeVal(() => 2)
      .nodeRelSize(7)
      .linkColor(() => LINK_COLOR)
      .linkWidth(1.2)
      .warmupTicks(80)
      .cooldownTicks(120)
      .onEngineStop(() => {
        didInitialFit = true;
        fitToView();
      })
      .onNodeClick((n: GraphNode) => {
        onNodeSelectRef.current?.(n.id);
      });

    applySize();
    const ro = new ResizeObserver(() => {
      applySize();
      if (didInitialFit) fitToView();
    });
    ro.observe(el);

    // Safety net: if the engine never reports stop (or stops before we attached),
    // try a couple of fits during warmup so users always see the cluster framed.
    const fallbackTimers = [
      window.setTimeout(fitToView, 600),
      window.setTimeout(fitToView, 1800),
    ];

    return () => {
      fallbackTimers.forEach((t) => window.clearTimeout(t));
      ro.disconnect();
      fg._destructor();
      fgRef.current = null;
      el.innerHTML = "";
    };
  }, [alumni]);

  React.useEffect(() => {
    if (!focusRequest) return;
    const id = focusRequest.id;
    const t0 = Date.now();
    const iv = window.setInterval(() => {
      const fg = fgRef.current;
      if (!fg) return;
      const { nodes } = fg.graphData() as { nodes: GraphNode[] };
      const node = nodes.find((x: GraphNode) => x.id === id);
      if (node && typeof node.x === "number" && typeof node.y === "number") {
        fg.centerAt(node.x, node.y, 450);
        fg.zoom(3.2, 450);
        window.clearInterval(iv);
      }
      if (Date.now() - t0 > 8000) window.clearInterval(iv);
    }, 100);
    return () => window.clearInterval(iv);
  }, [focusRequest]);

  const adjustZoom = React.useCallback((factor: number) => {
    const fg = fgRef.current;
    if (!fg) return;
    try {
      const current = typeof fg.zoom === "function" ? fg.zoom() : 1;
      const next = Math.max(0.2, Math.min(12, (current ?? 1) * factor));
      fg.zoom(next, 250);
    } catch {
      /* graph not ready */
    }
  }, []);

  const resetView = React.useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;
    try {
      fg.zoomToFit(400, 48);
    } catch {
      /* graph not ready */
    }
  }, []);

  if (alumni.length === 0) {
    return (
      <div className="flex h-full min-h-[420px] w-full items-center justify-center rounded-md border border-slate-200 bg-white text-sm text-slate-500">
        No alumni match the current filters.
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-md border border-slate-200 bg-white">
      <div ref={rootRef} className="h-full w-full" />
      <div className="pointer-events-none absolute right-3 top-3 flex flex-col gap-1">
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => adjustZoom(1.4)}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-base font-semibold text-slate-700 shadow-sm transition-colors hover:bg-[#fdecf1] hover:text-[#c73867] hover:border-[#c73867]/40"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => adjustZoom(1 / 1.4)}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-base font-semibold text-slate-700 shadow-sm transition-colors hover:bg-[#fdecf1] hover:text-[#c73867] hover:border-[#c73867]/40"
        >
          −
        </button>
        <button
          type="button"
          aria-label="Fit to view"
          title="Fit to view"
          onClick={resetView}
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-[10px] font-semibold uppercase tracking-wide text-slate-700 shadow-sm transition-colors hover:bg-[#fdecf1] hover:text-[#c73867] hover:border-[#c73867]/40"
        >
          Fit
        </button>
      </div>
    </div>
  );
}

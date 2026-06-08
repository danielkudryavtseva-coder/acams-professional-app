import * as React from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { MOCK_ALUMNI } from "../data/mockData";
import { useNews } from "../context/NewsContext";
import { CoffeeChatModal } from "../components/CoffeeChatModal";
import type { AlumniProfile } from "../data/mockData";
import { TRACK_COLORS } from "../data/constants";

const AlumniRolodexGraph = React.lazy(() => import("../components/AlumniRolodexGraph"));

export default function ConnectPage() {
  const { posts } = useNews();
  const [search, setSearch] = React.useState("");
  const [track, setTrack] = React.useState("all");
  const [selected, setSelected] = React.useState<{ id: string; name: string } | null>(null);
  const [graphFocusRequest, setGraphFocusRequest] = React.useState<{ id: string; seq: number } | null>(null);
  const [activeAlumniId, setActiveAlumniId] = React.useState<string | null>(null);

  const filtered = MOCK_ALUMNI.filter((a) => {
    const matchesSearch =
      !search ||
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      a.firm.toLowerCase().includes(search.toLowerCase()) ||
      a.mapCity.toLowerCase().includes(search.toLowerCase());
    const matchesTrack = track === "all" || a.track === track;
    return matchesSearch && matchesTrack;
  });

  const focusAlumniOnGraph = (a: AlumniProfile) => {
    setActiveAlumniId(a.id);
    setGraphFocusRequest({ id: a.id, seq: Date.now() });
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Connect</h1>
      <Tabs defaultValue="rolodex">
        <TabsList>
          <TabsTrigger value="rolodex">Alumni Rolodex</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>
        <TabsContent value="rolodex" className="mt-4 space-y-0">
          <div className="flex min-h-[calc(100vh-11rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <header className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold tracking-wide text-slate-900">Alumni network</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="Search name, firm, city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 sm:w-56"
                />
                <select
                  className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900"
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                >
                  <option value="all">All tracks</option>
                  <option value="IB">IB</option>
                  <option value="PE">PE</option>
                  <option value="VC">VC</option>
                  <option value="ER">ER</option>
                  <option value="AM">AM</option>
                  <option value="Consulting">Consulting</option>
                </select>
              </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <aside className="flex max-h-[min(42vh,360px)] w-full flex-col border-slate-200 bg-slate-50 lg:max-h-none lg:w-[300px] lg:shrink-0 lg:border-r lg:border-b-0 border-b">
                <div className="border-b border-slate-200 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  Vault / alumni ({filtered.length})
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {filtered.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => focusAlumniOnGraph(a)}
                      className={`flex w-full flex-col gap-1 border-b border-slate-200 px-3 py-2.5 text-left transition-colors hover:bg-white ${
                        activeAlumniId === a.id
                          ? "bg-[#fdecf1] ring-1 ring-inset ring-[#c73867]/40"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-slate-900">
                          {a.firstName} {a.lastName}
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-500">{a.graduationYear}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-600">
                        <MapPin className="h-3 w-3 shrink-0 text-[#c73867]" />
                        <span className="truncate">{a.mapCity}</span>
                      </div>
                      <p className="truncate text-[11px] text-slate-500">
                        {a.firm} · {a.role}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <Badge className={`${TRACK_COLORS[a.track]} h-5 border-0 px-1.5 text-[10px]`}>{a.track}</Badge>
                        {a.linkedin ? (
                          <a
                            href={`https://${a.linkedin.replace(/^https?:\/\//, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 text-[10px] text-[#c73867] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3" />
                            LinkedIn
                          </a>
                        ) : null}
                        {a.email ? (
                          <span className="truncate text-[10px] text-slate-500" title={a.email}>
                            {a.email}
                          </span>
                        ) : null}
                        {a.phone ? (
                          <span className="text-[10px] text-slate-500" title={a.phone}>
                            {a.phone}
                          </span>
                        ) : null}
                        {a.availableForChat && (
                          <button
                            type="button"
                            className="text-[10px] font-medium text-[#c73867] hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected({ id: a.id, name: `${a.firstName} ${a.lastName}` });
                            }}
                          >
                            Coffee chat
                          </button>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </aside>

              <div
                className="flex-1 bg-white p-2"
                style={{ height: "min(72vh, 760px)", minHeight: 420 }}
              >
                <React.Suspense
                  fallback={
                    <div className="flex h-full w-full items-center justify-center rounded-md border border-slate-200 bg-white text-sm text-slate-500">
                      Loading network graph…
                    </div>
                  }
                >
                  <AlumniRolodexGraph
                    alumni={filtered}
                    focusRequest={graphFocusRequest}
                    onNodeSelect={(id) => setActiveAlumniId(id)}
                  />
                </React.Suspense>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="community">
          <Card className="bg-white">
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold">Announcements</h3>
              {posts.filter((n) => n.category === "announcement").map((n) => (
                <div key={n.id} className="border rounded p-2">
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {selected && (
        <CoffeeChatModal
          open={!!selected}
          onOpenChange={(o) => !o && setSelected(null)}
          alumniId={selected.id}
          alumniName={selected.name}
        />
      )}
    </div>
  );
}

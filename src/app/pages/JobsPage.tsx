import * as React from "react";
import { differenceInDays } from "date-fns";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { MOCK_ALUMNI, MOCK_JOB_POSTINGS } from "../data/mockData";
import { CoffeeChatModal } from "../components/CoffeeChatModal";

export default function JobsPage() {
  const [search, setSearch] = React.useState("");
  const [selectedTrack, setSelectedTrack] = React.useState<string[]>([]);
  const [selectedPoster, setSelectedPoster] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState<{ id: string; name: string } | null>(null);

  const jobs = MOCK_JOB_POSTINGS.filter((j) => {
    const matchesSearch = !search || j.firm.toLowerCase().includes(search.toLowerCase()) || j.role.toLowerCase().includes(search.toLowerCase());
    const matchesTrack = selectedTrack.length === 0 || selectedTrack.includes(j.track);
    const matchesPoster = selectedPoster.length === 0 || selectedPoster.includes(j.postedBy);
    return matchesSearch && matchesTrack && matchesPoster;
  }).sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline));

  const toggle = (v: string, set: React.Dispatch<React.SetStateAction<string[]>>) => set((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Jobs</h1>
      <div className="grid xl:grid-cols-[280px_1fr] gap-4">
        <Card className="bg-white h-fit">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold">Filters</p>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Track</p>
              <div className="flex flex-wrap gap-1">{["IB", "PE", "VC", "ER", "AM", "Consulting"].map((t) => <Button key={t} size="sm" variant={selectedTrack.includes(t) ? "default" : "outline"} className={selectedTrack.includes(t) ? "bg-[#c63f60] hover:bg-[#c63f60]" : ""} onClick={() => toggle(t, setSelectedTrack)}>{t}</Button>)}</div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Posted By</p>
              <div className="flex gap-1">{["cams", "alumni"].map((p) => <Button key={p} size="sm" variant={selectedPoster.includes(p) ? "default" : "outline"} className={selectedPoster.includes(p) ? "bg-[#c63f60] hover:bg-[#c63f60]" : ""} onClick={() => toggle(p, setSelectedPoster)}>{p.toUpperCase()}</Button>)}</div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-3">
          <Input placeholder="Search by firm or role..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white" />
          {jobs.map((job) => {
            const days = differenceInDays(new Date(job.deadline), new Date());
            const urgency = days <= 7 ? "bg-red-100 text-red-700" : days <= 21 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700";
            const ref = MOCK_ALUMNI.find((a) => a.id === job.alumniReferralId);
            return (
              <Card key={job.id} className="bg-white">
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold">{job.firm}</p>
                    <p className="text-sm text-muted-foreground">{job.role}</p>
                    <p className="text-xs">{job.description}</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge>{job.track}</Badge>
                      <Badge className={urgency}>Deadline {new Date(job.deadline).toLocaleDateString()}</Badge>
                      {ref && <Badge variant="outline">Alumni referral</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => window.open(job.applicationLink, "_blank")}>Apply Now</Button>
                    {ref && <Button variant="outline" onClick={() => setSelected({ id: ref.id, name: `${ref.firstName} ${ref.lastName}` })}>Request Intro</Button>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      {selected && <CoffeeChatModal open={!!selected} onOpenChange={(o) => !o && setSelected(null)} alumniId={selected.id} alumniName={selected.name} />}
    </div>
  );
}

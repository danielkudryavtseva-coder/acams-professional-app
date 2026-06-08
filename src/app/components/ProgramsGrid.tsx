import { ExternalLink, Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MOCK_PROGRAMS, type Program } from "../data/mockData";
import { cn } from "./ui/utils";

const STATUS_CONFIG: Record<Program["status"], { label: string; className: string }> = {
  open: { label: "Open", className: "bg-white text-[#2f2e2e] border border-[#2f2e2e]/20" },
  closed: { label: "Closed", className: "bg-white text-[#2f2e2e] border border-[#2f2e2e]/20" },
  applied: { label: "Applied", className: "bg-white text-[#2f2e2e] border border-[#2f2e2e]/20" },
  interviewing: { label: "Interviewing", className: "bg-white text-[#2f2e2e] border border-[#2f2e2e]/20" },
  offer: { label: "Offer", className: "bg-[#c63f60] text-white" },
  rejected: { label: "Rejected", className: "bg-[#c63f60] text-white" },
};

const TYPE_LABELS: Record<Program["type"], string> = {
  IB: "Investment Banking",
  PE: "Private Equity",
  HF: "Hedge Fund",
  AM: "Asset Management",
  VC: "Venture Capital",
  consulting: "Consulting",
  ER: "Equity Research",
  ST: "Sales & Trading",
  RX: "Restructuring",
  Multi: "Multi-Division",
};

interface ProgramsGridProps {
  programs?: Program[];
  filter?: Program["status"] | "all";
}

export function ProgramsGrid({ programs = MOCK_PROGRAMS, filter = "all" }: ProgramsGridProps) {
  const filtered = filter === "all" ? programs : programs.filter((p) => p.status === filter);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filtered.map((program) => {
        const statusConfig = STATUS_CONFIG[program.status];
        return (
          <Card key={program.id} className="bg-white hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{program.firm}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{program.role}</p>
                </div>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0", statusConfig.className)}>
                  {statusConfig.label}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-xs">{TYPE_LABELS[program.type]}</Badge>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                {program.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {program.location}
                  </div>
                )}
                {program.deadline && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    Deadline: {new Date(program.deadline).toLocaleDateString()}
                  </div>
                )}
              </div>

              {program.applicationLink && program.status === "open" && (
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <a href={program.applicationLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1.5" />
                    Apply Now
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
      {filtered.length === 0 && (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          No programs found for this filter.
        </div>
      )}
    </div>
  );
}

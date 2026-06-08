import * as React from "react";
import { LineChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { MOCK_PORTFOLIO_DECISIONS, MOCK_RESOURCES } from "../data/mockData";

interface DecisionRow {
  id: string;
  date: string;
  ticker: string;
  title: string;
  kind: string;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

interface Props {
  memberId: string;
}

export function MemberDecisionsCard({ memberId }: Props) {
  const rows = React.useMemo<DecisionRow[]>(() => {
    const decisionRows: DecisionRow[] = MOCK_PORTFOLIO_DECISIONS.filter((d) =>
      d.taggedMemberIds.includes(memberId),
    ).map((d) => ({
      id: d.id,
      date: d.decidedAt,
      ticker: d.ticker,
      title: d.title,
      kind: d.decisionType,
    }));
    const pitchRows: DecisionRow[] = MOCK_RESOURCES.filter(
      (r) =>
        r.category === "pitches" &&
        (r.taggedMemberIds ?? []).includes(memberId),
    ).map((r) => ({
      id: r.id,
      date: r.uploadedAt,
      ticker: "—",
      title: r.title,
      kind: "pitch",
    }));
    return [...decisionRows, ...pitchRows].sort((a, b) =>
      a.date < b.date ? 1 : -1,
    );
  }, [memberId]);

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <LineChart className="h-4 w-4 text-crimson" />
          Decisions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tagged pitches or portfolio decisions yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b">
                  <th className="text-left font-medium py-2 pr-3">Date</th>
                  <th className="text-left font-medium py-2 pr-3">Ticker</th>
                  <th className="text-left font-medium py-2 pr-3">Title</th>
                  <th className="text-left font-medium py-2 pr-3">Type</th>
                  {/* TODO(pnl): wire to portfolioHoldings.ts realized/unrealized
                       once tag→trade attribution is signed off by execs. */}
                  <th className="text-right font-medium py-2 tabular">
                    P&amp;L
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-3 text-muted-foreground">
                      {formatDate(r.date)}
                    </td>
                    <td className="py-2 pr-3 font-medium">{r.ticker}</td>
                    <td className="py-2 pr-3">{r.title}</td>
                    <td className="py-2 pr-3">
                      <Badge variant="outline" className="capitalize">
                        {r.kind}
                      </Badge>
                    </td>
                    <td className="py-2 text-right tabular text-muted-foreground">
                      --
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

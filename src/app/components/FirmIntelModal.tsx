import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { MOCK_ALUMNI, MOCK_FIRM_CARDS } from "../data/mockData";

interface FirmIntelModalProps {
  firmName: string;
  open: boolean;
  onClose: () => void;
}

export function FirmIntelModal({ firmName, open, onClose }: FirmIntelModalProps) {
  const intel = MOCK_FIRM_CARDS.find((f) => f.firmName.toLowerCase() === firmName.toLowerCase());
  const alumni = MOCK_ALUMNI.filter((a) => intel?.camsAlumniIds.includes(a.id));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{firmName} Intelligence</DialogTitle></DialogHeader>
        {!intel ? (
          <p className="text-sm text-muted-foreground">No firm intel available.</p>
        ) : (
          <div className="space-y-3 text-sm">
            <Badge>{intel.track}</Badge>
            <div>
              <p className="font-medium">Recent Deals</p>
              <ul className="list-disc pl-5 mt-1">{intel.recentDeals.map((d) => <li key={d}>{d}</li>)}</ul>
            </div>
            <div>
              <p className="font-medium">CAMS Alumni</p>
              <div className="space-y-1 mt-1">{alumni.map((a) => <div key={a.id} className="border rounded p-2">{a.firstName} {a.lastName} — {a.role}</div>)}</div>
            </div>
            <p><span className="font-medium">Historical Placements:</span> {intel.historicalPlacements}</p>
            <p className="text-muted-foreground">{intel.notes}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { usePipeline, type PipelineStage, type PipelineContact } from "../context/PipelineContext";
import { cn } from "../components/ui/utils";

const STAGES: { id: PipelineStage; label: string; color: string }[] = [
  { id: "wishlist", label: "Wishlist", color: "border-gray-300" },
  { id: "networking", label: "Networking", color: "border-indigo-400" },
  { id: "applied", label: "Applied", color: "border-blue-400" },
  { id: "phone_screen", label: "Phone Screen", color: "border-yellow-400" },
  { id: "interview", label: "Interview", color: "border-orange-400" },
  { id: "offer", label: "Offer", color: "border-emerald-400" },
];

const PRIORITY_COLORS: Record<PipelineContact["priority"], string> = {
  high: "bg-[#c63f60] text-white",
  medium: "bg-white text-[#2f2e2e] border border-[#2f2e2e]/20",
  low: "bg-white text-[#2f2e2e] border border-[#2f2e2e]/20",
};

function ContactCard({
  contact,
  onDragStart,
  onDragEnd,
}: {
  contact: PipelineContact;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}) {
  return (
    <Card
      draggable
      onDragStart={() => onDragStart(contact.id)}
      onDragEnd={onDragEnd}
      className="group cursor-grab active:cursor-grabbing bg-white hover:shadow-md transition-shadow"
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{contact.name}</p>
            <p className="text-xs text-muted-foreground truncate">{contact.firm}</p>
            <p className="text-xs text-muted-foreground truncate">{contact.role}</p>
          </div>
          <span className={cn("text-xs px-1.5 py-0.5 rounded-sm font-medium flex-shrink-0", PRIORITY_COLORS[contact.priority])}>
            {contact.priority}
          </span>
        </div>
        {contact.notes && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{contact.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface AddDraft {
  name: string;
  firm: string;
  role: string;
  stage: PipelineStage;
  priority: PipelineContact["priority"];
  email: string;
  linkedin: string;
  notes: string;
}

const EMPTY_DRAFT = (stage: PipelineStage): AddDraft => ({
  name: "",
  firm: "",
  role: "",
  stage,
  priority: "medium",
  email: "",
  linkedin: "",
  notes: "",
});

function AddContactDialog({
  open,
  initialStage,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initialStage: PipelineStage;
  onClose: () => void;
  onSubmit: (draft: AddDraft) => void;
}) {
  const [draft, setDraft] = React.useState<AddDraft>(() => EMPTY_DRAFT(initialStage));

  // Reset the form whenever the dialog (re)opens, picking up the requested stage.
  React.useEffect(() => {
    if (open) setDraft(EMPTY_DRAFT(initialStage));
  }, [open, initialStage]);

  const canSubmit = draft.name.trim().length > 0 && draft.firm.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      ...draft,
      name: draft.name.trim(),
      firm: draft.firm.trim(),
      role: draft.role.trim(),
      email: draft.email.trim(),
      linkedin: draft.linkedin.trim(),
      notes: draft.notes.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add contact</DialogTitle>
          <DialogDescription>
            Track a new recruiting contact. Drag the card between columns to update its stage.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pl-name">Name *</Label>
              <Input
                id="pl-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Alex Chen"
                autoFocus
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pl-firm">Firm *</Label>
              <Input
                id="pl-firm"
                value={draft.firm}
                onChange={(e) => setDraft({ ...draft, firm: e.target.value })}
                placeholder="Goldman Sachs"
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pl-role">Role</Label>
            <Input
              id="pl-role"
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              placeholder="Investment Banking Analyst"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Stage</Label>
              <Select
                value={draft.stage}
                onValueChange={(v) => setDraft({ ...draft, stage: v as PipelineStage })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select
                value={draft.priority}
                onValueChange={(v) => setDraft({ ...draft, priority: v as PipelineContact["priority"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pl-email">Email</Label>
              <Input
                id="pl-email"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                placeholder="achen@gs.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pl-linkedin">LinkedIn</Label>
              <Input
                id="pl-linkedin"
                value={draft.linkedin}
                onChange={(e) => setDraft({ ...draft, linkedin: e.target.value })}
                placeholder="linkedin.com/in/..."
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pl-notes">Notes</Label>
            <Textarea
              id="pl-notes"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Met at info session, follow up next week"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit}>Add contact</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Pipeline() {
  const { contacts, addContact, moveStage } = usePipeline();
  const [draggedContactId, setDraggedContactId] = React.useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = React.useState<PipelineStage | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogStage, setDialogStage] = React.useState<PipelineStage>("wishlist");

  const getContactsForStage = (stage: PipelineStage) =>
    contacts.filter((c) => c.stage === stage);

  const handleDrop = (stage: PipelineStage) => {
    if (!draggedContactId) return;
    moveStage(draggedContactId, stage);
    setDraggedContactId(null);
    setDragOverStage(null);
  };

  const openAddDialog = (stage: PipelineStage) => {
    setDialogStage(stage);
    setDialogOpen(true);
  };

  const handleSubmit = (draft: AddDraft) => {
    addContact({
      name: draft.name,
      firm: draft.firm,
      role: draft.role,
      stage: draft.stage,
      priority: draft.priority,
      email: draft.email || undefined,
      linkedin: draft.linkedin || undefined,
      notes: draft.notes || undefined,
    });
    setDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {contacts.length} contacts across {STAGES.length} stages
          </p>
        </div>
        <Button size="sm" onClick={() => openAddDialog("wishlist")}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Contact
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STAGES.map((stage) => {
          const stageContacts = getContactsForStage(stage.id);
          return (
            <div key={stage.id}>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverStage !== stage.id) setDragOverStage(stage.id);
                }}
                onDragLeave={() => {
                  if (dragOverStage === stage.id) setDragOverStage(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(stage.id);
                }}
                className={cn(
                  "rounded-lg border-t-2 bg-white p-3 transition-colors",
                  stage.color,
                  dragOverStage === stage.id && "ring-2 ring-primary/60"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{stage.label}</h3>
                  <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5 border">
                    {stageContacts.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {stageContacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      onDragStart={(id) => setDraggedContactId(id)}
                      onDragEnd={() => {
                        setDraggedContactId(null);
                        setDragOverStage(null);
                      }}
                    />
                  ))}
                  {stageContacts.length === 0 && (
                    <div className="flex items-center justify-center h-20 border border-dashed rounded-md text-xs text-muted-foreground">
                      No contacts
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => openAddDialog(stage.id)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <AddContactDialog
        open={dialogOpen}
        initialStage={dialogStage}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

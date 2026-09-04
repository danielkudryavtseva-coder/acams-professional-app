import * as React from "react";
import { Search, Plus, Mail, Linkedin, MoreHorizontal, Trash2, Download, Upload, CircleDot } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { AddContactModal, DeleteContactModal } from "../components/ContactModals";
import { MOCK_CONTACTS, CONTACT_STAGE_LABEL, type Contact, type ContactStage, type ContactPriority } from "../data/mockData";
import { usePipeline, type PipelineStage } from "../context/PipelineContext";
import { PageHeader } from "../components/PageHeader";
import { parseContactsFile } from "../lib/parseContactsFile";

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const STATUS_BADGE: Record<Contact["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  inactive: { label: "Inactive", variant: "secondary" },
  do_not_contact: { label: "DNC", variant: "destructive" },
};

// A contact's stage tracks relationship progress (researching a firm through interviewing);
// Pipeline's stage tracks an actual application funnel. They're deliberately separate systems
// (see PipelineContext.tsx), so this is a one-time best-effort mapping at the moment of the
// move, not a live sync — "interviewing" is the one contact stage strong enough to skip past
// "networking" and land straight on Pipeline's "interview".
const CONTACT_TO_PIPELINE_STAGE: Record<ContactStage, PipelineStage> = {
  researching: "wishlist",
  reached_out: "networking",
  replied: "networking",
  coffee_chat: "networking",
  interviewing: "interview",
};

export default function ContactsPage() {
  const [contacts, setContacts] = React.useState<Contact[]>(MOCK_CONTACTS);
  const [search, setSearch] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Contact | null>(null);
  const [importing, setImporting] = React.useState(false);
  const importInputRef = React.useRef<HTMLInputElement>(null);
  const { contacts: pipelineContacts, addContact: addPipelineContact } = usePipeline();

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.firm.toLowerCase().includes(q) ||
      c.role.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  const handleAddContact = (data: Omit<Contact, "id" | "tags">) => {
    const newContact: Contact = {
      ...data,
      id: crypto.randomUUID(),
      tags: [],
    };
    setContacts((prev) => [newContact, ...prev]);
  };

  const handleDeleteContact = () => {
    if (!deleteTarget) return;
    setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const updateContact = (id: string, updates: Partial<Contact>) =>
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

  const isDuplicateOfExisting = React.useCallback(
    (imported: { name: string; firm: string; email?: string }, existing: Contact[]) =>
      existing.some(
        (c) =>
          (imported.email && c.email && c.email.toLowerCase() === imported.email.toLowerCase()) ||
          (c.name.toLowerCase() === imported.name.toLowerCase() && c.firm.toLowerCase() === imported.firm.toLowerCase()),
      ),
    [],
  );

  const handleImportFile = async (file: File) => {
    setImporting(true);
    try {
      const result = await parseContactsFile(file);
      if (result.contacts.length === 0 && result.errors.length === 0) {
        toast.error("Nothing to import — the file looked empty.");
        return;
      }

      let added = 0;
      let duplicates = 0;
      setContacts((prev) => {
        const next = [...prev];
        for (const imported of result.contacts) {
          if (isDuplicateOfExisting(imported, next)) {
            duplicates += 1;
            continue;
          }
          next.unshift({ ...imported, id: crypto.randomUUID(), tags: [] });
          added += 1;
        }
        return next;
      });

      const parts = [`${added} contact${added === 1 ? "" : "s"} imported`];
      if (duplicates > 0) parts.push(`${duplicates} duplicate${duplicates === 1 ? "" : "s"} skipped`);
      if (result.errors.length > 0) parts.push(`${result.errors.length} row${result.errors.length === 1 ? "" : "s"} had problems`);
      const summary = parts.join(" · ");

      if (added > 0) {
        toast.success(summary, {
          description: result.errors.length > 0 ? result.errors.slice(0, 3).join(" ") : undefined,
        });
      } else {
        toast.error(summary || "No contacts could be imported.", {
          description: result.errors.slice(0, 3).join(" ") || undefined,
        });
      }
    } catch (err) {
      toast.error("Couldn't read that file — make sure it's a .csv, .xlsx, or .xls export.");
      console.error("Contact import failed:", err);
    } finally {
      setImporting(false);
    }
  };

  const exportCsv = () => {
    const cols: (keyof Contact)[] = ["name", "firm", "role", "email", "linkedin", "phone", "location", "stage", "priority", "status", "lastContacted", "notes"];
    const escapeCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [cols.join(","), ...filtered.map((c) => cols.map((col) => escapeCell(c[col])).join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cams-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isAlreadyInPipeline = React.useCallback(
    (contact: Contact) =>
      pipelineContacts.some(
        (p) =>
          (contact.email && p.email && p.email.toLowerCase() === contact.email.toLowerCase()) ||
          (p.name.toLowerCase() === contact.name.toLowerCase() && p.firm.toLowerCase() === contact.firm.toLowerCase())
      ),
    [pipelineContacts]
  );

  const moveToPipeline = React.useCallback(
    (contact: Contact) => {
      if (isAlreadyInPipeline(contact)) return;
      addPipelineContact({
        name: contact.name,
        firm: contact.firm,
        role: contact.role,
        stage: CONTACT_TO_PIPELINE_STAGE[contact.stage],
        lastContact: contact.lastContacted,
        notes: contact.notes,
        email: contact.email,
        linkedin: contact.linkedin,
        priority: contact.priority,
      });
    },
    [addPipelineContact, isAlreadyInPipeline]
  );

  return (
    <div className="p-6 space-y-4 max-w-content mx-auto">
      <PageHeader
        title="Contacts"
        description={`Manage your professional network of ${contacts.length} contacts`}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-1.5" /> Export
            </Button>
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = ""; // allow re-selecting the same file after a failed import
                if (file) void handleImportFile(file);
              }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={importing}
              onClick={() => importInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1.5" /> {importing ? "Importing..." : "Import CSV/Excel"}
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Contact
            </Button>
          </>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts by name, company, or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="border rounded-lg overflow-hidden bg-white dark:bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((contact) => {
              const status = STATUS_BADGE[contact.status];
              return (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{getInitials(contact.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{contact.name}</p>
                        {contact.email && (
                          <p className="text-xs text-muted-foreground">{contact.email}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{contact.firm}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{contact.role}</TableCell>
                  <TableCell>
                    <Select
                      value={contact.stage}
                      onValueChange={(v) => updateContact(contact.id, { stage: v as ContactStage })}
                    >
                      <SelectTrigger className="h-7 w-[9.5rem] text-xs border-none bg-transparent px-0 shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(CONTACT_STAGE_LABEL) as ContactStage[]).map((s) => (
                          <SelectItem key={s} value={s}>{CONTACT_STAGE_LABEL[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={contact.priority}
                      onValueChange={(v) => updateContact(contact.id, { priority: v as ContactPriority })}
                    >
                      <SelectTrigger
                        className={
                          "h-7 w-[6.5rem] text-xs border-none bg-transparent px-0 shadow-none " +
                          (contact.priority === "high"
                            ? "text-crimson"
                            : contact.priority === "medium"
                              ? "text-amber-600"
                              : "")
                        }
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className="text-xs inline-flex items-center gap-1">
                      <CircleDot className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{contact.email || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{contact.phone || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{contact.location || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={isAlreadyInPipeline(contact) ? "outline" : "default"}
                      className={!isAlreadyInPipeline(contact) ? "bg-crimson hover:bg-crimson" : ""}
                      disabled={isAlreadyInPipeline(contact)}
                      onClick={() => moveToPipeline(contact)}
                    >
                      {isAlreadyInPipeline(contact) ? "In Pipeline" : "Move to Pipeline"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {contact.email && (
                          <DropdownMenuItem asChild>
                            <a href={`mailto:${contact.email}`}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </a>
                          </DropdownMenuItem>
                        )}
                        {contact.linkedin && (
                          <DropdownMenuItem asChild>
                            <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
                              <Linkedin className="h-4 w-4 mr-2" />
                              LinkedIn
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(contact)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-10 text-muted-foreground">
                  No contacts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AddContactModal open={addOpen} onOpenChange={setAddOpen} onSave={handleAddContact} />
      <DeleteContactModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        contactName={deleteTarget?.name}
        onConfirm={handleDeleteContact}
      />
    </div>
  );
}

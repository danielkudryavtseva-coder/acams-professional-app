import * as React from "react";
import { Search, Plus, Mail, Linkedin, MoreHorizontal, Trash2, Download, Upload, CircleDot } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { AddContactModal, DeleteContactModal } from "../components/ContactModals";
import { MOCK_CONTACTS, type Contact } from "../data/mockData";
import { usePipeline } from "../context/PipelineContext";

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const STATUS_BADGE: Record<Contact["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Active", variant: "default" },
  inactive: { label: "Inactive", variant: "secondary" },
  do_not_contact: { label: "DNC", variant: "destructive" },
};

export default function ContactsPage() {
  const [contacts, setContacts] = React.useState<Contact[]>(MOCK_CONTACTS);
  const [search, setSearch] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Contact | null>(null);
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

  const getStage = (index: number) => {
    const stages = ["Researching", "Reached Out", "Replied", "Coffee Chat", "Interviewing"];
    return stages[index % stages.length];
  };

  const getPriority = (index: number): "High" | "Medium" | "Low" => {
    if (index % 3 === 0) return "High";
    if (index % 3 === 1) return "Medium";
    return "Low";
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
        stage: "networking",
        lastContact: contact.lastContacted,
        notes: contact.notes,
        email: contact.email,
        linkedin: contact.linkedin,
        priority: "medium",
      });
    },
    [addPipelineContact, isAlreadyInPipeline]
  );

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your professional network of {contacts.length} contacts
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1.5" /> Export</Button>
          <Button size="sm" className="bg-[#c63f60] hover:bg-[#c63f60]"><Upload className="h-4 w-4 mr-1.5" /> Import CSV/Excel</Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Contact
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts by name, company, or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
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
            {filtered.map((contact, index) => {
              const status = STATUS_BADGE[contact.status];
              const stage = getStage(index);
              const priority = getPriority(index);
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
                    <Badge variant="outline" className="text-xs">{stage}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        priority === "High"
                          ? "text-xs border-[#c63f60] text-[#c63f60]"
                          : priority === "Medium"
                            ? "text-xs border-amber-500 text-amber-600"
                            : "text-xs"
                      }
                    >
                      {priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className="text-xs inline-flex items-center gap-1">
                      <CircleDot className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{contact.email || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{contact.phone || "+1 (212) 555-0468"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{contact.location || "New York, NY"}</TableCell>
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
                      className={!isAlreadyInPipeline(contact) ? "bg-[#c63f60] hover:bg-[#c63f60]" : ""}
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

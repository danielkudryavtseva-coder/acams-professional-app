import * as React from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";
import { useMembers } from "../context/MembersContext";
import { useTags } from "../context/TagsContext";
import { MOCK_RESOURCES, type Resource } from "../data/mockData";
import { DropboxEmbed } from "../components/DropboxEmbed";
import { BoxEmbed } from "../components/BoxEmbed";
import { TaggedMembersRow } from "../components/TaggedMembersRow";

export default function ResourcesPage() {
  const { isExec, currentUser } = useAuth();
  const { members } = useMembers();
  const { freezeSnapshot } = useTags();
  const membersById = React.useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members],
  );
  const [resources, setResources] = React.useState<Resource[]>(MOCK_RESOURCES);
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<Resource["category"]>("pitches");
  const [taggedMemberIds, setTaggedMemberIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (category !== "pitches") setTaggedMemberIds([]);
  }, [category]);

  const toggleMemberTag = (id: string) => {
    setTaggedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const addResource = () => {
    const uploader = currentUser?.id ?? "exec";
    const snapshot =
      category === "pitches" && taggedMemberIds.length > 0
        ? freezeSnapshot(taggedMemberIds)
        : undefined;
    setResources((prev) => [
      ...prev,
      {
        id: `r${Date.now()}`,
        title,
        category,
        description,
        uploadedBy: uploader,
        uploadedAt: new Date().toISOString(),
        ...(category === "pitches"
          ? {
              taggedMemberIds: taggedMemberIds.length ? taggedMemberIds : undefined,
              tagSnapshot: snapshot,
            }
          : {}),
      },
    ]);
    setOpen(false);
    setTitle("");
    setDescription("");
    setTaggedMemberIds([]);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Resources</h1>
        {isExec && (
          <Button
            onClick={() => {
              setTitle("");
              setDescription("");
              setTaggedMemberIds([]);
              setCategory("pitches");
              setOpen(true);
            }}
          >
            Upload Resource
          </Button>
        )}
      </div>
      <Tabs defaultValue="box">
        <TabsList>
          <TabsTrigger value="box">Box</TabsTrigger>
          <TabsTrigger value="pitches">Pitches</TabsTrigger>
          <TabsTrigger value="resumes">Resumes</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="dropbox">Dropbox</TabsTrigger>
        </TabsList>
        <TabsContent value="box">
          <BoxEmbed />
        </TabsContent>
        <TabsContent value="dropbox">
          <DropboxEmbed />
        </TabsContent>
        {(["pitches", "resumes", "tools", "links"] as const).map((cat) => (
          <TabsContent key={cat} value={cat}>
            <div className="grid md:grid-cols-2 gap-3">
              {resources
                .filter((r) => r.category === cat)
                .map((r) => (
                  <Card key={r.id} className="bg-white">
                    <CardContent className="p-4 space-y-2">
                      <p className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" /> {r.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{r.description}</p>
                      {r.taggedMemberIds && r.taggedMemberIds.length > 0 && (
                        <div className="pt-1">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">
                            Authors
                          </p>
                          <TaggedMembersRow
                            taggedMemberIds={r.taggedMemberIds}
                            membersById={membersById}
                            tagSnapshot={r.tagSnapshot}
                          />
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        {r.url ? (
                          <Button variant="outline" asChild>
                            <a href={r.url} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              Open
                            </a>
                          </Button>
                        ) : (
                          <Button variant="outline">Download</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Resource</DialogTitle>
          </DialogHeader>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
          <select
            className="h-10 rounded-md border px-3 text-sm bg-white"
            value={category}
            onChange={(e) => setCategory(e.target.value as Resource["category"])}
          >
            <option value="pitches">Pitches</option>
            <option value="resumes">Resumes</option>
            <option value="tools">Tools</option>
            <option value="links">Links</option>
          </select>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />
          {category === "pitches" && (
            <div className="space-y-2 rounded-md border bg-muted/20 p-3">
              <Label className="text-xs text-muted-foreground">
                Tag members on this pitch (snapshot frozen at upload)
              </Label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {members
                  .filter((m) => m.active !== false)
                  .map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMemberTag(m.id)}
                      className={`text-xs rounded-full border px-2 py-0.5 ${
                        taggedMemberIds.includes(m.id)
                          ? "border-crimson bg-crimson/10 text-crimson"
                          : "border-border bg-background"
                      }`}
                    >
                      {m.firstName} {m.lastName}
                    </button>
                  ))}
              </div>
            </div>
          )}
          <Button onClick={addResource}>Submit</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

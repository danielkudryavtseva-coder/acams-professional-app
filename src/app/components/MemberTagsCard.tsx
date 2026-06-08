import * as React from "react";
import { Tag as TagIcon, Plus, X, Check, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { useTags } from "../context/TagsContext";
import { useAuth } from "../context/AuthContext";
import {
  TAG_CATEGORY_COLORS,
  TAG_CATEGORY_LABELS,
  type Tag,
  type TagCategory,
} from "../data/tags";

const CATEGORY_ORDER: TagCategory[] = [
  "alumni",
  "career",
  "grade",
  "committee",
  "custom",
];

function chipClass(tag: Tag) {
  return tag.color ?? TAG_CATEGORY_COLORS[tag.category];
}

interface Props {
  /** Member whose tags are being shown. */
  memberId: string;
  /** When true, render add/remove controls and pending-approval row. */
  editable?: boolean;
}

export function MemberTagsCard({ memberId, editable = true }: Props) {
  const {
    tags,
    assignments,
    getTagsForMember,
    getPendingForMember,
    requestTag,
    removeTagFromMember,
    approveTag,
    rejectTag,
  } = useTags();
  const { currentUser, isExec } = useAuth();
  const approved = getTagsForMember(memberId);
  const pending = getPendingForMember(memberId);

  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<TagCategory | "">("");
  const [tagId, setTagId] = React.useState<string>("");
  const [reason, setReason] = React.useState("");
  const [pendingRemoveAlumni, setPendingRemoveAlumni] = React.useState<Tag | null>(null);

  const grouped = React.useMemo(() => {
    const map = new Map<TagCategory, Tag[]>();
    for (const t of approved) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return map;
  }, [approved]);

  const tagsForCategory = React.useMemo(() => {
    if (!category) return [];
    const assignedIds = new Set(approved.map((t) => t.id));
    const pendingIds = new Set(pending.map((p) => p.tagId));
    return tags.filter(
      (t) =>
        t.category === category &&
        !assignedIds.has(t.id) &&
        !pendingIds.has(t.id),
    );
  }, [category, tags, approved, pending]);

  const selectedTag = tags.find((t) => t.id === tagId);

  const resetDialog = () => {
    setCategory("");
    setTagId("");
    setReason("");
  };

  const submit = () => {
    if (!selectedTag) return;
    if (selectedTag.requiresApproval && reason.trim().length === 0) return;
    requestTag(memberId, selectedTag.id, reason.trim() || undefined);
    setOpen(false);
    resetDialog();
  };

  const canRemoveChip = (tag: Tag) => {
    if (!currentUser) return false;
    const a = assignments.find(
      (x) =>
        x.memberId === memberId &&
        x.tagId === tag.id &&
        x.status === "approved",
    );
    if (!a) return false;
    return isExec || a.requestedBy === currentUser.id;
  };

  const onRemove = (tag: Tag) => {
    if (tag.category === "alumni") {
      setPendingRemoveAlumni(tag);
      return;
    }
    removeTagFromMember(memberId, tag.id);
  };

  return (
    <Card className="bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TagIcon className="h-4 w-4 text-crimson" />
          Tags
        </CardTitle>
        {editable && (
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) resetDialog();
            }}
          >
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setOpen(true)}
              className="text-crimson border-crimson hover:bg-crimson hover:text-white"
            >
              <Plus className="h-4 w-4 mr-1" /> Add tag
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a tag</DialogTitle>
                <DialogDescription>
                  Pick a category, then a tag. Alumni tags require exec approval.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Category</label>
                  <Select
                    value={category}
                    onValueChange={(v) => {
                      setCategory(v as TagCategory);
                      setTagId("");
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_ORDER.map((c) => (
                        <SelectItem key={c} value={c}>
                          {TAG_CATEGORY_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tag</label>
                  <Select
                    value={tagId}
                    onValueChange={setTagId}
                    disabled={!category || tagsForCategory.length === 0}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue
                        placeholder={
                          !category
                            ? "Pick a category first"
                            : tagsForCategory.length === 0
                              ? "No tags available in this category"
                              : "Select a tag"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {tagsForCategory.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedTag?.requiresApproval && (
                  <div>
                    <label className="text-xs text-muted-foreground">
                      Reason (required)
                    </label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Where do you work, when did you graduate, why should this be approved?"
                      rows={4}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={submit}
                  disabled={
                    !selectedTag ||
                    (selectedTag.requiresApproval && reason.trim().length === 0)
                  }
                  className="bg-crimson hover:bg-crimson-dark text-white"
                >
                  {selectedTag?.requiresApproval ? "Request" : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {approved.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags yet.</p>
        ) : (
          CATEGORY_ORDER.filter((c) => grouped.has(c)).map((c) => (
            <div key={c}>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {TAG_CATEGORY_LABELS[c]}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {grouped.get(c)!.map((t) => (
                  <Badge
                    key={t.id}
                    className={`${chipClass(t)} flex items-center gap-1`}
                  >
                    {t.label}
                    {editable && canRemoveChip(t) && (
                      <button
                        type="button"
                        aria-label={`Remove ${t.label}`}
                        onClick={() => onRemove(t)}
                        className="ml-1 -mr-0.5 opacity-70 hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          ))
        )}

        {pending.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Pending exec approval
            </p>
            <div className="flex flex-col gap-2">
              {pending.map((p) => {
                const tag = tags.find((t) => t.id === p.tagId);
                if (!tag) return null;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        title="Pending exec approval"
                        className="bg-slate-100 text-slate-600 border border-dashed"
                      >
                        {tag.label}
                      </Badge>
                      {p.reason && (
                        <span className="text-xs text-muted-foreground italic truncate max-w-[20rem]">
                          {p.reason}
                        </span>
                      )}
                    </div>
                    {isExec && currentUser && (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => approveTag(p.id, currentUser.id)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 border-crimson text-crimson hover:bg-crimson/10"
                          onClick={() => rejectTag(p.id, currentUser.id)}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={pendingRemoveAlumni !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveAlumni(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove alumni tag?</AlertDialogTitle>
            <AlertDialogDescription>
              {isExec
                ? "This removes verified alumni status for this member."
                : "Alumni status can only be removed with executive board confirmation. Contact an exec if this tag should change."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isExec ? undefined : "sm:justify-center"}>
            {isExec ? (
              <>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-crimson text-white hover:bg-crimson-dark"
                  onClick={() => {
                    if (pendingRemoveAlumni)
                      removeTagFromMember(memberId, pendingRemoveAlumni.id);
                    setPendingRemoveAlumni(null);
                  }}
                >
                  Remove
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogCancel className="sm:mx-0">Got it</AlertDialogCancel>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

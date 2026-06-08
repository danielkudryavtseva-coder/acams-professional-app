import { Link } from "react-router-dom";
import { Badge } from "./ui/badge";
import type { Tag } from "../data/tags";
import { TAG_CATEGORY_COLORS } from "../data/tags";
import type { Member } from "../data/mockData";

interface Props {
  taggedMemberIds: string[];
  membersById: Map<string, Member>;
  /** Historical tags frozen at decision time; shown as secondary chips. */
  tagSnapshot?: Tag[];
  linkBasePath?: string;
}

export function TaggedMembersRow({
  taggedMemberIds,
  membersById,
  tagSnapshot,
  linkBasePath = "/dashboard/members/",
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {taggedMemberIds.map((id) => {
          const m = membersById.get(id);
          const label = m ? `${m.firstName} ${m.lastName}` : id;
          return (
            <Link
              key={id}
              to={`${linkBasePath}${id}`}
              className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              {label}
            </Link>
          );
        })}
      </div>
      {tagSnapshot && tagSnapshot.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tagSnapshot.map((t) => (
            <Badge
              key={`${t.id}-snap`}
              variant="outline"
              className={`text-[10px] font-normal ${t.color ?? TAG_CATEGORY_COLORS[t.category]}`}
            >
              {t.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

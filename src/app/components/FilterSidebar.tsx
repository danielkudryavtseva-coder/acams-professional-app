import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { cn } from "./ui/utils";

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

interface FilterSidebarProps {
  groups: FilterGroup[];
  selected: Record<string, string[]>;
  onFilterChange: (groupId: string, value: string, checked: boolean) => void;
  onClearAll?: () => void;
  className?: string;
}

export function FilterSidebar({
  groups,
  selected,
  onFilterChange,
  onClearAll,
  className,
}: FilterSidebarProps) {
  const hasFilters = Object.values(selected).some((v) => v.length > 0);

  return (
    <div className={cn("w-56 flex-shrink-0 border-r bg-card h-full overflow-y-auto", className)}>
      <div className="p-4 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <Separator />

      <div className="p-4 space-y-6">
        {groups.map((group) => (
          <div key={group.id}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {group.label}
            </p>
            <div className="space-y-2">
              {group.options.map((option) => {
                const isChecked = selected[group.id]?.includes(option.id) || false;
                return (
                  <div key={option.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`${group.id}-${option.id}`}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        onFilterChange(group.id, option.id, checked as boolean)
                      }
                    />
                    <Label
                      htmlFor={`${group.id}-${option.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {option.label}
                    </Label>
                    {option.count !== undefined && (
                      <span className="text-xs text-muted-foreground">{option.count}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

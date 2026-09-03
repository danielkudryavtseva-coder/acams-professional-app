import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  /** Optional small icon shown inline before the title (matches ScoreboardPage's pattern). */
  icon?: ReactNode;
  /** Optional subtitle/description line under the title. */
  description?: ReactNode;
  /** Optional right-aligned slot for header-row buttons (Export, Add, etc.). */
  actions?: ReactNode;
}

/**
 * Standard dashboard page heading — font-display + text-crimson, matching the
 * pattern already used on Profile.tsx/ScoreboardPage.tsx (which in turn echoes the
 * public site's heading treatment). Use this instead of a one-off `<h1 className=
 * "text-2xl font-bold">` so every /dashboard/* page reads as the same brand.
 */
export function PageHeader({ title, icon, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="font-display text-2xl font-semibold text-crimson tracking-tight flex items-center gap-2">
          {icon}
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

"use client";

import type { Role, Status } from "@prisma/client";

import { cn } from "@/lib/utils";

const labelForStatus = (s: Status) => {
  if (s === "UNVERIFIED") return "Unverified";
  if (s === "VERIFIED") return "Verified";
  return "Rejected";
};

export function StatusPill(props: {
  variant: "status" | "role";
  value: Role | Status;
  className?: string;
}) {
  const title = props.variant === "role" ? `Role: ${props.value}` : `Verification: ${labelForStatus(props.value as Status)}`;
  const text = props.variant === "role" ? String(props.value) : labelForStatus(props.value as Status);

  const isUnverified = props.variant === "status" && props.value === "UNVERIFIED";

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
        props.variant === "role"
          ? "bg-paper text-ink ring-ink/20"
          : isUnverified
            ? "bg-paper text-ink ring-crimson/40"
            : "bg-paper text-ink ring-ink/20",
        props.className,
      )}
    >
      {text}
    </span>
  );
}

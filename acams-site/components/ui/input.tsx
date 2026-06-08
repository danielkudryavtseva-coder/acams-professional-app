"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-9 w-full rounded-md border border-ink/20 bg-paper px-3 py-1 text-base text-ink shadow-[0_1px_3px_rgb(26_26_26/0.08)] transition-colors outline-none md:text-sm",
      "placeholder:text-ink/40 focus-visible:border-crimson focus-visible:ring-2 focus-visible:ring-crimson/35",
      "disabled:cursor-not-allowed disabled:opacity-55",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };

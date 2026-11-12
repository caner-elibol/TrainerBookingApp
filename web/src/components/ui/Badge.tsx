import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "brand" | "accent" | "gray" | "success" | "warning" | "error";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  brand: "bg-subtle text-ink",
  accent: "bg-subtle text-ink",
  gray: "bg-surface-muted text-ink-secondary",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  error: "bg-error-50 text-error-700",
};

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export default function Badge({ variant = "gray", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

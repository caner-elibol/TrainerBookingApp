import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-default px-6 py-12 text-center", className)}>
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
          <Icon className="h-6 w-6 text-ink-muted" />
        </span>
      )}
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {description && <p className="mt-1 text-sm text-ink-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CARD_BASE_CLASSES } from "./Card";

export interface SectionCardProps {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function SectionCard({ title, action, children, className, bodyClassName }: SectionCardProps) {
  return (
    <div className={cn(CARD_BASE_CLASSES, "p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-foreground">{title}</h2>
            </div>
          )}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

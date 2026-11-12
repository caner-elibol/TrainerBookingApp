import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export type AlertVariant = "success" | "warning" | "error" | "info";

const VARIANT_CONFIG: Record<
  AlertVariant,
  { icon: typeof CheckCircle; container: string; icon_: string; title: string; role: "alert" | "status" }
> = {
  success: {
    icon: CheckCircle,
    container: "bg-success-50 border-success-100",
    icon_: "text-success-600",
    title: "text-success-700",
    role: "status",
  },
  warning: {
    icon: AlertTriangle,
    container: "bg-warning-50 border-warning-100",
    icon_: "text-warning-600",
    title: "text-warning-700",
    role: "alert",
  },
  error: {
    icon: XCircle,
    container: "bg-error-50 border-error-100",
    icon_: "text-error-600",
    title: "text-error-700",
    role: "alert",
  },
  info: {
    icon: Info,
    container: "bg-info-50 border-info-100",
    icon_: "text-info-600",
    title: "text-info-700",
    role: "status",
  },
};

export interface AlertProps {
  variant: AlertVariant;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function Alert({ variant, title, children, action, className }: AlertProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <div
      role={config.role}
      className={cn("flex gap-3 rounded-md border p-4", config.container, className)}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.icon_)} aria-hidden="true" />
      <div className="flex-1 text-sm">
        {title && <p className={cn("mb-1 font-medium", config.title)}>{title}</p>}
        <div className="text-foreground/80">{children}</div>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SettingsNavItem {
  id: string;
  title: string;
  icon: LucideIcon;
  href: string;
}

export default function SettingsItem({ title, icon: Icon, href }: SettingsNavItem) {
  return (
    <Link href={href} className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
      <span className="flex items-center gap-2.5 text-sm font-medium text-foreground">
        <Icon className="h-4 w-4 text-ink-secondary" />
        {title}
      </span>
      <ChevronRight className="h-4 w-4 text-ink-muted" />
    </Link>
  );
}

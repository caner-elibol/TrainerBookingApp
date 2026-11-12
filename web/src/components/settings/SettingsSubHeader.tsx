import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function SettingsSubHeader({ title, backHref = "/settings" }: { title: string; backHref?: string }) {
  return (
    <div className="relative flex items-center justify-center py-1">
      <Link
        href={backHref}
        aria-label="Geri dön"
        className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-foreground transition-colors hover:bg-border-default"
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <h1 className="text-base font-bold text-foreground">{title}</h1>
    </div>
  );
}

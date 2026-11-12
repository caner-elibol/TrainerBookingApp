"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Copy, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Logo from "@/components/Logo";
import { useSidebarState } from "@/components/shell/SidebarState";
import { cn } from "@/lib/cn";
import { TRAINER_NAV_ITEMS, isNavItemActive } from "./trainerNav";

export default function TrainerSidebar({ bookingLink }: { bookingLink: string | null }) {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarState();
  const expandedAtXl = !collapsed;

  return (
    <aside
      aria-label="Ana menü"
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col border-r border-border-default bg-surface md:flex",
        expandedAtXl && "xl:w-[248px]",
      )}
    >
      <div className={cn("flex h-16 shrink-0 items-center justify-center px-4", expandedAtXl && "xl:justify-start xl:px-6")}>
        <span className={cn(expandedAtXl && "xl:hidden")}>
          <Logo markSize={28} showWordmark={false} />
        </span>
        {expandedAtXl && (
          <span className="hidden xl:block">
            <Logo markSize={28} />
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {TRAINER_NAV_ITEMS.map((item) => {
            const active = isNavItemActive(item, pathname);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center justify-center gap-3 rounded-xl text-sm font-medium transition-colors",
                    expandedAtXl && "xl:justify-start xl:px-3",
                    active ? "bg-subtle font-semibold text-ink" : "text-ink-secondary hover:bg-subtle hover:text-ink",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={cn("sr-only", expandedAtXl && "xl:not-sr-only xl:truncate")}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex shrink-0 flex-col gap-3 p-3">
        {bookingLink && expandedAtXl && <BookingLinkCard link={bookingLink} />}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          title={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          className={cn(
            "hidden h-10 items-center justify-center gap-3 rounded-xl text-sm text-ink-secondary transition-colors hover:bg-subtle hover:text-ink xl:flex",
            expandedAtXl && "xl:justify-start xl:px-3",
          )}
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          {expandedAtXl && <span>Menüyü daralt</span>}
        </button>
      </div>
    </aside>
  );
}

function BookingLinkCard({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="hidden rounded-2xl border border-border-default bg-subtle p-4 xl:block">
      <p className="text-sm font-semibold text-ink">Rezervasyon linkin</p>
      <p className="mt-1 text-xs text-ink-secondary">Danışanların bu linkten doğrudan randevu alabilir.</p>
      <p className="mt-3 truncate rounded-lg bg-surface px-2.5 py-1.5 font-mono text-[11px] text-ink-secondary">
        {link.replace(/^https?:\/\//, "")}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Kopyalandı" : "Linki kopyala"}
      </button>
    </div>
  );
}

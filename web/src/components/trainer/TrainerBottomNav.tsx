"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarPlus, ChevronRight, PackagePlus, Plus, UserPlus } from "lucide-react";
import { BottomSheet, BottomSheetContent, BottomSheetTrigger } from "@/components/ui/BottomSheet";
import { cn } from "@/lib/cn";
import { TRAINER_BOTTOM_NAV_ITEMS, isNavItemActive, type TrainerNavItem } from "./trainerNav";

const QUICK_ACTIONS = [
  { href: "/calendar?new=1", label: "Randevu Ekle", caption: "Bir danışan için seans planla", icon: CalendarPlus },
  { href: "/clients?new=1", label: "Danışan Ekle", caption: "Yeni danışan ve davet linki oluştur", icon: UserPlus },
  { href: "/clients", label: "Paket Ata", caption: "Danışan seç, paket tanımla", icon: PackagePlus },
];

export default function TrainerBottomNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [left, right] = [TRAINER_BOTTOM_NAV_ITEMS.slice(0, 2), TRAINER_BOTTOM_NAV_ITEMS.slice(2)];

  return (
    <nav aria-label="Alt menü" className="fixed inset-x-0 bottom-0 z-30 md:hidden">
      <ul className="relative flex w-full items-stretch justify-around border-t border-border-default bg-surface pb-[env(safe-area-inset-bottom)]">
        {left.map((item) => (
          <NavItem key={item.href} item={item} active={isNavItemActive(item, pathname)} />
        ))}

        <li className="flex flex-1 items-center justify-center">
          <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <BottomSheetTrigger asChild>
              <button
                type="button"
                aria-label="Hızlı işlemler"
                className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card-hover transition-colors hover:bg-primary-hover"
              >
                <Plus className="h-6 w-6" />
              </button>
            </BottomSheetTrigger>
            <BottomSheetContent title="Hızlı işlemler">
              <ul className="flex flex-col gap-2">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <li key={action.label}>
                      <Link
                        href={action.href}
                        onClick={() => setSheetOpen(false)}
                        className="flex items-center gap-3 rounded-2xl border border-border-default p-3 transition-colors hover:bg-subtle"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-subtle text-ink">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-ink">{action.label}</span>
                          <span className="block truncate text-xs text-ink-secondary">{action.caption}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </BottomSheetContent>
          </BottomSheet>
        </li>

        {right.map((item) => (
          <NavItem key={item.href} item={item} active={isNavItemActive(item, pathname)} />
        ))}
      </ul>
    </nav>
  );
}

function NavItem({ item, active }: { item: TrainerNavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <li className="flex-1">
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-col items-center gap-1 px-2 py-2.5 text-xs font-medium transition-colors",
          active ? "text-ink" : "text-ink-muted hover:text-ink",
        )}
      >
        <Icon className="h-5 w-5" />
        <span className="whitespace-nowrap">{item.label}</span>
      </Link>
    </li>
  );
}

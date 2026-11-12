"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { CLIENT_BOTTOM_NAV_ITEMS } from "./clientNav";

export default function ClientBottomNav() {
  const pathname = usePathname();
  const [left, right] = [CLIENT_BOTTOM_NAV_ITEMS.slice(0, 2), CLIENT_BOTTOM_NAV_ITEMS.slice(2)];

  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 flex justify-center">
      <ul className="relative flex w-full max-w-[430px] items-stretch justify-around border-t border-border-default bg-surface pb-[env(safe-area-inset-bottom)]">
        {left.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} />
        ))}

        <li className="flex flex-1 items-center justify-center">
          <Link
            href="/my-packages"
            aria-label="Antrenör Bul"
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-card-hover transition-colors hover:bg-primary-hover"
          >
            <Plus className="h-6 w-6" />
          </Link>
        </li>

        {right.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} />
        ))}
      </ul>
    </nav>
  );
}

function NavItem({
  item,
  pathname,
}: {
  item: { href: string; label: string; icon: (typeof CLIENT_BOTTOM_NAV_ITEMS)[number]["icon"] };
  pathname: string;
}) {
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;
  return (
    <li className="flex-1">
      <Link
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex flex-col items-center gap-1 px-2 py-2.5 text-xs font-medium transition-colors",
          isActive ? "text-ink" : "text-ink-muted hover:text-ink",
        )}
      >
        <Icon className="h-5 w-5" />
        <span className="whitespace-nowrap">{item.label}</span>
      </Link>
    </li>
  );
}

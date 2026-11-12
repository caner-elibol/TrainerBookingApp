"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";
import type { NotificationItem, NotificationsResponse } from "@/app/api/notifications/route";

function relativeLabel(timestampUtc: string): string {
  const diffMs = new Date(timestampUtc).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (Math.abs(diffMinutes) < 60) {
    if (diffMinutes === 0) return "Şimdi";
    return diffMinutes > 0 ? `${diffMinutes} dk sonra` : `${Math.abs(diffMinutes)} dk önce`;
  }
  if (Math.abs(diffHours) < 24) {
    return diffHours > 0 ? `${diffHours} sa sonra` : `${Math.abs(diffHours)} sa önce`;
  }
  return diffDays > 0 ? `${diffDays} gün sonra` : `${Math.abs(diffDays)} gün önce`;
}

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? (res.json() as Promise<NotificationsResponse>) : null))
      .then((data) => setItems(data?.items ?? []))
      .finally(() => setHasFetched(true));
  }, []);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Bildirimler"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-muted"
        >
          <Bell className="h-5 w-5" />
          {hasFetched && items.length > 0 && (
            <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-error-600" />
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            "z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border-default bg-surface shadow-card-hover",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        >
          <div className="border-b border-border-default px-4 py-3">
            <p className="text-sm font-semibold text-foreground">Bildirimler</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {hasFetched && items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-ink-secondary">Henüz bildirim yok.</p>
            )}

            {items.map((item) => (
              <DropdownMenu.Item key={item.id} asChild>
                <Link
                  href={item.href}
                  className="flex flex-col gap-0.5 border-b border-border-default px-4 py-3 outline-none last:border-0 hover:bg-surface-muted focus:bg-surface-muted"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{item.title}</span>
                    <span className="shrink-0 text-xs whitespace-nowrap text-ink-muted">
                      {relativeLabel(item.timestampUtc)}
                    </span>
                  </span>
                  {item.subtitle && <span className="truncate text-xs text-ink-secondary">{item.subtitle}</span>}
                </Link>
              </DropdownMenu.Item>
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

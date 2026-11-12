"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import AvatarCircle from "@/components/ui/AvatarCircle";
import { cn } from "@/lib/cn";

export interface UserMenuProps {
  name: string;
  roleLabel: string;
  settingsHref: string;
  showDetails?: boolean;
}

export default function UserMenu({ name, roleLabel, settingsHref, showDetails = false }: UserMenuProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Hesap menüsü"
          className={cn(
            "flex items-center gap-3 rounded-full transition-colors hover:opacity-90",
            showDetails && "xl:rounded-xl xl:py-1 xl:pr-2 xl:pl-1 xl:hover:bg-subtle xl:hover:opacity-100",
          )}
        >
          <AvatarCircle name={name} size={40} />
          {showDetails && (
            <>
              <span className="hidden min-w-0 text-left leading-tight xl:block">
                <span className="block max-w-40 truncate text-sm font-semibold text-ink">{name}</span>
                <span className="block text-xs text-ink-secondary">{roleLabel}</span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-ink-muted xl:block" />
            </>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            "z-50 w-56 overflow-hidden rounded-xl border border-border-default bg-surface p-1.5 shadow-card-hover",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        >
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            <p className="text-xs text-ink-secondary">{roleLabel}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border-default" />
          <DropdownMenu.Item asChild>
            <Link
              href={settingsHref}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground outline-none hover:bg-surface-muted focus:bg-surface-muted"
            >
              <Settings className="h-4 w-4 text-ink-muted" />
              Ayarlar
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border-default" />
          <DropdownMenu.Item
            onSelect={handleLogout}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-error-600 outline-none hover:bg-error-50 focus:bg-error-50"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

import { Search } from "lucide-react";
import type { SessionUser } from "@/lib/session";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";
import Logo from "@/components/Logo";

export interface ClientHeaderProps {
  user: SessionUser;
}

export default function ClientHeader({ user }: ClientHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border-default bg-surface/95 px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-sm">
      <Logo markSize={28} showWordmark={false} />

      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Ara"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-muted"
        >
          <Search className="h-5 w-5" />
        </button>

        <NotificationBell />

        <UserMenu name={user.fullName} roleLabel="Üye Hesabı" settingsHref="/account" />
      </div>
    </header>
  );
}

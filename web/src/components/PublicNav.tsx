import Link from "next/link";
import { Search } from "lucide-react";
import type { SessionUser } from "@/lib/session";
import Logo from "@/components/Logo";
import AvatarCircle from "@/components/ui/AvatarCircle";
import ButtonLink from "@/components/ui/ButtonLink";

const NAV_LINKS = [
  { href: "/", label: "Anasayfa" },
  { href: "/", label: "Eğitmenler" },
  { href: "/", label: "Paketler" },
  { href: "/", label: "Nasıl Çalışır?" },
  { href: "/", label: "Blog" },
];

export default function PublicNav({ user }: { user: SessionUser | null }) {
  return (
    <header className="border-b border-border-default bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4 sm:px-6">
        <Link href="/">
          <Logo markSize={30} />
        </Link>

        <nav aria-label="Primary" className="ml-4 hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="text-sm font-medium text-ink-secondary hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            aria-label="Ara"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-ink-secondary hover:bg-surface-muted sm:flex"
          >
            <Search className="h-5 w-5" />
          </button>

          {user ? (
            <Link
              href={user.role === "Trainer" ? "/dashboard" : "/home"}
              className="flex items-center gap-2.5 rounded-xl py-1 pl-1 hover:bg-surface-muted"
            >
              <AvatarCircle name={user.fullName} size={36} />
              <span className="hidden text-sm font-semibold text-foreground sm:inline">{user.fullName}</span>
            </Link>
          ) : (
            <>
              <ButtonLink href="/login" variant="outline" size="sm">
                Giriş Yap
              </ButtonLink>
              <ButtonLink href="/register" variant="secondary" size="sm">
                Hemen Başla
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

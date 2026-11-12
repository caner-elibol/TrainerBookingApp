"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Package, X } from "lucide-react";
import type { SessionUser } from "@/lib/session";
import type { SearchResponse } from "@/app/api/search/route";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";
import Logo from "@/components/Logo";
import { cn } from "@/lib/cn";

export interface AppHeaderProps {
  user: SessionUser;
}

const SEARCH_PLACEHOLDER = "Danışan ara, randevu veya paket bul...";

export default function AppHeader({ user }: AppHeaderProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isDesktopSearchFocused, setIsDesktopSearchFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
        .then((res) => (res.ok ? (res.json() as Promise<SearchResponse>) : null))
        .then((data) => setResults(data))
        .finally(() => setIsLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (isMobileSearchOpen) mobileInputRef.current?.focus();
  }, [isMobileSearchOpen]);

  const hasQuery = query.trim().length >= 2;

  function goTo(href: string) {
    closeSearch();
    router.push(href);
  }

  function closeSearch() {
    setIsMobileSearchOpen(false);
    setIsDesktopSearchFocused(false);
    setQuery("");
    setResults(null);
  }

  const dropdown = (
    <SearchDropdown isLoading={isLoading} results={results} onSelect={goTo} className="absolute inset-x-0 top-full mt-1" />
  );

  return (
    <header className="sticky top-0 z-30 border-b border-border-default bg-surface/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-sm md:px-6 xl:px-8">
      {isMobileSearchOpen && (
        <div className="relative flex h-16 items-center gap-2 md:hidden">
          <div className="relative flex-1">
            <SearchInput ref={mobileInputRef} value={query} onChange={setQuery} onEscape={closeSearch} />
            {hasQuery && dropdown}
          </div>
          <button
            type="button"
            aria-label="Aramayı kapat"
            onClick={closeSearch}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-secondary hover:bg-subtle"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className={cn("flex h-16 items-center gap-3", isMobileSearchOpen && "hidden md:flex")}>
        <div className="flex min-w-0 flex-1 items-center gap-3 md:hidden">
          <Logo markSize={28} />
          <TodayLabel className="ml-auto text-right" />
        </div>

        <div className="relative hidden max-w-xl flex-1 md:block">
          <SearchInput
            value={query}
            onChange={setQuery}
            onEscape={closeSearch}
            onFocus={() => setIsDesktopSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsDesktopSearchFocused(false), 150)}
          />
          {isDesktopSearchFocused && hasQuery && dropdown}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 md:ml-auto">
          <button
            type="button"
            aria-label="Ara"
            onClick={() => setIsMobileSearchOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-secondary hover:bg-subtle md:hidden"
          >
            <Search className="h-5 w-5" />
          </button>
          <NotificationBell />
          <div className="hidden md:block">
            <UserMenu name={user.fullName} roleLabel="Personal Trainer" settingsHref="/settings" showDetails />
          </div>
        </div>
      </div>
    </header>
  );
}

function TodayLabel({ className }: { className?: string }) {
  const now = new Date();
  return (
    <span className={cn("flex flex-col leading-tight", className)} suppressHydrationWarning>
      <span className="text-sm font-medium text-ink" suppressHydrationWarning>
        {now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
      </span>
      <span className="text-xs text-ink-secondary" suppressHydrationWarning>
        {now.toLocaleDateString("tr-TR", { weekday: "long" })}
      </span>
    </span>
  );
}

function SearchInput({
  ref,
  value,
  onChange,
  onEscape,
  onFocus,
  onBlur,
}: {
  ref?: Ref<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
  onEscape: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      <input
        ref={ref}
        type="search"
        placeholder={SEARCH_PLACEHOLDER}
        aria-label="Ara"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onEscape();
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        className="h-10 w-full rounded-xl border border-border-default bg-subtle pr-4 pl-9 text-sm text-ink placeholder:text-ink-muted focus:border-ink/40 focus:bg-surface focus:outline-none"
      />
    </div>
  );
}

function SearchDropdown({
  isLoading,
  results,
  onSelect,
  className,
}: {
  isLoading: boolean;
  results: SearchResponse | null;
  onSelect: (href: string) => void;
  className?: string;
}) {
  const hasResults = results && (results.clients.length > 0 || results.packages.length > 0);

  return (
    <div className={cn("z-20 overflow-hidden rounded-xl border border-border-default bg-surface shadow-card-hover", className)}>
      {isLoading && <p className="px-4 py-3 text-sm text-ink-secondary">Aranıyor...</p>}

      {!isLoading && !hasResults && <p className="px-4 py-3 text-sm text-ink-secondary">Sonuç bulunamadı.</p>}

      {!isLoading && results && results.clients.length > 0 && (
        <ResultGroup title="Danışanlar" icon={Users} items={results.clients} onSelect={onSelect} />
      )}

      {!isLoading && results && results.packages.length > 0 && (
        <ResultGroup title="Paketler" icon={Package} items={results.packages} onSelect={onSelect} />
      )}
    </div>
  );
}

function ResultGroup({
  title,
  icon: Icon,
  items,
  onSelect,
}: {
  title: string;
  icon: typeof Users;
  items: SearchResponse["clients"];
  onSelect: (href: string) => void;
}) {
  return (
    <div className="border-b border-border-default py-1.5 last:border-b-0">
      <p className="px-4 py-1 text-xs font-medium text-ink-muted">{title}</p>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(item.href)}
          className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-subtle"
        >
          <Icon className="h-4 w-4 shrink-0 text-ink-muted" />
          <span className="flex-1 truncate font-medium text-ink">{item.label}</span>
          {item.caption && <span className="shrink-0 text-xs text-ink-secondary">{item.caption}</span>}
        </button>
      ))}
    </div>
  );
}

import { cn } from "@/lib/cn";

export interface LogoProps {
  className?: string;
  markSize?: number;
  showWordmark?: boolean;
}

export default function Logo({ className, markSize = 32, showWordmark = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="shrink-0 text-ink"
      >
        <path d="M16 4C11 4 7 8 7 13c0 7 9 14 9 14s9-7 9-14c0-5-4-9-9-9Z" fill="currentColor" />
        <path
          d="M16 9c-2.8 0-5 2.2-5 5 0 3.6 5 8 5 8s5-4.4 5-8c0-2.8-2.2-5-5-5Z"
          fill="var(--color-surface)"
          fillOpacity="0.35"
        />
      </svg>
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-lg font-extrabold tracking-tight text-foreground">CoreFit</span>
          <span className="text-[11px] font-medium text-ink-muted">Daha güçlü yarınlar</span>
        </span>
      )}
    </div>
  );
}

"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SIDEBAR_COOKIE } from "./sidebarCookie";

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarState | null>(null);

export function SidebarStateProvider({ initialCollapsed, children }: { initialCollapsed: boolean; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }, []);

  return <SidebarContext.Provider value={{ collapsed, toggle }}>{children}</SidebarContext.Provider>;
}

export function useSidebarState(): SidebarState {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebarState must be used inside SidebarStateProvider");
  return ctx;
}

export function ShellContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebarState();
  return (
    <div className={cn("flex min-h-dvh min-w-0 flex-col md:pl-[72px]", collapsed ? "xl:pl-[72px]" : "xl:pl-[248px]")}>
      {children}
    </div>
  );
}

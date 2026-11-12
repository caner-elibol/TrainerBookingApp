import type { ReactNode } from "react";
import { cookies } from "next/headers";
import SessionRefresher from "./SessionRefresher";
import { ShellContent, SidebarStateProvider } from "./SidebarState";
import { SIDEBAR_COOKIE } from "./sidebarCookie";

export default async function AppShell({
  sidebar,
  header,
  bottomNav,
  children,
}: {
  sidebar: ReactNode;
  header: ReactNode;
  bottomNav: ReactNode;
  children: ReactNode;
}) {
  const initialCollapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "collapsed";

  return (
    <SidebarStateProvider initialCollapsed={initialCollapsed}>
      <div className="min-h-dvh bg-background">
        <SessionRefresher />
        {sidebar}
        <ShellContent>
          {header}
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pt-4 pb-28 md:px-6 md:pt-6 md:pb-10 xl:px-8">
            {children}
          </main>
        </ShellContent>
        {bottomNav}
      </div>
    </SidebarStateProvider>
  );
}

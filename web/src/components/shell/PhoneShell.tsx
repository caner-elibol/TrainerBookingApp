import type { ReactNode } from "react";
import SessionRefresher from "./SessionRefresher";

export const APP_SHELL_MAX_WIDTH = "max-w-[430px]";

export default function PhoneShell({
  header,
  bottomNav,
  children,
}: {
  header: ReactNode;
  bottomNav: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background md:bg-surface-muted">
      <SessionRefresher />
      <div
        className={`relative mx-auto flex min-h-dvh w-full ${APP_SHELL_MAX_WIDTH} flex-col bg-surface md:shadow-[0_0_40px_rgba(16,24,40,0.08)]`}
      >
        {header}
        <main className="flex-1 px-4 pt-4 pb-28">{children}</main>
      </div>
      {bottomNav}
    </div>
  );
}

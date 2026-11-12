import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import { getRequestOrigin } from "@/lib/request-origin";
import type { TrainerSettingsResponse } from "@/lib/types";
import AppShell from "@/components/shell/AppShell";
import AppHeader from "@/components/trainer/AppHeader";
import TrainerBottomNav from "@/components/trainer/TrainerBottomNav";
import TrainerSidebar from "@/components/trainer/TrainerSidebar";

export default async function TrainerLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Trainer") redirect("/");

  const [settingsResult, origin] = await Promise.all([
    authedFetch<TrainerSettingsResponse>("/api/trainers/me/settings"),
    getRequestOrigin(),
  ]);
  const slug = settingsResult.ok ? settingsResult.data?.calendarSlug : null;
  const bookingLink = slug ? `${origin}/pt/${slug}` : null;

  return (
    <AppShell
      sidebar={<TrainerSidebar bookingLink={bookingLink} />}
      header={<AppHeader user={user} />}
      bottomNav={<TrainerBottomNav />}
    >
      {children}
    </AppShell>
  );
}

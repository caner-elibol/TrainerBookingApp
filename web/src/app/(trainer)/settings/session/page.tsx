import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { TrainerSettingsResponse } from "@/lib/types";
import SectionCard from "@/components/ui/SectionCard";
import SettingsSubHeader from "@/components/settings/SettingsSubHeader";
import SessionPanel from "./SessionPanel";

export default async function SessionSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Trainer") redirect("/");

  const settingsResult = await authedFetch<TrainerSettingsResponse>("/api/trainers/me/settings");
  const settings = settingsResult.ok ? settingsResult.data : null;

  return (
    <div className="flex flex-col gap-6">
      <SettingsSubHeader title="Seans Ayarları" />
      <SectionCard>
        <SessionPanel initialSettings={settings} />
      </SectionCard>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { TrainerSettingsResponse } from "@/lib/types";
import SectionCard from "@/components/ui/SectionCard";
import SettingsSubHeader from "@/components/settings/SettingsSubHeader";
import WorkingHoursPanel from "./WorkingHoursPanel";

export default async function WorkingHoursSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Trainer") redirect("/");

  const settingsResult = await authedFetch<TrainerSettingsResponse>("/api/trainers/me/settings");
  const settings = settingsResult.ok ? settingsResult.data : null;

  return (
    <div className="flex flex-col gap-6">
      <SettingsSubHeader title="Çalışma Saatleri" />
      <SectionCard>
        <WorkingHoursPanel initialSettings={settings} />
      </SectionCard>
    </div>
  );
}

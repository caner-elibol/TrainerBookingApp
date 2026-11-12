import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { AccountProfile, TrainerSettingsResponse } from "@/lib/types";
import SectionCard from "@/components/ui/SectionCard";
import SettingsSubHeader from "@/components/settings/SettingsSubHeader";
import PaymentPanel from "./PaymentPanel";

export default async function PaymentSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Trainer") redirect("/");

  const [settingsResult, profileResult] = await Promise.all([
    authedFetch<TrainerSettingsResponse>("/api/trainers/me/settings"),
    authedFetch<AccountProfile>("/api/account/me"),
  ]);
  const settings = settingsResult.ok ? settingsResult.data : null;
  const profile = profileResult.ok ? profileResult.data : null;

  return (
    <div className="flex flex-col gap-6">
      <SettingsSubHeader title="Ödeme Yöntemleri" />
      <SectionCard>
        <PaymentPanel initialSettings={settings} initialProfile={profile} />
      </SectionCard>
    </div>
  );
}

import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { TrainerSettingsResponse } from "@/lib/types";
import ButtonLink from "@/components/ui/ButtonLink";
import PageHeader from "@/components/trainer/PageHeader";
import OnboardingWizard from "./OnboardingWizard";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Trainer") redirect("/");

  const result = await authedFetch<TrainerSettingsResponse>("/api/trainers/me/settings");
  const initialSettings = result.ok ? result.data : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <ButtonLink href="/dashboard" variant="ghost" size="sm" className="-ml-2 mb-2">
          <ChevronLeft className="h-4 w-4" />
          Geri
        </ButtonLink>
        <PageHeader
          title="Takvimini 3 adımda oluştur"
          subtitle="Hizmetlerini, uygun saatlerini ve seans ayarlarını belirle. Biz senin için otomatik olarak takvimini oluşturalım."
        />
      </div>
      <OnboardingWizard initialSettings={initialSettings} />
    </div>
  );
}

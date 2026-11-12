import { getRequestOrigin } from "@/lib/request-origin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { AccountProfile, TrainerSettingsResponse } from "@/lib/types";
import PageHeader from "@/components/trainer/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import AvatarCircle from "@/components/ui/AvatarCircle";
import LogoutButton from "@/components/LogoutButton";
import SettingsItem from "@/components/settings/SettingsItem";
import ShareableLink from "../dashboard/ShareableLink";
import { SETTINGS_GENERAL_ITEMS, SETTINGS_OTHER_ITEMS, SETTINGS_TAB_REDIRECTS } from "./settingsNav";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Trainer") redirect("/");

  const { tab } = await searchParams;
  if (tab && SETTINGS_TAB_REDIRECTS[tab]) {
    redirect(SETTINGS_TAB_REDIRECTS[tab]);
  }

  const [settingsResult, profileResult] = await Promise.all([
    authedFetch<TrainerSettingsResponse>("/api/trainers/me/settings"),
    authedFetch<AccountProfile>("/api/account/me"),
  ]);
  const settings = settingsResult.ok ? settingsResult.data : null;
  const profile = profileResult.ok ? profileResult.data : null;

  const origin = await getRequestOrigin();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ayarlar"
        subtitle="Profilini yönet, müsaitlik saatlerini düzenle ve seans ayarlarını yapılandır."
      />

      <SectionCard>
        <div className="flex items-center gap-3">
          <AvatarCircle name={user.fullName} size={56} className="text-base" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              {user.fullName}
              <BadgeCheck className="h-4 w-4 text-ink" />
            </p>
            <p className="text-xs text-ink-secondary">Provider</p>
            {profile?.city && (
              <p className="flex items-center gap-1 text-xs text-ink-muted">
                <MapPin className="h-3 w-3" /> {profile.city}
              </p>
            )}
          </div>
          <Link href="/settings/profile" className="shrink-0 text-sm font-medium text-ink">
            Profili Düzenle
          </Link>
        </div>
      </SectionCard>

      <SectionCard title="Genel">
        <div className="flex flex-col divide-y divide-border-default">
          {SETTINGS_GENERAL_ITEMS.map((item) => (
            <SettingsItem key={item.id} {...item} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Diğer">
        <div className="flex flex-col divide-y divide-border-default">
          {SETTINGS_OTHER_ITEMS.map((item) => (
            <SettingsItem key={item.id} {...item} />
          ))}
        </div>
      </SectionCard>

      {settings?.calendarSlug && (
        <SectionCard>
          <ShareableLink origin={origin} slug={settings.calendarSlug} />
        </SectionCard>
      )}

      <SectionCard>
        <LogoutButton variant="row" />
      </SectionCard>
    </div>
  );
}

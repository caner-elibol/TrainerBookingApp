import { formatPhone } from "@/lib/phone";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Phone, User } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { AccountProfile } from "@/lib/types";
import PageHeader from "@/components/trainer/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import AvatarCircle from "@/components/ui/AvatarCircle";
import LogoutButton from "@/components/LogoutButton";
import SettingsItem from "@/components/settings/SettingsItem";
import { ACCOUNT_GENERAL_ITEMS } from "./accountNav";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Client") redirect("/");

  const profileResult = await authedFetch<AccountProfile>("/api/account/me");
  const profile = profileResult.ok ? profileResult.data : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Ayarlar" subtitle="Hesap bilgilerini görüntüle ve yönet." />

      <SectionCard>
        <div className="flex items-center gap-3">
          <AvatarCircle name={user.fullName} size={56} className="text-base" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">{user.fullName}</p>
            <p className="flex items-center gap-1.5 text-xs text-ink-secondary">
              <User className="h-3 w-3" /> Üye Hesabı
            </p>
            {profile?.phone && (
              <p className="flex items-center gap-1 text-xs text-ink-muted">
                <Phone className="h-3 w-3" /> {formatPhone(profile.phone)}
              </p>
            )}
          </div>
          <Link href="/account/profile" className="shrink-0 text-sm font-medium text-ink">
            Profili Düzenle
          </Link>
        </div>
      </SectionCard>

      <SectionCard title="Genel">
        <div className="flex flex-col divide-y divide-border-default">
          {ACCOUNT_GENERAL_ITEMS.map((item) => (
            <SettingsItem key={item.id} {...item} />
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <LogoutButton variant="row" />
      </SectionCard>
    </div>
  );
}

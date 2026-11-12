import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { AccountProfile } from "@/lib/types";
import SectionCard from "@/components/ui/SectionCard";
import SettingsSubHeader from "@/components/settings/SettingsSubHeader";
import AccountProfileForm from "../AccountProfileForm";

export default async function AccountProfileSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Client") redirect("/");

  const profileResult = await authedFetch<AccountProfile>("/api/account/me");
  const profile = profileResult.ok ? profileResult.data : null;

  return (
    <div className="flex flex-col gap-6">
      <SettingsSubHeader title="Profil Bilgilerim" backHref="/account" />
      <SectionCard>
        <AccountProfileForm profile={profile} />
      </SectionCard>
    </div>
  );
}

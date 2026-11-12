import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { AccountProfile } from "@/lib/types";
import ProfileDetailsForm from "./ProfileDetailsForm";

export default async function CompleteProfileDetailsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Client") redirect("/dashboard");

  const profileResult = await authedFetch<AccountProfile>("/api/account/me");
  const profile = profileResult.ok ? profileResult.data : null;

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <ProfileDetailsForm initialHeightCm={profile?.heightCm ?? null} initialDateOfBirth={profile?.dateOfBirth ?? null} />
    </div>
  );
}

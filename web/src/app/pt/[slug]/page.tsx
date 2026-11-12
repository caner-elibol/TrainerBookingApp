import { notFound } from "next/navigation";
import { backendFetch } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import type { PackageDto, Review, TrainerProfile } from "@/lib/types";
import PublicNav from "@/components/PublicNav";
import PhoneShell from "@/components/shell/PhoneShell";
import ClientHeader from "@/components/client/ClientHeader";
import ClientBottomNav from "@/components/client/ClientBottomNav";
import TrainerProfileClient from "./TrainerProfileClient";

export default async function TrainerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSessionUser();
  const canPurchase = user?.role === "Client";

  const profileResponse = await backendFetch(`/api/trainers/by-slug/${encodeURIComponent(slug)}`);
  if (!profileResponse.ok) {
    notFound();
  }
  const profile = (await profileResponse.json()) as TrainerProfile;

  const [packagesResponse, reviewsResponse] = await Promise.all([
    backendFetch(`/api/trainers/${profile.trainerId}/packages`),
    backendFetch(`/api/trainers/by-slug/${encodeURIComponent(slug)}/reviews`),
  ]);
  const packages: PackageDto[] = packagesResponse.ok ? await packagesResponse.json() : [];
  const reviews: Review[] = reviewsResponse.ok ? await reviewsResponse.json() : [];

  if (user?.role === "Client") {
    return (
      <PhoneShell header={<ClientHeader user={user} />} bottomNav={<ClientBottomNav />}>
        <TrainerProfileClient profile={profile} packages={packages} reviews={reviews} slug={slug} canPurchase={canPurchase} />
      </PhoneShell>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNav user={user} />
      <main className="mx-auto w-full max-w-[430px] flex-1 px-4 py-4">
        <TrainerProfileClient profile={profile} packages={packages} reviews={reviews} slug={slug} canPurchase={canPurchase} />
      </main>
    </div>
  );
}

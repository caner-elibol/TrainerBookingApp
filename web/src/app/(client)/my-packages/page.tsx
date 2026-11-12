import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import { backendFetch } from "@/lib/api";
import type { MyPackageDetail, MyTrainerSummary, PackageDto, Review, TrainerProfile } from "@/lib/types";
import PageHeader from "@/components/trainer/PageHeader";
import SectionCard from "@/components/ui/SectionCard";
import EmptyState from "@/components/ui/EmptyState";
import MyPackagesExplorer from "./MyPackagesExplorer";

export default async function MyPackagesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Client") redirect("/");

  const trainersResult = await authedFetch<MyTrainerSummary[]>("/api/appointments/my-trainers");
  const trainers = (trainersResult.ok ? trainersResult.data : null) ?? [];

  const entries = await Promise.all(
    trainers.map(async (trainer) => {
      const [fullResult, catalogResult, reviewResult, profileResponse] = await Promise.all([
        authedFetch<MyPackageDetail[]>(`/api/trainers/${trainer.trainerId}/my-packages/full`),
        authedFetch<PackageDto[]>(`/api/trainers/${trainer.trainerId}/packages`),
        authedFetch<Review>(`/api/trainers/${trainer.trainerId}/my-review`),
        backendFetch(`/api/trainers/by-slug/${encodeURIComponent(trainer.calendarSlug)}`),
      ]);
      const profile = profileResponse.ok ? ((await profileResponse.json()) as TrainerProfile) : null;
      return {
        trainer,
        packages: (fullResult.ok ? fullResult.data : null) ?? [],
        catalog: (catalogResult.ok ? catalogResult.data : null) ?? [],
        review: reviewResult.ok ? reviewResult.data : null,
        bio: profile?.bio ?? null,
      };
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Paketlerim" subtitle="Eğitmenlerini, paketlerini ve kullanımını buradan yönet." />

      {entries.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={Users}
            title="Henüz bir eğitmenin yok"
            description="Bir eğitmenden paket satın aldığında burada görünecek."
          />
        </SectionCard>
      ) : (
        <MyPackagesExplorer entries={entries} />
      )}
    </div>
  );
}

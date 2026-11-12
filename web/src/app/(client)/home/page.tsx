import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, Layers, CalendarClock } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { AccountProfile, BodyMetric, ClientAppointment, MyPackage, MyTrainerSummary } from "@/lib/types";
import PageHeader from "@/components/trainer/PageHeader";
import StatCard from "@/components/ui/StatCard";
import SectionCard from "@/components/ui/SectionCard";
import AvatarCircle from "@/components/ui/AvatarCircle";
import Button from "@/components/ui/Button";
import ButtonLink from "@/components/ui/ButtonLink";
import Alert from "@/components/ui/Alert";
import AddEmailBanner from "@/components/account/AddEmailBanner";
import BookingSuccessBanner from "./BookingSuccessBanner";

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export default async function ClientHomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Client") redirect("/dashboard");

  const [appointmentsResult, trainersResult] = await Promise.all([
    authedFetch<ClientAppointment[]>("/api/appointments/me"),
    authedFetch<MyTrainerSummary[]>("/api/appointments/my-trainers"),
  ]);

  const appointments = appointmentsResult.data ?? [];
  const trainers = trainersResult.data ?? [];
  const primaryTrainer = trainers[0];

  const now = new Date();
  const nextAppointment = appointments
    .filter((a) => a.status !== "Cancelled" && new Date(a.startTimeUtc).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime())[0];

  const [packagesResult, profileResult, bodyMetricsResult] = await Promise.all([
    primaryTrainer ? authedFetch<MyPackage[]>(`/api/trainers/${primaryTrainer.trainerId}/my-packages`) : null,
    authedFetch<AccountProfile>("/api/account/me"),
    primaryTrainer ? authedFetch<BodyMetric[]>(`/api/trainers/${primaryTrainer.trainerId}/my-body-metrics`) : null,
  ]);
  const packages = (packagesResult?.ok ? packagesResult.data : null) ?? [];
  const totalRemaining = packages.reduce((sum, p) => sum + p.remainingSessions, 0);

  const profile = profileResult.ok ? profileResult.data : null;
  const bodyMetrics = (bodyMetricsResult?.ok ? bodyMetricsResult.data : null) ?? [];
  const isProfileIncomplete = !profile?.dateOfBirth || !profile?.heightCm || bodyMetrics.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={null}>
        <BookingSuccessBanner />
      </Suspense>

      <PageHeader
        title={
          <>
            Merhaba {firstName(user.fullName)} <span aria-hidden="true">👋</span>
          </>
        }
        subtitle="Hedeflerine odaklan, biz her zaman yanındayız."
      />

      {isProfileIncomplete && (
        <Alert
          variant="warning"
          title="Profilini tamamla"
          action={
            <ButtonLink href="/profile/complete" variant="primary" size="sm">
              Tamamla
            </ButtonLink>
          }
        >
          Boy, doğum tarihi ve kilo bilgilerini eklersen hedef takibini daha iyi yapabiliriz.
        </Alert>
      )}

      {!profile?.emailConfirmed && <AddEmailBanner />}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Calendar}
          label="Sıradaki Randevum"
          value={
            nextAppointment
              ? new Date(nextAppointment.startTimeUtc).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })
              : "Yok"
          }
          caption={nextAppointment ? new Date(nextAppointment.startTimeUtc).toLocaleDateString("tr-TR", { weekday: "long" }) : undefined}
        />
        <StatCard icon={Layers} label="Kalan Seansım" value={`${totalRemaining}`} caption="seans kaldı" />
      </div>

      {nextAppointment && primaryTrainer && (
        <SectionCard
          title="Sıradaki Randevu"
          action={
            <Link href="/appointments" className="text-sm font-medium text-ink hover:underline">
              Tüm Randevularım →
            </Link>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <AvatarCircle name={nextAppointment.trainerName} size={56} className="text-lg" />
              <div>
                <p className="text-base font-bold text-foreground">{nextAppointment.trainerName}</p>
                <p className="text-sm text-ink-secondary">Provider</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-sm text-ink-secondary">
              <span className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-ink-muted" />
                {new Date(nextAppointment.startTimeUtc).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  weekday: "long",
                })}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-ink-muted" />
                {new Date(nextAppointment.startTimeUtc).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                {" – "}
                {new Date(nextAppointment.endTimeUtc).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-ink-muted" /> CoreFit Stüdyo
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                Detay
              </Button>
              <Button variant="secondary" className="flex-1">
                Takvime Ekle
              </Button>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

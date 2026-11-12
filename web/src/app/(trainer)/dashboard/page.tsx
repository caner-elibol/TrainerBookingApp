import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarCheck, PieChart, Sparkles, TrendingUp, Users } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type {
  AccountProfile,
  AvailableSlot,
  PackageDto,
  TrainerAppointment,
  TrainerClientSummary,
  TrainerDashboardStats,
  TrainerLocation,
  TrainerPaymentsSummary,
  TrainerSettingsResponse,
} from "@/lib/types";
import { localDayOf, localTimeKeyOf } from "@/lib/date";
import { computeSlotStarts } from "@/lib/scheduleSlots";
import { isRenewalCandidate } from "@/lib/package-status";
import Alert from "@/components/ui/Alert";
import ButtonLink from "@/components/ui/ButtonLink";
import StatCard from "@/components/ui/StatCard";
import SectionCard from "@/components/ui/SectionCard";
import ProgressBar from "@/components/ui/ProgressBar";
import AvatarCircle from "@/components/ui/AvatarCircle";
import PageHeader from "@/components/trainer/PageHeader";
import AddEmailBanner from "@/components/account/AddEmailBanner";
import TodayScheduleTimeline, { type TodaySlot } from "./TodayScheduleTimeline";
import MonthlyGoalsSheet from "./MonthlyGoalsSheet";

function minutesFromTimeString(value: string | null): number | null {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Trainer") redirect("/");

  const [settingsResult, profileResult] = await Promise.all([
    authedFetch<TrainerSettingsResponse>("/api/trainers/me/settings"),
    authedFetch<AccountProfile>("/api/account/me"),
  ]);
  const isOnboarded = settingsResult.ok;
  const profile = profileResult.ok ? profileResult.data : null;

  const [statsResult, appointmentsResult, paymentsResult, packagesResult, clientsResult, locationsResult] = isOnboarded
    ? await Promise.all([
        authedFetch<TrainerDashboardStats>("/api/trainers/me/dashboard-stats"),
        authedFetch<TrainerAppointment[]>("/api/trainers/me/appointments"),
        authedFetch<TrainerPaymentsSummary>("/api/trainers/me/payments"),
        authedFetch<PackageDto[]>("/api/packages/mine"),
        authedFetch<TrainerClientSummary[]>("/api/trainers/me/clients"),
        authedFetch<TrainerLocation[]>("/api/trainers/me/locations"),
      ])
    : [null, null, null, null, null, null];

  const stats = statsResult?.ok ? statsResult.data : null;
  const appointments = (appointmentsResult?.ok ? appointmentsResult.data : null) ?? [];
  const paymentsSummary = paymentsResult?.ok ? paymentsResult.data : null;
  const recentPayments = (paymentsSummary?.payments ?? []).filter((p) => p.status === "Paid").slice(0, 5);
  const packages = (packagesResult?.ok ? packagesResult.data : null) ?? [];
  const activePackageCount = packages.filter((p) => p.isActive).length;
  const packageUtilizationPercent = packages.length > 0 ? Math.round((activePackageCount / packages.length) * 100) : 0;
  const clients = (clientsResult?.ok ? clientsResult.data : null) ?? [];
  const locations = (locationsResult?.ok ? locationsResult.data : null) ?? [];
  const activeClientCount = clients.filter((c) => c.remainingSessions > 0).length;

  const packagePriceByTitle = new Map(packages.map((p) => [p.title, p.price]));
  const averagePackagePrice = packages.length > 0 ? packages.reduce((sum, p) => sum + p.price, 0) / packages.length : 0;
  const renewalCandidates = clients.filter((c) => isRenewalCandidate(c.remainingSessions));
  const estimatedRenewalRevenue = renewalCandidates.reduce((sum, c) => {
    const price = c.activePackageTitle ? packagePriceByTitle.get(c.activePackageTitle) : undefined;
    return sum + (price ?? averagePackagePrice);
  }, 0);

  const settings = settingsResult.data;
  const monthlyGoals = settings
    ? [
        {
          label: "Aylık gelir hedefi",
          target: settings.monthlyRevenueTarget,
          percent: settings.monthlyRevenueTarget > 0 ? Math.round(((paymentsSummary?.paidThisMonth ?? 0) / settings.monthlyRevenueTarget) * 100) : null,
        },
        {
          label: "Aktif danışan sayısı",
          target: settings.monthlyActiveClientTarget,
          percent: settings.monthlyActiveClientTarget > 0 ? Math.round((activeClientCount / settings.monthlyActiveClientTarget) * 100) : null,
        },
        {
          label: "Paket yenileme oranı",
          target: settings.monthlyRenewalTargetPercent,
          percent:
            settings.monthlyRenewalTargetPercent > 0 && clients.length > 0
              ? Math.round(((activeClientCount / clients.length) * 100 / settings.monthlyRenewalTargetPercent) * 100)
              : null,
        },
      ]
    : [];

  const today = new Date();
  const todayIso = today.toLocaleDateString("en-CA");
  const todayAppointments = appointments.filter(
    (a) => localDayOf(a.startTimeUtc) === todayIso && a.status !== "Cancelled" && a.status !== "Locked",
  );

  const appointmentSlots: TodaySlot[] = todayAppointments.map((appointment) => {
    const label = localTimeKeyOf(appointment.startTimeUtc);
    const [hour, minute] = label.split(":").map(Number);
    return { slot: { hour, minute, label }, kind: "booked", appointment };
  });

  function overlapsAnAppointment(slotMinutes: number, sessionMinutes: number): boolean {
    const slotEndMinutes = slotMinutes + sessionMinutes;
    return todayAppointments.some((appt) => {
      const apptStart = minutesFromTimeString(localTimeKeyOf(appt.startTimeUtc))!;
      const apptEnd = minutesFromTimeString(localTimeKeyOf(appt.endTimeUtc))!;
      return slotMinutes < apptEnd && slotEndMinutes > apptStart;
    });
  }

  const workingHour = settingsResult.data?.workingHours.find((wh) => wh.dayOfWeek === today.getDay());
  const breakSlots: TodaySlot[] = [];
  if (workingHour) {
    const breakStart = minutesFromTimeString(workingHour.breakStartTime);
    const breakEnd = minutesFromTimeString(workingHour.breakEndTime);
    const sessionMinutes = settingsResult.data?.sessionDurationMinutes ?? 60;
    const bufferMinutes = settingsResult.data?.bufferDurationMinutes ?? 0;

    for (const slot of computeSlotStarts([workingHour], sessionMinutes, bufferMinutes)) {
      const slotMinutes = slot.hour * 60 + slot.minute;
      if (overlapsAnAppointment(slotMinutes, sessionMinutes)) continue;

      if (breakStart !== null && breakEnd !== null && slotMinutes < breakEnd && slotMinutes + sessionMinutes > breakStart) {
        breakSlots.push({ slot, kind: "break" });
      }
    }
  }

  const availabilityByLocation = locations.length > 0
    ? await Promise.all(
        locations.map((loc) =>
          authedFetch<AvailableSlot[]>(`/api/trainers/${user.id}/availability?locationId=${loc.id}&date=${todayIso}`).then(
            (r) => [loc, r.ok ? (r.data ?? []) : []] as const,
          ),
        ),
      )
    : [];

  const availableRowsByStart = new Map<string, { startTimeUtc: string; locations: TrainerLocation[] }>();
  for (const [loc, slots] of availabilityByLocation) {
    for (const slot of slots) {
      const existing = availableRowsByStart.get(slot.startTimeUtc);
      if (existing) existing.locations.push(loc);
      else availableRowsByStart.set(slot.startTimeUtc, { startTimeUtc: slot.startTimeUtc, locations: [loc] });
    }
  }

  const nowMs = Date.now();
  const availableSlots: TodaySlot[] = Array.from(availableRowsByStart.values())
    .filter((row) => new Date(row.startTimeUtc).getTime() >= nowMs)
    .map((row) => {
      const label = localTimeKeyOf(row.startTimeUtc);
      const [hour, minute] = label.split(":").map(Number);
      return {
        slot: { hour, minute, label },
        kind: "available",
        startTimeUtc: row.startTimeUtc,
        validLocations: row.locations,
        restricted: row.locations.length < locations.length,
      };
    });

  const todaySlots: TodaySlot[] = [...appointmentSlots, ...breakSlots, ...availableSlots].sort(
    (a, b) => a.slot.hour * 60 + a.slot.minute - (b.slot.hour * 60 + b.slot.minute),
  );

  const nextAppointment =
    todayAppointments
      .filter((a) => a.status === "Confirmed" && new Date(a.endTimeUtc).getTime() >= nowMs)
      .sort((a, b) => a.startTimeUtc.localeCompare(b.startTimeUtc))[0] ?? null;
  const nextAppointmentClient = nextAppointment ? clients.find((c) => c.clientId === nextAppointment.clientId) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Günaydın, ${firstName(user.fullName)}`}
        subtitle="Bugün harika bir gün. Hedeflerine odaklan, fark yaratmaya devam et!"
      />

      {!profile?.emailConfirmed && <AddEmailBanner />}

      {!isOnboarded && (
        <Alert
          variant="warning"
          title="Takvimini oluşturmayı tamamla"
          action={
            <ButtonLink href="/onboarding" variant="primary" size="sm">
              Kuruluma devam et
            </ButtonLink>
          }
        >
          Henüz çalışma saatlerini belirlemedin — sen bunu yapana kadar danışanların randevu alamaz.
        </Alert>
      )}

      {isOnboarded && stats?.isTodayClosed && (
        <Alert variant="warning" title="Bugün randevuya kapalı">
          Bugünü yeni randevu alımına kapattın — mevcut randevuların olduğu gibi devam eder. Takvim
          sayfasından istediğin an tekrar açabilirsin.
        </Alert>
      )}

      {isOnboarded && (
        <>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <StatCard
              icon={CalendarCheck}
              label="Bugünkü Randevular"
              value={stats?.todayAppointmentCount ?? 0}
              caption={
                stats && stats.todayByLocation.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    {stats.todayByLocation.map((l) => (
                      <span key={l.locationId} className="whitespace-nowrap">
                        {l.count} {l.locationName}
                      </span>
                    ))}
                  </div>
                ) : (
                  "Bugün randevu yok"
                )
              }
              tone="primary"
            />
            <StatCard
              icon={Users}
              label="Aktif Danışanlar"
              value={stats?.totalClients ?? 0}
              caption="Tüm zamanlar"
              tone="primary"
            />
            <StatCard
              icon={TrendingUp}
              label="Toplam Gelir"
              value={`₺${(stats?.totalRevenue ?? 0).toLocaleString("tr-TR")}`}
              caption="Tüm zamanlar"
              tone="primary"
            />
            <StatCard
              icon={PieChart}
              label="Paket Kullanımı"
              value={`%${packageUtilizationPercent}`}
              caption={`${activePackageCount} / ${packages.length} paket aktif`}
              tone="primary"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
            <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
              {nextAppointment && (
                <SectionCard
                  title="Sıradaki Randevu"
                  className="lg:hidden"
                  action={
                    <Link href="/calendar" className="text-sm font-medium text-ink hover:underline">
                      Takvim →
                    </Link>
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 shrink-0 text-sm leading-tight">
                      <p className="font-bold text-ink">{localTimeKeyOf(nextAppointment.startTimeUtc)}</p>
                      <p className="text-ink-muted">{localTimeKeyOf(nextAppointment.endTimeUtc)}</p>
                    </div>
                    <AvatarCircle name={nextAppointment.clientName} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{nextAppointment.clientName}</p>
                      <p className="truncate text-xs text-ink-secondary">
                        {nextAppointmentClient?.activePackageTitle
                          ? `${nextAppointmentClient.activePackageTitle} · ${nextAppointmentClient.remainingSessions} seans kaldı`
                          : nextAppointment.locationName}
                      </p>
                    </div>
                  </div>
                  <ButtonLink
                    href={`/clients/${nextAppointment.clientId}`}
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                  >
                    Danışan Detayı
                  </ButtonLink>
                </SectionCard>
              )}

              <SectionCard
                title="Bugünün Programı"
                action={
                  <span className="text-sm text-ink-secondary">
                    {today.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" })}
                  </span>
                }
              >
                <TodayScheduleTimeline slots={todaySlots} todayIso={todayIso} clients={clients} />
              </SectionCard>
            </div>

            <div className="flex min-w-0 flex-col gap-6">
              <SectionCard
                title="Son Ödemeler"
                action={
                  <Link href="/payments" className="text-sm font-medium text-ink hover:underline">
                    Tümünü Gör →
                  </Link>
                }
              >
                {recentPayments.length === 0 ? (
                  <p className="py-4 text-center text-sm text-ink-secondary">Henüz ödeme yok.</p>
                ) : (
                  <div className="flex flex-col divide-y divide-border-default">
                    {recentPayments.map((payment) => (
                      <div key={payment.paymentId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <AvatarCircle name={payment.clientName} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{payment.clientName}</p>
                          <p className="truncate text-xs text-ink-secondary">{payment.packageTitle}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-ink">₺{payment.amount.toLocaleString("tr-TR")}</p>
                          <p className="text-xs text-ink-muted">
                            {new Date(payment.createdAtUtc).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Bu Ayki Hedefler"
                action={
                  <MonthlyGoalsSheet
                    settings={settings ?? null}
                    trigger={
                      <button type="button" className="text-sm font-medium text-ink hover:underline">
                        Düzenle
                      </button>
                    }
                  />
                }
              >
                {monthlyGoals.every((g) => g.target <= 0) ? (
                  <p className="py-4 text-center text-sm text-ink-secondary">
                    Henüz hedef belirlemedin.{" "}
                    <MonthlyGoalsSheet
                      settings={settings ?? null}
                      trigger={
                        <button type="button" className="font-medium text-ink underline">
                          Şimdi ekle
                        </button>
                      }
                    />
                    .
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {monthlyGoals
                      .filter((g) => g.target > 0)
                      .map((goal) => (
                        <div key={goal.label}>
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className="text-ink-secondary">{goal.label}</span>
                            <span className="font-semibold text-ink">%{goal.percent ?? 0}</span>
                          </div>
                          <ProgressBar percent={Math.min(goal.percent ?? 0, 100)} />
                        </div>
                      ))}
                  </div>
                )}
              </SectionCard>

              {renewalCandidates.length > 0 && (
                <SectionCard
                  title={
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Yenileme Fırsatı
                    </span>
                  }
                >
                  <p className="text-sm text-ink-secondary">
                    <span className="font-semibold text-ink">{renewalCandidates.length} danışanın</span> paketinde 1
                    seans kaldı.
                  </p>
                  <p className="mt-1 text-sm text-ink-secondary">
                    Tahmini yenileme potansiyeli:{" "}
                    <span className="font-semibold text-ink">
                      ₺{Math.round(estimatedRenewalRevenue).toLocaleString("tr-TR")}
                    </span>
                  </p>
                  <ButtonLink href="/clients" variant="secondary" size="sm" className="mt-4 w-full">
                    Danışanları Gör
                  </ButtonLink>
                </SectionCard>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

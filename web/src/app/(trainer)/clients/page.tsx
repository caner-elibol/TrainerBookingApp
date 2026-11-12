import { CHART_SERIES_COLORS } from "@/lib/chart-colors";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Cake, CheckCircle2, Clock, PauseCircle, Users } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type {
  PackageDto,
  ServiceMixEntry,
  TrainerAppointment,
  TrainerClientSummary,
  TrainerReports,
  UpcomingBirthday,
} from "@/lib/types";
import { localDayOf, formatLocalTime } from "@/lib/date";
import PageHeader from "@/components/trainer/PageHeader";
import StatCard from "@/components/ui/StatCard";
import SectionCard from "@/components/ui/SectionCard";
import DonutChartWithLegend from "@/components/ui/DonutChartWithLegend";
import AvatarCircle from "@/components/ui/AvatarCircle";
import Badge from "@/components/ui/Badge";
import ClientsTable from "./ClientsTable";
import AddClientDialog from "./AddClientDialog";

const SERVICE_COLORS = CHART_SERIES_COLORS;

export default async function ClientsPage({ searchParams }: PageProps<"/clients">) {
  const { new: openNew } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Trainer") redirect("/");

  const [clientsResult, appointmentsResult, reportsResult, birthdaysResult, packagesResult] = await Promise.all([
    authedFetch<TrainerClientSummary[]>("/api/trainers/me/clients"),
    authedFetch<TrainerAppointment[]>("/api/trainers/me/appointments"),
    authedFetch<TrainerReports>("/api/trainers/me/reports"),
    authedFetch<UpcomingBirthday[]>("/api/trainers/me/upcoming-birthdays"),
    authedFetch<PackageDto[]>("/api/packages/mine"),
  ]);

  const clients = clientsResult.ok ? (clientsResult.data ?? []) : [];
  const appointments = appointmentsResult.ok ? (appointmentsResult.data ?? []) : [];
  const serviceMix: ServiceMixEntry[] = (reportsResult.ok ? reportsResult.data?.serviceMix : undefined) ?? [];
  const upcomingBirthdays = (birthdaysResult.ok ? birthdaysResult.data : null) ?? [];
  const packages = (packagesResult.ok ? packagesResult.data : null) ?? [];

  const activeCount = clients.filter((c) => c.remainingSessions > 0).length;
  const passiveCount = clients.length - activeCount;

  const todayIso = new Date().toLocaleDateString("en-CA");
  const todayAppointments = appointments
    .filter((a) => localDayOf(a.startTimeUtc) === todayIso && a.status !== "Cancelled")
    .sort((a, b) => new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime());

  const serviceMixDonut = serviceMix.map((s, i) => ({
    label: s.packageTitle,
    value: s.count,
    color: SERVICE_COLORS[i % SERVICE_COLORS.length],
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Danışanlar"
        subtitle="Danışanlarını yönet, gelişimlerini takip et, daha sağlıklı bir topluma katkı sağla."
        action={<AddClientDialog packages={packages} defaultOpen={openNew === "1"} />}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Toplam Danışan" value={clients.length} caption="Tüm zamanlar" tone="primary" />
        <StatCard icon={CheckCircle2} label="Aktif Danışan" value={activeCount} caption="Şu anda aktif" tone="success" />
        <StatCard
          icon={Clock}
          label="Bugün Randevusu Olan"
          value={todayAppointments.length}
          caption="Bugünkü program"
          tone="primary"
        />
        <StatCard icon={PauseCircle} label="Pasif Danışan" value={passiveCount} caption="Şu anda pasif" tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <SectionCard>
          <ClientsTable clients={clients} appointments={appointments} />
        </SectionCard>

        <div className="flex flex-col gap-6">
          <SectionCard title="Yaklaşan Doğum Günleri">
            {upcomingBirthdays.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-secondary">Yaklaşan doğum günü yok.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {upcomingBirthdays.map((b) => {
                  const [, month, day] = b.dateOfBirth.split("-").map(Number);
                  const dateLabel = new Date(2000, month - 1, day).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
                  const relative = b.daysUntil === 0 ? "Bugün" : b.daysUntil === 1 ? "Yarın" : `${b.daysUntil} gün sonra`;
                  return (
                    <div key={b.clientId} className="flex items-center gap-3">
                      <AvatarCircle name={b.clientName} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{b.clientName}</p>
                        <p className="text-xs text-ink-secondary">{dateLabel}</p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-ink">
                        <Cake className="h-3.5 w-3.5" />
                        {relative}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title={`Bugün Gelenler (${todayAppointments.length})`}
            action={
              <Link href="/calendar" className="text-sm font-medium text-ink hover:underline">
                Tümünü Gör →
              </Link>
            }
          >
            {todayAppointments.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-secondary">Bugün randevu yok.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {todayAppointments.map((a) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <AvatarCircle name={a.clientName} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{a.clientName}</p>
                      <p className="text-xs text-ink-secondary">
                        {formatLocalTime(a.startTimeUtc)} - {formatLocalTime(a.endTimeUtc)}
                      </p>
                    </div>
                    <Badge variant={a.status === "Completed" ? "success" : "warning"}>
                      {a.status === "Completed" ? "Geldi" : "Bekleniyor"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Danışan Dağılımı (Hizmet Türü)" action={<span className="text-sm text-ink-secondary">Son 4 Hafta</span>}>
            {serviceMixDonut.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-secondary">Henüz veri yok.</p>
            ) : (
              <DonutChartWithLegend
                data={serviceMixDonut}
                centerValue={String(clients.length)}
                centerLabel="Danışan"
                formatLegendValue={(s, total) => `%${total > 0 ? Math.round((s.value / total) * 100) : 0}`}
              />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

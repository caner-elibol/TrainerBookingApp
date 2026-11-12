import { CHART_SERIES_COLORS } from "@/lib/chart-colors";
import { redirect } from "next/navigation";
import { CheckCircle2, TrendingDown, Users, Wallet } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { TrainerReports } from "@/lib/types";
import { TR_WEEKDAY_SHORT_MONDAY_FIRST } from "@/lib/date";
import PageHeader from "@/components/trainer/PageHeader";
import StatCard from "@/components/ui/StatCard";
import SectionCard from "@/components/ui/SectionCard";
import LineChartMini from "@/components/ui/LineChartMini";
import BarChartMini from "@/components/ui/BarChartMini";
import DonutChartWithLegend from "@/components/ui/DonutChartWithLegend";
import Heatmap from "@/components/ui/Heatmap";
import PrintReportButton from "./PrintReportButton";

const SERVICE_COLORS = CHART_SERIES_COLORS;
const HEATMAP_ROW_BUCKETS = [
  { label: "08-10", startHour: 8, endHour: 10 },
  { label: "10-12", startHour: 10, endHour: 12 },
  { label: "12-14", startHour: 12, endHour: 14 },
  { label: "14-16", startHour: 14, endHour: 16 },
  { label: "16-18", startHour: 16, endHour: 18 },
  { label: "18-20", startHour: 18, endHour: 20 },
];

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("tr-TR", { month: "short", year: "numeric" });
}

function toMondayFirst(dayOfWeekSundayFirst: number): number {
  return (dayOfWeekSundayFirst + 6) % 7;
}

export default async function ReportsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Trainer") redirect("/");

  const result = await authedFetch<TrainerReports>("/api/trainers/me/reports");
  const reports = result.ok ? result.data : null;

  if (!reports) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Raporlar" subtitle="Büyümeni, randevularını ve danışan performansını analiz et." />
        <SectionCard>
          <p className="py-8 text-center text-sm text-ink-secondary">Raporlar şu anda yüklenemedi.</p>
        </SectionCard>
      </div>
    );
  }

  const revenueTrend = reports.revenueTrend.map((p) => ({ label: monthLabel(p.year, p.month), value: p.value }));
  const clientGrowth = reports.clientGrowth.map((p) => ({ label: monthLabel(p.year, p.month), value: p.value }));

  const revenueDelta =
    revenueTrend.length >= 2 && revenueTrend[revenueTrend.length - 2].value > 0
      ? Math.round(
          ((revenueTrend[revenueTrend.length - 1].value - revenueTrend[revenueTrend.length - 2].value) /
            revenueTrend[revenueTrend.length - 2].value) *
            100,
        )
      : null;
  const clientDelta =
    clientGrowth.length >= 2
      ? clientGrowth[clientGrowth.length - 1].value - clientGrowth[clientGrowth.length - 2].value
      : null;

  const weeklySessionsByDay = new Map(reports.weeklySessions.map((w) => [toMondayFirst(w.dayOfWeek), w.count]));
  const weeklySessions = TR_WEEKDAY_SHORT_MONDAY_FIRST.map((label, i) => ({ label, value: weeklySessionsByDay.get(i) ?? 0 }));

  const totalSeans = reports.serviceMix.reduce((s, d) => s + d.count, 0);
  const serviceMix = reports.serviceMix.map((s, i) => ({
    label: s.packageTitle,
    value: s.count,
    color: SERVICE_COLORS[i % SERVICE_COLORS.length],
  }));

  const heatmapValues = HEATMAP_ROW_BUCKETS.map((bucket) => {
    const rowCounts = TR_WEEKDAY_SHORT_MONDAY_FIRST.map((_, colIndex) =>
      reports.busiestHours
        .filter((c) => toMondayFirst(c.dayOfWeek) === colIndex && c.hour >= bucket.startHour && c.hour < bucket.endHour)
        .reduce((s, c) => s + c.count, 0),
    );
    return rowCounts;
  });
  const maxHeatmapValue = Math.max(1, ...heatmapValues.flat());
  const heatmapIntensity = heatmapValues.map((row) => row.map((v) => v / maxHeatmapValue));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Raporlar"
        subtitle="Büyümeni, randevularını ve danışan performansını analiz et."
        action={<PrintReportButton />}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Wallet}
          label="Aylık Gelir"
          value={`₺${reports.summary.monthlyRevenue.toLocaleString("tr-TR")}`}
          delta={revenueDelta !== null ? { label: `${revenueDelta >= 0 ? "+" : ""}${revenueDelta}%`, direction: revenueDelta >= 0 ? "up" : "down" } : undefined}
          caption="Bu ay"
          tone="success"
        />
        <StatCard
          icon={Users}
          label="Aktif Danışan"
          value={reports.summary.activeClients}
          delta={clientDelta !== null ? { label: `${clientDelta >= 0 ? "+" : ""}${clientDelta}`, direction: clientDelta >= 0 ? "up" : "down" } : undefined}
          caption="Geçen aya göre"
          tone="primary"
        />
        <StatCard
          icon={CheckCircle2}
          label="Tamamlanan Seans"
          value={reports.summary.completedSessions}
          caption="Bu ay"
          tone="success"
        />
        <StatCard
          icon={TrendingDown}
          label="İptal Oranı"
          value={`%${Math.round(reports.summary.cancellationRatePercent)}`}
          caption="Bu ay"
          tone="danger"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <SectionCard title="Aylık Gelir Trendi" action={<span className="text-sm text-ink-secondary">Son 6 Ay</span>}>
          <LineChartMini data={revenueTrend} formatValue={(v) => `₺${v.toLocaleString("tr-TR")}`} />
        </SectionCard>

        <SectionCard title="Haftalık Tamamlanan Seanslar" action={<span className="text-sm text-ink-secondary">Son 4 Hafta</span>}>
          <BarChartMini data={weeklySessions} />
        </SectionCard>

        <SectionCard title="Hizmet Dağılımı" action={<span className="text-sm text-ink-secondary">Son 4 Hafta</span>}>
          {serviceMix.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-secondary">Henüz veri yok.</p>
          ) : (
            <DonutChartWithLegend
              data={serviceMix}
              centerValue={String(totalSeans)}
              centerLabel="seans"
              formatLegendValue={(s, total) => `%${total > 0 ? Math.round((s.value / total) * 100) : 0} · ${s.value}`}
            />
          )}
        </SectionCard>

        <SectionCard title="En Çok Kazandıran Paketler" action={<span className="text-sm text-ink-secondary">Tüm Zamanlar</span>}>
          {reports.topPackages.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-secondary">Henüz satış yok.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {reports.topPackages.map((pkg, i) => (
                <div key={pkg.title} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-bold text-ink">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{pkg.title}</span>
                    <span className="shrink-0 text-sm font-semibold text-foreground">
                      ₺{pkg.revenue.toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pl-8">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(pkg.revenue / reports.topPackages[0].revenue) * 100}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs text-ink-secondary">{pkg.sales} satış</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Danışan Büyümesi" action={<span className="text-sm text-ink-secondary">Son 6 Ay</span>}>
          <LineChartMini data={clientGrowth} />
        </SectionCard>

        <SectionCard title="En Yoğun Saatler" action={<span className="text-sm text-ink-secondary">Son 4 Hafta</span>}>
          <Heatmap
            rowLabels={HEATMAP_ROW_BUCKETS.map((b) => b.label)}
            colLabels={[...TR_WEEKDAY_SHORT_MONDAY_FIRST]}
            values={heatmapIntensity}
          />
          <div className="mt-3 flex items-center justify-end gap-2 text-xs text-ink-secondary">
            <span>Daha az yoğun</span>
            <span className="flex gap-1">
              {["bg-surface-muted", "bg-subtle-strong", "bg-neutral-300", "bg-neutral-500", "bg-primary"].map((c) => (
                <span key={c} className={`h-3 w-3 rounded-sm ${c}`} />
              ))}
            </span>
            <span>Daha yoğun</span>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { Calendar, Clock, CreditCard, XCircle } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { TrainerPaymentsSummary } from "@/lib/types";
import PageHeader from "@/components/trainer/PageHeader";
import StatCard from "@/components/ui/StatCard";
import SectionCard from "@/components/ui/SectionCard";
import DonutChartWithLegend from "@/components/ui/DonutChartWithLegend";
import LineChartMini from "@/components/ui/LineChartMini";
import ExportCsvButton from "./ExportCsvButton";
import PaymentsTable from "./PaymentsTable";

export default async function PaymentsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Trainer") redirect("/");

  const result = await authedFetch<TrainerPaymentsSummary>("/api/trainers/me/payments");
  const summary: TrainerPaymentsSummary = (result.ok ? result.data : null) ?? {
    paidThisMonth: 0,
    paidCount: 0,
    pendingCount: 0,
    failedCount: 0,
    averageAmount: 0,
    payments: [],
  };

  const pendingTotal = summary.payments.filter((p) => p.status === "Pending").reduce((s, p) => s + p.amount, 0);
  const failedTotal = summary.payments.filter((p) => p.status === "Failed").reduce((s, p) => s + p.amount, 0);

  const statusMix = [
    { label: "Ödendi", value: summary.paidCount, color: "#22C55E" },
    { label: "Beklemede", value: summary.pendingCount, color: "#F59E0B" },
    { label: "Başarısız", value: summary.failedCount, color: "#EF4444" },
  ];
  const totalOps = statusMix.reduce((s, d) => s + d.value, 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const weeklyCollections = last7Days.map((day) => {
    const dayIso = day.toLocaleDateString("en-CA");
    const total = summary.payments
      .filter((p) => p.status === "Paid" && new Date(p.createdAtUtc).toLocaleDateString("en-CA") === dayIso)
      .reduce((s, p) => s + p.amount, 0);
    return { label: day.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }), value: total };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ödemeler"
        subtitle="Tahsilatlarını, paket satışlarını ve ödeme geçmişini kolayca takip et."
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Calendar}
          label="Bu Ay Tahsilat"
          value={`₺${summary.paidThisMonth.toLocaleString("tr-TR")}`}
          caption="Bu ay başarıyla tahsil edilen"
          tone="success"
        />
        <StatCard
          icon={Clock}
          label="Bekleyen Ödeme"
          value={summary.pendingCount}
          caption={`Toplam tutar: ₺${pendingTotal.toLocaleString("tr-TR")}`}
          tone="warning"
        />
        <StatCard icon={CreditCard} label="Başarılı İşlem" value={summary.paidCount} caption="Tüm zamanlar" tone="success" />
        <StatCard
          icon={XCircle}
          label="Başarısız İşlem"
          value={summary.failedCount}
          caption={`Toplam tutar: ₺${failedTotal.toLocaleString("tr-TR")}`}
          tone="danger"
        />
      </div>

      <div className="flex items-center justify-end">
        <ExportCsvButton payments={summary.payments} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <SectionCard title="Ödeme Geçmişi">
          <PaymentsTable initialPayments={summary.payments} />
        </SectionCard>

        <div className="flex flex-col gap-6">
          <SectionCard title="Ödeme Durumu Dağılımı">
            <DonutChartWithLegend
              data={statusMix}
              centerValue={totalOps > 0 ? `%${Math.round((summary.paidCount / totalOps) * 100)}` : "—"}
              centerLabel="Ödendi"
            />
          </SectionCard>

          <SectionCard title="Son 7 Gün Tahsilat">
            <div className="mb-2">
              <p className="text-2xl font-bold text-foreground">
                ₺{weeklyCollections.reduce((s, d) => s + d.value, 0).toLocaleString("tr-TR")}
              </p>
            </div>
            <LineChartMini data={weeklyCollections} formatValue={(v) => `₺${v.toLocaleString("tr-TR")}`} height={140} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

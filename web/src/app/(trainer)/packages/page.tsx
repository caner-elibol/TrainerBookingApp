import { redirect } from "next/navigation";
import { Package, TrendingUp, Users } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { PackageDto, PackageInsight, TrainerPaymentsSummary } from "@/lib/types";
import { categoryForTitle } from "@/lib/fixtures/packages";
import PageHeader from "@/components/trainer/PageHeader";
import StatCard from "@/components/ui/StatCard";
import SectionCard from "@/components/ui/SectionCard";
import ProgressBar from "@/components/ui/ProgressBar";
import AvatarCircle from "@/components/ui/AvatarCircle";
import PackagesManager from "./PackagesManager";

export default async function PackagesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Trainer") redirect("/");

  const [packagesResult, insightsResult, paymentsResult] = await Promise.all([
    authedFetch<PackageDto[]>("/api/packages/mine"),
    authedFetch<PackageInsight[]>("/api/packages/mine/insights"),
    authedFetch<TrainerPaymentsSummary>("/api/trainers/me/payments"),
  ]);

  const packages = packagesResult.ok && packagesResult.data ? packagesResult.data : [];
  const insights = (insightsResult.ok ? insightsResult.data : null) ?? [];
  const insightByPackageId = new Map(insights.map((i) => [i.packageId, i]));

  const activeCount = packages.filter((p) => p.isActive).length;
  const totalSales = insights.reduce((sum, i) => sum + i.salesCount, 0);
  const totalRevenue = packages.reduce((sum, p) => sum + p.price * (insightByPackageId.get(p.id)?.salesCount ?? 0), 0);
  const activePrices = packages.filter((p) => p.isActive).map((p) => p.price);
  const averagePrice = activePrices.length > 0 ? activePrices.reduce((s, p) => s + p, 0) / activePrices.length : 0;

  const recentSales = ((paymentsResult.ok ? paymentsResult.data?.payments : null) ?? [])
    .filter((p) => p.status === "Paid")
    .slice(0, 5);

  const salesByCategory = new Map<string, number>();
  for (const pkg of packages) {
    const sales = insightByPackageId.get(pkg.id)?.salesCount ?? 0;
    const category = categoryForTitle(pkg.title);
    salesByCategory.set(category, (salesByCategory.get(category) ?? 0) + sales);
  }
  const totalCategorySales = Array.from(salesByCategory.values()).reduce((s, v) => s + v, 0);
  const CATEGORY_LABEL: Record<string, string> = {
    fitness: "Fitness",
    pilates: "Pilates",
    online: "Online Koçluk",
    nutrition: "Beslenme",
    duo: "Duo Antrenman",
  };
  const salesMix = Array.from(salesByCategory.entries())
    .map(([category, sales]) => ({
      label: CATEGORY_LABEL[category] ?? category,
      value: totalCategorySales > 0 ? Math.round((sales / totalCategorySales) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const topPackage = packages
    .map((p) => ({ pkg: p, sales: insightByPackageId.get(p.id)?.salesCount ?? 0 }))
    .sort((a, b) => b.sales - a.sales)[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Paketler"
        subtitle="Antrenman paketlerini oluştur, yönet ve daha fazla danışana ulaş."
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Package} label="Aktif Paketler" value={activeCount} caption={`Toplam ${packages.length} paket`} />
        <StatCard icon={Users} label="Toplam Satış" value={totalSales} caption="Tüm zamanlar" />
        <StatCard icon={TrendingUp} label="Toplam Gelir" value={`₺${totalRevenue.toLocaleString("tr-TR")}`} caption="Tüm zamanlar" />
        <StatCard icon={Package} label="Ortalama Fiyat" value={`₺${Math.round(averagePrice).toLocaleString("tr-TR")}`} caption="Aktif paketlerde" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <PackagesManager initialPackages={packages} insights={insights} />

        <div className="flex flex-col gap-6">
          <SectionCard title="Son Satılan Paketler" action={<span className="text-sm font-medium text-ink">Tümünü Gör →</span>}>
            {recentSales.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-secondary">Henüz satış yok.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {recentSales.map((sale) => (
                  <div key={sale.paymentId} className="flex items-center gap-3">
                    <AvatarCircle name={sale.clientName} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{sale.clientName}</p>
                      <p className="truncate text-xs text-ink-secondary">{sale.packageTitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">₺{sale.amount.toLocaleString("tr-TR")}</p>
                      <p className="text-xs text-ink-muted">
                        {new Date(sale.createdAtUtc).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {topPackage && topPackage.sales > 0 && (
            <SectionCard title="Paket İçgörüleri" action={<span className="text-sm font-medium text-ink">Tüm Zamanlar</span>}>
              <div className="flex items-center gap-3 rounded-xl bg-subtle p-4">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-xs font-medium text-ink">En Popüler Paket</p>
                  <p className="text-sm font-bold text-foreground">{topPackage.pkg.title}</p>
                  <p className="text-xs text-ink-secondary">{topPackage.sales} satış</p>
                </div>
              </div>
            </SectionCard>
          )}

          {salesMix.length > 0 && (
            <SectionCard title="Paket Satış Dağılımı">
              <div className="flex flex-col gap-3">
                {salesMix.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-ink-secondary">{item.label}</span>
                      <span className="font-semibold text-foreground">%{item.value}</span>
                    </div>
                    <ProgressBar percent={item.value} />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}

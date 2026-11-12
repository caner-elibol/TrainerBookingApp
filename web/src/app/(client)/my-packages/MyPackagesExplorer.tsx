"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import type { MyPackageDetail, MyPackageStatus, MyTrainerSummary, PackageDto, Review } from "@/lib/types";
import { categoryForTitle } from "@/lib/fixtures/packages";
import { remainingSessionsBadgeVariant, remainingSessionsLabel } from "@/lib/package-status";
import SectionCard from "@/components/ui/SectionCard";
import ProgressBar from "@/components/ui/ProgressBar";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import AvatarCircle from "@/components/ui/AvatarCircle";
import ButtonLink from "@/components/ui/ButtonLink";
import EmptyState from "@/components/ui/EmptyState";
import { CARD_BASE_CLASSES } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import PurchaseButton from "@/app/pt/[slug]/PurchaseButton";
import TrainerReviewForm from "../trainers/TrainerReviewForm";

export interface TrainerPackageEntry {
  trainer: MyTrainerSummary;
  packages: MyPackageDetail[];
  catalog: PackageDto[];
  review: Review | null;
  bio: string | null;
}

const STATUS_LABEL: Record<MyPackageStatus, string> = { Active: "Aktif", Completed: "Tamamlandı", Pending: "Ödeme Bekliyor" };
const STATUS_BADGE: Record<MyPackageStatus, BadgeVariant> = { Active: "success", Completed: "gray", Pending: "warning" };

const CATEGORY_GRADIENTS: Record<string, string> = {
  fitness: "from-neutral-900 to-neutral-700",
  pilates: "from-neutral-800 to-neutral-600",
  online: "from-neutral-950 to-neutral-800",
  nutrition: "from-neutral-700 to-neutral-500",
  duo: "from-neutral-800 to-neutral-500",
};

export default function MyPackagesExplorer({ entries }: { entries: TrainerPackageEntry[] }) {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);

  const selected = entries.find((e) => e.trainer.trainerId === selectedTrainerId) ?? null;
  const selectedActivePackages = selected?.packages.filter((p) => p.status === "Active") ?? [];
  const selectedTotalSessions = selectedActivePackages.reduce((sum, p) => sum + p.totalSessions, 0);
  const selectedRemainingSessions = selectedActivePackages.reduce((sum, p) => sum + p.remainingSessions, 0);

  if (!selected) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {entries.map(({ trainer, packages }) => {
          const activePackages = packages.filter((p) => p.status === "Active");
          const totalSessions = activePackages.reduce((sum, p) => sum + p.totalSessions, 0);
          const remainingSessions = activePackages.reduce((sum, p) => sum + p.remainingSessions, 0);
          const usedSessions = totalSessions - remainingSessions;
          const percentUsed = totalSessions > 0 ? Math.round((usedSessions / totalSessions) * 100) : 0;
          return (
            <button
              key={trainer.trainerId}
              type="button"
              onClick={() => setSelectedTrainerId(trainer.trainerId)}
              className={cn(CARD_BASE_CLASSES, "flex items-center gap-3 text-left transition-colors hover:border-neutral-400")}
            >
              <AvatarCircle name={trainer.trainerName} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{trainer.trainerName}</p>
                {totalSessions > 0 ? (
                  <div className="mt-1.5">
                    <div className="flex items-center justify-between text-xs text-ink-secondary">
                      <span>Aktif ders kullanımı</span>
                      <span className="font-semibold text-foreground">
                        {usedSessions} / {totalSessions} seans
                      </span>
                    </div>
                    <ProgressBar percent={percentUsed} className="mt-1" />
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs text-ink-secondary">Aktif paket yok</p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-ink-muted" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => setSelectedTrainerId(null)}
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-ink"
      >
        <ChevronLeft className="h-4 w-4" /> Tüm Eğitmenler
      </button>

      <div className="flex items-center gap-3">
        <AvatarCircle name={selected.trainer.trainerName} size={56} className="text-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-foreground">{selected.trainer.trainerName}</p>
          <p className="text-sm text-ink-secondary">
            {selectedTotalSessions > 0
              ? `${selectedTotalSessions - selectedRemainingSessions} / ${selectedTotalSessions} seans kullanıldı`
              : "Aktif paket yok"}
          </p>
        </div>
        <ButtonLink href={`/pt/${selected.trainer.calendarSlug}`} variant="secondary" size="sm" className="shrink-0">
          Randevu Al
        </ButtonLink>
      </div>

      {selected.bio && <p className="text-sm text-ink-secondary">{selected.bio}</p>}

      <SectionCard title="Paketlerim & Kullanımlar">
        {selected.packages.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-secondary">Bu eğitmenden henüz bir paketin yok.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {selected.packages.map((pkg) => {
              const percentUsed = pkg.totalSessions > 0 ? Math.round(((pkg.totalSessions - pkg.remainingSessions) / pkg.totalSessions) * 100) : 0;
              return (
                <div key={pkg.userPackageId} className="rounded-xl border border-border-default p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-subtle text-ink">
                        <Layers className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground">{pkg.packageTitle}</p>
                        <p className="text-xs text-ink-secondary">{pkg.totalSessions} seanslık paket</p>
                      </div>
                    </div>
                    <Badge variant={STATUS_BADGE[pkg.status]}>{STATUS_LABEL[pkg.status]}</Badge>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-ink-secondary">Kullanım</span>
                      <span className="font-semibold text-foreground">
                        {pkg.totalSessions - pkg.remainingSessions} / {pkg.totalSessions} seans
                      </span>
                    </div>
                    <ProgressBar percent={percentUsed} />
                    {pkg.status === "Active" && (
                      <div className="mt-2 flex justify-end">
                        <Badge variant={remainingSessionsBadgeVariant(pkg.remainingSessions)}>
                          {remainingSessionsLabel(pkg.remainingSessions)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <TrainerReviewForm trainerId={selected.trainer.trainerId} initialReview={selected.review} />
      </SectionCard>

      <SectionCard title="Satın Alınabilir Paketler">
        {selected.catalog.length === 0 ? (
          <EmptyState title="Henüz paket yok" description="Bu eğitmen henüz bir paket yayınlamadı." />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {selected.catalog.map((pkg) => {
              const category = categoryForTitle(pkg.title);
              return (
                <div key={pkg.id} className={cn(CARD_BASE_CLASSES, "flex flex-col overflow-hidden p-0")}>
                  <div className={cn("h-14 bg-gradient-to-br", CATEGORY_GRADIENTS[category])} />
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    <div>
                      <h3 className="text-xs font-bold text-foreground">{pkg.title}</h3>
                      {pkg.description && <p className="mt-1 line-clamp-2 text-[11px] text-ink-secondary">{pkg.description}</p>}
                    </div>
                    <p className="text-base font-bold text-foreground">₺{pkg.price.toLocaleString("tr-TR")}</p>
                    <Badge variant="brand" className="w-fit">
                      {pkg.sessionCount} seans
                    </Badge>
                    <div className="mt-auto">
                      <PurchaseButton packageId={pkg.id} slug={selected.trainer.calendarSlug} canPurchase />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { Package as PackageIconOutline, Pencil, PowerOff, Users } from "lucide-react";
import { createPackage, deactivatePackage, updatePackage } from "./actions";
import type { CreatePackageRequest, PackageDto, PackageInsight } from "@/lib/types";
import { categoryForTitle } from "@/lib/fixtures/packages";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import ProgressBar from "@/components/ui/ProgressBar";
import { CARD_BASE_CLASSES } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const emptyForm: CreatePackageRequest = { title: "", description: "", sessionCount: 8, price: 0 };

const CATEGORY_GRADIENTS: Record<string, string> = {
  fitness: "from-neutral-900 to-neutral-700",
  pilates: "from-neutral-800 to-neutral-600",
  online: "from-neutral-950 to-neutral-800",
  nutrition: "from-neutral-700 to-neutral-500",
  duo: "from-neutral-800 to-neutral-500",
};

type FilterKey = "all" | "active" | "inactive";

export default function PackagesManager({
  initialPackages,
  insights,
}: {
  initialPackages: PackageDto[];
  insights: PackageInsight[];
}) {
  const [packages, setPackages] = useState(initialPackages);
  const insightByPackageId = new Map(insights.map((i) => [i.packageId, i]));
  const [filter, setFilter] = useState<FilterKey>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePackageRequest>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [deactivateTargetId, setDeactivateTargetId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeactivating, startDeactivateTransition] = useTransition();

  const dialogOpen = editingId !== null;
  const isEditing = editingId !== null && editingId !== "new";

  const activeCount = packages.filter((p) => p.isActive).length;
  const inactiveCount = packages.length - activeCount;
  const visiblePackages = useMemo(() => {
    if (filter === "active") return packages.filter((p) => p.isActive);
    if (filter === "inactive") return packages.filter((p) => !p.isActive);
    return packages;
  }, [packages, filter]);

  function startEdit(pkg: PackageDto) {
    setEditingId(pkg.id);
    setForm({ title: pkg.title, description: pkg.description, sessionCount: pkg.sessionCount, price: pkg.price });
    setError(null);
  }

  function startCreate() {
    setEditingId("new");
    setForm(emptyForm);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = editingId === "new" ? await createPackage(form) : await updatePackage(editingId as string, form);

      if (!result.success) {
        setError(result.error ?? "Bir şeyler ters gitti.");
        return;
      }

      if (result.package) {
        const saved = result.package;
        setPackages((prev) => {
          const exists = prev.some((p) => p.id === saved.id);
          return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev];
        });
      }
      cancelEdit();
    });
  }

  function handleDeactivate() {
    if (!deactivateTargetId) return;
    const id = deactivateTargetId;
    startDeactivateTransition(async () => {
      const result = await deactivatePackage(id);
      if (result.success) {
        setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: false } : p)));
      }
      setDeactivateTargetId(null);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {packages.length === 0 ? (
        <EmptyState
          icon={PackageIconOutline}
          title="Henüz paketin yok"
          description="Danışanların rezervasyon yapabilmesi için bir seans paketi oluştur."
          action={
            <Button variant="secondary" onClick={startCreate}>
              İlk paketini oluştur
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1 border-b border-border-default">
            {(
              [
                { key: "all", label: `Tüm Paketler (${packages.length})` },
                { key: "active", label: `Aktif (${activeCount})` },
                { key: "inactive", label: `Pasif (${inactiveCount})` },
              ] as { key: FilterKey; label: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={cn(
                  "-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                  filter === tab.key
                    ? "border-ink text-ink"
                    : "border-transparent text-ink-secondary hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {visiblePackages.map((pkg) => {
              const insight = insightByPackageId.get(pkg.id) ?? { salesCount: 0, popularityPercent: 0 };
              const category = categoryForTitle(pkg.title);
              return (
                <div key={pkg.id} className={cn(CARD_BASE_CLASSES, "flex flex-col overflow-hidden p-0")}>
                  <div className={cn("flex h-28 items-end bg-gradient-to-br p-4", CATEGORY_GRADIENTS[category])}>
                    {!pkg.isActive && (
                      <Badge variant="gray" className="bg-white/90">
                        Pasif
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{pkg.title}</h3>
                      {pkg.description && <p className="mt-1 line-clamp-2 text-xs text-ink-secondary">{pkg.description}</p>}
                    </div>
                    <p className="text-lg font-bold text-foreground">₺{pkg.price.toLocaleString("tr-TR")}</p>
                    <div className="flex items-center gap-4 text-xs text-ink-secondary">
                      <span className="flex items-center gap-1.5">
                        <PackageIconOutline className="h-3.5 w-3.5" /> {pkg.sessionCount} seans
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" /> {insight.salesCount} satış
                      </span>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-ink-secondary">
                        <span>Popülerlik</span>
                        <span className="font-semibold text-foreground">%{insight.popularityPercent}</span>
                      </div>
                      <ProgressBar percent={insight.popularityPercent} />
                    </div>
                    {pkg.isActive && (
                      <div className="mt-auto flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => startEdit(pkg)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-strong px-2 py-1.5 text-xs font-semibold text-ink hover:bg-subtle"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeactivateTargetId(pkg.id)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-error-100 px-2 py-1.5 text-xs font-semibold text-error-600 hover:bg-error-50"
                        >
                          <PowerOff className="h-3.5 w-3.5" /> Pasif Yap
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) cancelEdit();
        }}
      >
        <DialogContent>
          <DialogTitle>{isEditing ? "Paketi düzenle" : "Yeni paket"}</DialogTitle>
          <div className="mt-4 flex flex-col gap-4">
            <FormField label="Başlık" htmlFor="package-title">
              <Input
                id="package-title"
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </FormField>
            <FormField label="Açıklama" htmlFor="package-description">
              <Textarea
                id="package-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </FormField>
            <div className="flex flex-col gap-3">
              <FormField label="Seans Sayısı" htmlFor="package-session-count">
                <Input
                  id="package-session-count"
                  type="number"
                  min={1}
                  value={form.sessionCount}
                  onChange={(e) => setForm({ ...form, sessionCount: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Fiyat (₺)" htmlFor="package-price">
                <Input
                  id="package-price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </FormField>
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEdit}>
                İptal
              </Button>
              <Button variant="secondary" disabled={!form.title.trim()} isLoading={isPending} onClick={handleSave}>
                {isPending ? "Kaydediliyor…" : "Kaydet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deactivateTargetId !== null}
        onOpenChange={(open) => !open && setDeactivateTargetId(null)}
        title="Bu paketi pasif yapmak istiyor musun?"
        description="Danışanlar artık bu paketi satın alamaz. Mevcut rezervasyonlar etkilenmez."
        confirmLabel="Pasif Yap"
        variant="danger"
        isConfirming={isDeactivating}
        onConfirm={handleDeactivate}
      />

      <Button variant="secondary" className="self-start" onClick={startCreate}>
        + Yeni Paket
      </Button>
    </div>
  );
}

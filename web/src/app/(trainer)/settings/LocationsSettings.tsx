"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createLocation, deleteLocation, setLocationTravelTime } from "./actions";
import type { LocationTravelTime, TrainerLocation } from "@/lib/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";

function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export default function LocationsSettings({
  initialLocations,
  initialTravelTimes,
}: {
  initialLocations: TrainerLocation[];
  initialTravelTimes: LocationTravelTime[];
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [minutesDraft, setMinutesDraft] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialTravelTimes.map((t) => [pairKey(t.locationAId, t.locationBId), t.minutes])),
  );

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      const result = await createLocation(name);
      if (!result.success) {
        setError(result.error ?? "Konum eklenemedi.");
        return;
      }
      setNewName("");
      router.refresh();
    });
  }

  function handleDelete(locationId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteLocation(locationId);
      if (!result.success) {
        setError(result.error ?? "Konum silinemedi.");
        return;
      }
      router.refresh();
    });
  }

  function handleSaveTravelTime(aId: string, bId: string) {
    const minutes = minutesDraft[pairKey(aId, bId)] ?? 0;
    setError(null);
    startTransition(async () => {
      const result = await setLocationTravelTime(aId, bId, minutes);
      if (!result.success) {
        setError(result.error ?? "Süre kaydedilemedi.");
        return;
      }
      router.refresh();
    });
  }

  const pairs = initialLocations.flatMap((a, i) => initialLocations.slice(i + 1).map((b) => [a, b] as const));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold text-foreground">Ders Verdiğin Konumlar</h2>
        <p className="text-sm text-ink-secondary">
          Danışanlar randevu alırken önce bir konum seçer. Birden fazla konumun varsa aralarındaki geçiş
          süresini de belirtmen gerekir; takvim buna göre boşluk bırakır.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {initialLocations.length === 0 && <p className="text-sm text-ink-secondary">Henüz bir konum eklemedin.</p>}
        {initialLocations.map((loc) => (
          <div key={loc.id} className="flex items-center justify-between gap-2 rounded-lg border border-border-default px-3 py-2.5">
            <span className="text-sm font-medium text-foreground">{loc.name}</span>
            <button
              type="button"
              onClick={() => handleDelete(loc.id)}
              disabled={isPending}
              className="text-ink-muted hover:text-error-600 disabled:pointer-events-none disabled:opacity-50"
              aria-label={`${loc.name} konumunu sil`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Örn. Çekmeköy"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button type="button" variant="secondary" onClick={handleAdd} isLoading={isPending}>
          <Plus className="h-4 w-4" /> Ekle
        </Button>
      </div>

      {pairs.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-border-default pt-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Konumlar Arası Geçiş Süresi</p>
            <p className="text-xs text-ink-secondary">
              Bir konumdan diğerine geçiş için gereken süre. Kaydedilmemiş çiftlerde normal seans arası
              süre kullanılır.
            </p>
          </div>
          {pairs.map(([a, b]) => {
            const key = pairKey(a.id, b.id);
            return (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 truncate text-sm text-ink-secondary">
                  {a.name} <span className="text-ink-muted">↔</span> {b.name}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={minutesDraft[key] ?? 0}
                    onChange={(e) => setMinutesDraft((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="w-16 rounded-lg border border-border-default bg-surface px-2 py-1.5 text-sm text-foreground focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none"
                  />
                  <span className="text-xs text-ink-muted">dk</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => handleSaveTravelTime(a.id, b.id)} isLoading={isPending}>
                    Kaydet
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}

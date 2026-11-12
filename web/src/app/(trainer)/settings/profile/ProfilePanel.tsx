"use client";

import { Target } from "lucide-react";
import { useSettingsForm } from "../useSettingsForm";
import SettingsSaveBar from "../SettingsSaveBar";
import type { AccountProfile, TrainerSettingsResponse } from "@/lib/types";

export default function ProfilePanel({
  initialSettings,
  initialProfile,
}: {
  initialSettings: TrainerSettingsResponse | null;
  initialProfile: AccountProfile | null;
}) {
  const form = useSettingsForm(initialSettings, initialProfile);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold text-foreground">Profil Bilgileri</h2>
        <p className="text-sm text-ink-secondary">Danışanların göreceği kamuya açık profilini düzenle.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Şehir</span>
          <input
            type="text"
            value={form.city}
            onChange={(e) => form.setCity(e.target.value)}
            placeholder="İstanbul, Türkiye"
            className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-foreground placeholder:text-ink-muted focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Deneyim (Yıl)</span>
          <input
            type="number"
            min={0}
            value={form.yearsExperience}
            onChange={(e) => form.setYearsExperience(Number(e.target.value))}
            className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-foreground focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Biyografi</span>
        <textarea
          value={form.bio}
          onChange={(e) => form.setBio(e.target.value)}
          rows={4}
          placeholder="Kendini ve çalışma tarzını danışanlarına tanıt..."
          className="resize-none rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-foreground placeholder:text-ink-muted focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Uzmanlık Alanları</span>
        <input
          type="text"
          value={form.specialtiesText}
          onChange={(e) => form.setSpecialtiesText(e.target.value)}
          placeholder="Fonksiyonel Antrenman, Pilates, Yağ Yakımı"
          className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-foreground placeholder:text-ink-muted focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none"
        />
        <span className="text-xs text-ink-muted">Virgülle ayırarak yaz.</span>
      </label>

      <div className="border-t border-border-default pt-5">
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Target className="h-4 w-4 text-ink" /> Bu Ayki Hedeflerin
        </p>
        <p className="mb-3 text-xs text-ink-secondary">
          Dashboard&apos;daki &quot;Bu Ayki Hedefler&quot; kartında bu hedeflere göre ilerlemen gösterilir.
        </p>
        <div className="grid grid-cols-1 gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Aylık Gelir Hedefi (₺)</span>
            <input
              type="number"
              min={0}
              value={form.monthlyRevenueTarget}
              onChange={(e) => form.setMonthlyRevenueTarget(Number(e.target.value))}
              className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-foreground focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Aktif Danışan Hedefi</span>
            <input
              type="number"
              min={0}
              value={form.monthlyActiveClientTarget}
              onChange={(e) => form.setMonthlyActiveClientTarget(Number(e.target.value))}
              className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-foreground focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-foreground">Paket Yenileme Hedefi (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={form.monthlyRenewalTargetPercent}
              onChange={(e) => form.setMonthlyRenewalTargetPercent(Number(e.target.value))}
              className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-foreground focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none"
            />
          </label>
        </div>
      </div>

      <SettingsSaveBar isPending={form.isPending} saved={form.saved} errors={form.errors} onSave={form.handleSaveExtended} />
    </div>
  );
}

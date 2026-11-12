"use client";

import { useSettingsForm } from "../useSettingsForm";
import SettingsSaveBar from "../SettingsSaveBar";
import type { AccountProfile, TrainerSettingsResponse } from "@/lib/types";

export default function PaymentPanel({
  initialSettings,
  initialProfile,
}: {
  initialSettings: TrainerSettingsResponse | null;
  initialProfile: AccountProfile | null;
}) {
  const form = useSettingsForm(initialSettings, initialProfile);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-bold text-foreground">PayTR Ödeme Ayarları</h2>
        <p className="text-sm text-ink-secondary">Danışanlarından tahsilat alabilmen için PayTR mağaza bilgilerini gir.</p>
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Mağaza No (Merchant ID)</span>
        <input
          type="text"
          value={form.paytrMerchantId}
          onChange={(e) => form.setPaytrMerchantId(e.target.value)}
          placeholder="123456"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-foreground placeholder:text-ink-muted focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Mağaza Anahtarı (Merchant Key)</span>
        <input
          type="password"
          value={form.paytrMerchantKey}
          onChange={(e) => form.setPaytrMerchantKey(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          data-1p-ignore
          data-lpignore="true"
          className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-foreground placeholder:text-ink-muted focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Mağaza Şifresi (Merchant Salt)</span>
        <input
          type="password"
          value={form.paytrMerchantSalt}
          onChange={(e) => form.setPaytrMerchantSalt(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          data-1p-ignore
          data-lpignore="true"
          className="rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-foreground placeholder:text-ink-muted focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none"
        />
      </label>
      <SettingsSaveBar isPending={form.isPending} saved={form.saved} errors={form.errors} onSave={form.handleSaveExtended} />
    </div>
  );
}

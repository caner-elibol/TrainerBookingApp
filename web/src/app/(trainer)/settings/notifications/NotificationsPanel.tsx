"use client";

import { useSettingsForm } from "../useSettingsForm";
import SettingsSaveBar from "../SettingsSaveBar";
import type { AccountProfile, TrainerSettingsResponse } from "@/lib/types";

export default function NotificationsPanel({
  initialSettings,
  initialProfile,
}: {
  initialSettings: TrainerSettingsResponse | null;
  initialProfile: AccountProfile | null;
}) {
  const form = useSettingsForm(initialSettings, initialProfile);

  return (
    <div className="flex flex-col gap-1">
      <h2 className="mb-3 text-base font-bold text-foreground">Bildirim Ayarları</h2>
      <NotificationRow
        label="Push Bildirimleri"
        description="Tarayıcı bildirimleri al."
        checked={form.pushNotifications}
        onChange={form.setPushNotifications}
      />
      <NotificationRow
        label="E-posta Bildirimleri"
        description="Randevu, iptal ve duyurular."
        checked={form.emailNotifications}
        onChange={form.setEmailNotifications}
      />
      <NotificationRow
        label="Ödeme Bildirimleri"
        description="Yeni ödeme ve kazanç bildirimi."
        checked={form.paymentNotifications}
        onChange={form.setPaymentNotifications}
      />
      <div className="mt-4">
        <SettingsSaveBar isPending={form.isPending} saved={form.saved} errors={form.errors} onSave={form.handleSaveExtended} />
      </div>
    </div>
  );
}

function NotificationRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-default py-3.5 last:border-0">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-ink-secondary">{description}</p>
      </div>
      <label className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="absolute inset-0 rounded-full bg-border-strong transition-colors peer-checked:bg-primary" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </label>
    </div>
  );
}

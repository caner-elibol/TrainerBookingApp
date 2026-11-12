"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { updateExtendedSettings } from "../settings/actions";
import type { TrainerSettingsResponse } from "@/lib/types";
import { BottomSheet, BottomSheetContent, BottomSheetTrigger } from "@/components/ui/BottomSheet";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function MonthlyGoalsSheet({
  settings,
  trigger,
}: {
  settings: TrainerSettingsResponse | null;
  trigger: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [revenueTarget, setRevenueTarget] = useState(settings?.monthlyRevenueTarget ?? 0);
  const [activeClientTarget, setActiveClientTarget] = useState(settings?.monthlyActiveClientTarget ?? 0);
  const [renewalTargetPercent, setRenewalTargetPercent] = useState(settings?.monthlyRenewalTargetPercent ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!settings) return;
    setError(null);
    startTransition(async () => {
      const result = await updateExtendedSettings({
        bio: settings.bio,
        specialties: settings.specialties,
        yearsExperience: settings.yearsExperience,
        monthlyRevenueTarget: revenueTarget,
        monthlyActiveClientTarget: activeClientTarget,
        monthlyRenewalTargetPercent: renewalTargetPercent,
        notifyPushEnabled: settings.notifyPushEnabled,
        notifyEmailEnabled: settings.notifyEmailEnabled,
        notifyPaymentEnabled: settings.notifyPaymentEnabled,
        paytrMerchantId: settings.paytrMerchantId,
        paytrMerchantKey: settings.paytrMerchantKey,
        paytrMerchantSalt: settings.paytrMerchantSalt,
      });

      if (!result.success) {
        setError("Hedefler kaydedilemedi. Lütfen tekrar dene.");
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <BottomSheet open={open} onOpenChange={setOpen}>
      <BottomSheetTrigger asChild>{trigger}</BottomSheetTrigger>
      <BottomSheetContent title="Bu Ayki Hedeflerin">
        <div className="flex flex-col gap-4">
          <FormField label="Aylık Gelir Hedefi (₺)" htmlFor="monthly-revenue-target">
            <Input
              id="monthly-revenue-target"
              type="number"
              min={0}
              value={revenueTarget}
              onChange={(e) => setRevenueTarget(Number(e.target.value))}
            />
          </FormField>
          <FormField label="Aktif Danışan Hedefi" htmlFor="monthly-active-client-target">
            <Input
              id="monthly-active-client-target"
              type="number"
              min={0}
              value={activeClientTarget}
              onChange={(e) => setActiveClientTarget(Number(e.target.value))}
            />
          </FormField>
          <FormField label="Paket Yenileme Hedefi (%)" htmlFor="monthly-renewal-target">
            <Input
              id="monthly-renewal-target"
              type="number"
              min={0}
              max={100}
              value={renewalTargetPercent}
              onChange={(e) => setRenewalTargetPercent(Number(e.target.value))}
            />
          </FormField>

          {error && <Alert variant="error">{error}</Alert>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button variant="secondary" isLoading={isPending} onClick={handleSave}>
              {isPending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}

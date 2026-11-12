"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "../onboarding/actions";
import { updateExtendedSettings } from "./actions";
import { updateAccountProfile } from "@/lib/actions/account";
import type { AccountProfile, OnboardingRequest, TrainerSettingsResponse } from "@/lib/types";
import { buildInitialDayStates, toWorkingHourDtos, type DayState } from "@/components/trainer/workingHours";

export function useSettingsForm(initialSettings: TrainerSettingsResponse | null, initialProfile: AccountProfile | null) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const [expertiseArea] = useState(initialSettings?.expertiseArea ?? "Fitness");
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(initialSettings?.sessionDurationMinutes ?? 50);
  const [bufferDurationMinutes, setBufferDurationMinutes] = useState(initialSettings?.bufferDurationMinutes ?? 5);
  const [days, setDays] = useState<Record<number, DayState>>(() => buildInitialDayStates(initialSettings));

  const [bio, setBio] = useState(initialSettings?.bio ?? "");
  const [specialtiesText, setSpecialtiesText] = useState((initialSettings?.specialties ?? []).join(", "));
  const [yearsExperience, setYearsExperience] = useState(initialSettings?.yearsExperience ?? 0);
  const [city, setCity] = useState(initialProfile?.city ?? "");

  const [monthlyRevenueTarget, setMonthlyRevenueTarget] = useState(initialSettings?.monthlyRevenueTarget ?? 0);
  const [monthlyActiveClientTarget, setMonthlyActiveClientTarget] = useState(initialSettings?.monthlyActiveClientTarget ?? 0);
  const [monthlyRenewalTargetPercent, setMonthlyRenewalTargetPercent] = useState(initialSettings?.monthlyRenewalTargetPercent ?? 0);

  const [pushNotifications, setPushNotifications] = useState(initialSettings?.notifyPushEnabled ?? true);
  const [emailNotifications, setEmailNotifications] = useState(initialSettings?.notifyEmailEnabled ?? true);
  const [paymentNotifications, setPaymentNotifications] = useState(initialSettings?.notifyPaymentEnabled ?? true);

  const [paytrMerchantId, setPaytrMerchantId] = useState(initialSettings?.paytrMerchantId ?? "");
  const [paytrMerchantKey, setPaytrMerchantKey] = useState(initialSettings?.paytrMerchantKey ?? "");
  const [paytrMerchantSalt, setPaytrMerchantSalt] = useState(initialSettings?.paytrMerchantSalt ?? "");

  function handleSaveHours() {
    setErrors([]);
    setSaved(false);

    const payload: OnboardingRequest = {
      expertiseArea,
      sessionDurationMinutes,
      bufferDurationMinutes,
      workingHours: toWorkingHourDtos(days),
    };

    startTransition(async () => {
      const result = await completeOnboarding(payload);
      if (!result.success) {
        setErrors(result.errors);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  function handleSaveExtended() {
    setErrors([]);
    setSaved(false);

    const specialties = specialtiesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    startTransition(async () => {
      const [extendedResult, accountResult] = await Promise.all([
        updateExtendedSettings({
          bio,
          specialties,
          yearsExperience,
          monthlyRevenueTarget,
          monthlyActiveClientTarget,
          monthlyRenewalTargetPercent,
          notifyPushEnabled: pushNotifications,
          notifyEmailEnabled: emailNotifications,
          notifyPaymentEnabled: paymentNotifications,
          paytrMerchantId: paytrMerchantId || null,
          paytrMerchantKey: paytrMerchantKey || null,
          paytrMerchantSalt: paytrMerchantSalt || null,
        }),
        updateAccountProfile({
          phone: initialProfile?.phone ?? null,
          city: city || null,
          dateOfBirth: initialProfile?.dateOfBirth ?? null,
          heightCm: initialProfile?.heightCm ?? null,
        }),
      ]);

      if (!extendedResult.success || !accountResult.success) {
        setErrors(["Ayarlar kaydedilemedi. Lütfen tekrar dene."]);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return {
    isPending,
    errors,
    saved,
    sessionDurationMinutes,
    setSessionDurationMinutes,
    bufferDurationMinutes,
    setBufferDurationMinutes,
    days,
    setDays,
    bio,
    setBio,
    specialtiesText,
    setSpecialtiesText,
    yearsExperience,
    setYearsExperience,
    city,
    setCity,
    monthlyRevenueTarget,
    setMonthlyRevenueTarget,
    monthlyActiveClientTarget,
    setMonthlyActiveClientTarget,
    monthlyRenewalTargetPercent,
    setMonthlyRenewalTargetPercent,
    pushNotifications,
    setPushNotifications,
    emailNotifications,
    setEmailNotifications,
    paymentNotifications,
    setPaymentNotifications,
    paytrMerchantId,
    setPaytrMerchantId,
    paytrMerchantKey,
    setPaytrMerchantKey,
    paytrMerchantSalt,
    setPaytrMerchantSalt,
    handleSaveHours,
    handleSaveExtended,
  };
}

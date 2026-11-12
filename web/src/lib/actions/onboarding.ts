"use server";

import { authedFetch } from "@/lib/backend-client";
import { extractErrorMessage } from "@/lib/api-error";
import type { AccountProfile, UpdateAccountProfileRequest } from "@/lib/types";

export interface OnboardingActionResult {
  success: boolean;
  error: string | null;
}

export async function submitProfileStep(input: {
  heightCm: number;
  dateOfBirth: string;
  weightKg: number;
}): Promise<OnboardingActionResult> {
  const currentResult = await authedFetch<AccountProfile>("/api/account/me");
  if (!currentResult.ok || !currentResult.data) {
    return { success: false, error: "Profil bilgileri alınamadı." };
  }

  const payload: UpdateAccountProfileRequest = {
    phone: currentResult.data.phone,
    city: currentResult.data.city,
    dateOfBirth: input.dateOfBirth,
    heightCm: input.heightCm,
  };

  const [profileResult, weightResult] = await Promise.all([
    authedFetch("/api/account/me", { method: "PATCH", body: JSON.stringify(payload) }),
    authedFetch("/api/account/me/initial-weight", {
      method: "POST",
      body: JSON.stringify({ weightKg: input.weightKg }),
    }),
  ]);

  if (!profileResult.ok) return { success: false, error: extractErrorMessage(profileResult.data) };
  if (!weightResult.ok) return { success: false, error: extractErrorMessage(weightResult.data) };
  return { success: true, error: null };
}

export async function requestEmailActivation(email: string): Promise<OnboardingActionResult> {
  const result = await authedFetch("/api/account/me/email", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return { success: result.ok, error: result.ok ? null : extractErrorMessage(result.data) };
}

export async function confirmEmailActivation(code: string): Promise<OnboardingActionResult> {
  const result = await authedFetch("/api/account/me/email/confirm", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  return { success: result.ok, error: result.ok ? null : extractErrorMessage(result.data) };
}

"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/backend-client";
import type { OnboardingRequest } from "@/lib/types";

export interface OnboardingActionResult {
  success: boolean;
  errors: string[];
}

export async function completeOnboarding(payload: OnboardingRequest): Promise<OnboardingActionResult> {
  const result = await authedFetch<{ errors?: string[] }>("/api/trainers/me/onboarding", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    return { success: false, errors: result.data?.errors ?? ["Bir şeyler ters gitti."] };
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  revalidatePath("/calendar");
  return { success: true, errors: [] };
}

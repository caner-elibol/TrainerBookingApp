"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/backend-client";
import type { AccountProfile, UpdateAccountProfileRequest } from "@/lib/types";

export interface AccountActionResult {
  success: boolean;
  profile: AccountProfile | null;
}

export async function updateAccountProfile(payload: UpdateAccountProfileRequest): Promise<AccountActionResult> {
  const result = await authedFetch<AccountProfile>("/api/account/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    return { success: false, profile: null };
  }

  revalidatePath("/account");
  revalidatePath("/settings");
  revalidatePath("/clients");
  return { success: true, profile: result.data };
}

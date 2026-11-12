"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/backend-client";
import { extractErrorMessage } from "@/lib/api-error";
import type { MarkPaymentPaidRequest } from "@/lib/types";

export interface MarkPaymentPaidActionResult {
  success: boolean;
  error?: string;
}

export async function markPaymentPaid(paymentId: string, payload: MarkPaymentPaidRequest): Promise<MarkPaymentPaidActionResult> {
  const result = await authedFetch(`/api/trainers/me/payments/${paymentId}/mark-paid`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    return { success: false, error: extractErrorMessage(result.data) };
  }

  revalidatePath("/payments");
  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/backend-client";

export interface CancelActionResult {
  success: boolean;
  error?: string;
}

export async function cancelAppointment(appointmentId: string): Promise<CancelActionResult> {
  const result = await authedFetch<{ error?: string }>(`/api/appointments/${appointmentId}/cancel`, {
    method: "POST",
  });

  if (!result.ok) {
    return { success: false, error: result.data?.error ?? "Bir şeyler ters gitti." };
  }

  revalidatePath("/appointments");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { success: true };
}

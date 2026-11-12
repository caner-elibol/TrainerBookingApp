"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/backend-client";
import { extractErrorMessage } from "@/lib/api-error";
import type { CreateClientRequest, CreateClientResponse } from "@/lib/types";

export interface CreateClientActionResult {
  success: boolean;
  error: string | null;
  clientId: string | null;
  inviteToken: string | null;
}

export async function createClient(payload: CreateClientRequest): Promise<CreateClientActionResult> {
  const result = await authedFetch<CreateClientResponse>("/api/trainers/me/clients", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!result.ok || !result.data) {
    return { success: false, error: extractErrorMessage(result.data), clientId: null, inviteToken: null };
  }

  revalidatePath("/clients");
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { success: true, error: null, clientId: result.data.clientId, inviteToken: result.data.inviteToken };
}

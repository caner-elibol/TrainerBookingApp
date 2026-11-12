"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/backend-client";
import { extractErrorMessage } from "@/lib/api-error";
import type {
  AssignPackageRequest,
  AssignPackageResponse,
  BodyMetric,
  ClientGoal,
  ClientNote,
  CreateBodyMetricRequest,
  CreateClientGoalRequest,
  CreateClientNoteRequest,
  MarkPaymentPaidRequest,
} from "@/lib/types";

export interface MarkPaymentPaidActionResult {
  success: boolean;
  error?: string;
}

export async function markPaymentPaid(
  clientId: string,
  paymentId: string,
  payload: MarkPaymentPaidRequest,
): Promise<MarkPaymentPaidActionResult> {
  const result = await authedFetch(`/api/trainers/me/payments/${paymentId}/mark-paid`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    return { success: false, error: extractErrorMessage(result.data) };
  }

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export interface AssignPackageActionResult {
  success: boolean;
  error?: string;
}

export async function assignPackage(clientId: string, payload: AssignPackageRequest): Promise<AssignPackageActionResult> {
  const result = await authedFetch<AssignPackageResponse>(`/api/trainers/me/clients/${clientId}/packages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    return { success: false, error: extractErrorMessage(result.data) };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  return { success: true };
}

export interface GoalActionResult {
  success: boolean;
  error?: string;
  goal?: ClientGoal;
}

export async function createClientGoal(clientId: string, payload: CreateClientGoalRequest): Promise<GoalActionResult> {
  const result = await authedFetch<ClientGoal>(`/api/trainers/me/clients/${clientId}/goals`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!result.ok || !result.data) {
    return { success: false, error: "Hedef eklenemedi." };
  }

  revalidatePath(`/clients/${clientId}`);
  return { success: true, goal: result.data };
}

export interface NoteActionResult {
  success: boolean;
  error?: string;
  note?: ClientNote;
}

export async function createClientNote(clientId: string, payload: CreateClientNoteRequest): Promise<NoteActionResult> {
  const result = await authedFetch<ClientNote>(`/api/trainers/me/clients/${clientId}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!result.ok || !result.data) {
    return { success: false, error: "Not eklenemedi." };
  }

  revalidatePath(`/clients/${clientId}`);
  return { success: true, note: result.data };
}

export interface BodyMetricActionResult {
  success: boolean;
  error?: string;
  metric?: BodyMetric;
}

export async function createBodyMetric(clientId: string, payload: CreateBodyMetricRequest): Promise<BodyMetricActionResult> {
  const result = await authedFetch<BodyMetric>(`/api/trainers/me/clients/${clientId}/body-metrics`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!result.ok || !result.data) {
    return { success: false, error: "Ölçüm eklenemedi." };
  }

  revalidatePath(`/clients/${clientId}`);
  return { success: true, metric: result.data };
}

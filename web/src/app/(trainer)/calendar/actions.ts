"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/backend-client";
import { extractErrorMessage } from "@/lib/api-error";
import type { BookForClientRequest, BookForClientResponse } from "@/lib/types";

export interface AttendanceActionResult {
  success: boolean;
  error: string | null;
}

export async function markAttendance(appointmentId: string, attended: boolean): Promise<AttendanceActionResult> {
  const result = await authedFetch(`/api/trainers/me/appointments/${appointmentId}/attendance`, {
    method: "PATCH",
    body: JSON.stringify({ attended }),
  });

  if (!result.ok) {
    return { success: false, error: extractErrorMessage(result.data) };
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  return { success: true, error: null };
}

export interface BookForClientActionResult {
  success: boolean;
  error: string | null;
  appointmentId: string | null;
}

export async function bookForClient(clientId: string, payload: BookForClientRequest): Promise<BookForClientActionResult> {
  const result = await authedFetch<BookForClientResponse>(`/api/trainers/me/clients/${clientId}/appointments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!result.ok || !result.data) {
    return { success: false, error: extractErrorMessage(result.data), appointmentId: null };
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath(`/clients/${clientId}`);
  return { success: true, error: null, appointmentId: result.data.appointmentId };
}

export interface SetDayClosedActionResult {
  success: boolean;
  error: string | null;
}

export async function setDayClosed(dateIso: string, closed: boolean): Promise<SetDayClosedActionResult> {
  const result = await authedFetch(`/api/trainers/me/calendar/day-status?date=${dateIso}`, {
    method: "PUT",
    body: JSON.stringify({ closed }),
  });

  if (!result.ok) {
    return { success: false, error: extractErrorMessage(result.data) };
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { success: true, error: null };
}

export interface CancelAppointmentActionResult {
  success: boolean;
  error: string | null;
}

export async function cancelAppointment(
  appointmentId: string,
  refundSession: boolean,
): Promise<CancelAppointmentActionResult> {
  const result = await authedFetch(`/api/appointments/${appointmentId}/cancel?refundSession=${refundSession}`, {
    method: "POST",
  });

  if (!result.ok) {
    return { success: false, error: extractErrorMessage(result.data) };
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  return { success: true, error: null };
}

export interface CancelRemainingActionResult {
  success: boolean;
  error: string | null;
  cancelledCount: number | null;
}

export async function cancelRemainingAppointments(dateIso: string): Promise<CancelRemainingActionResult> {
  const result = await authedFetch<{ cancelledCount: number }>(`/api/trainers/me/calendar/cancel-remaining?date=${dateIso}`, {
    method: "POST",
  });

  if (!result.ok || !result.data) {
    return { success: false, error: extractErrorMessage(result.data), cancelledCount: null };
  }

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { success: true, error: null, cancelledCount: result.data.cancelledCount };
}

"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/backend-client";
import { extractErrorMessage } from "@/lib/api-error";
import type { CreateLocationRequest, SetTravelTimeRequest, TrainerLocation, UpdateExtendedSettingsRequest } from "@/lib/types";

export async function updateExtendedSettings(payload: UpdateExtendedSettingsRequest): Promise<{ success: boolean }> {
  const result = await authedFetch("/api/trainers/me/settings/extended", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    return { success: false };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/pt", "layout");
  return { success: true };
}

export interface LocationActionResult {
  success: boolean;
  error: string | null;
}

export async function createLocation(name: string): Promise<LocationActionResult> {
  const result = await authedFetch<TrainerLocation>("/api/trainers/me/locations", {
    method: "POST",
    body: JSON.stringify({ name } satisfies CreateLocationRequest),
  });

  if (!result.ok) return { success: false, error: extractErrorMessage(result.data) };

  revalidatePath("/settings");
  revalidatePath("/pt", "layout");
  return { success: true, error: null };
}

export async function deleteLocation(locationId: string): Promise<LocationActionResult> {
  const result = await authedFetch(`/api/trainers/me/locations/${locationId}`, { method: "DELETE" });

  if (!result.ok) return { success: false, error: extractErrorMessage(result.data) };

  revalidatePath("/settings");
  revalidatePath("/pt", "layout");
  return { success: true, error: null };
}

export async function setLocationTravelTime(
  locationId: string,
  otherLocationId: string,
  minutes: number,
): Promise<LocationActionResult> {
  const result = await authedFetch(`/api/trainers/me/locations/${locationId}/travel-times`, {
    method: "PUT",
    body: JSON.stringify({ otherLocationId, minutes } satisfies SetTravelTimeRequest),
  });

  if (!result.ok) return { success: false, error: extractErrorMessage(result.data) };

  revalidatePath("/settings");
  return { success: true, error: null };
}

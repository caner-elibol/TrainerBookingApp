"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/backend-client";
import type { CreatePackageRequest, PackageDto, UpdatePackageRequest } from "@/lib/types";

export interface PackageActionResult {
  success: boolean;
  error?: string;
  package?: PackageDto;
}

export async function createPackage(payload: CreatePackageRequest): Promise<PackageActionResult> {
  const result = await authedFetch<PackageDto>("/api/packages", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!result.ok || !result.data) {
    return { success: false, error: "Failed to create package." };
  }

  revalidatePath("/packages");
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { success: true, package: result.data };
}

export async function updatePackage(packageId: string, payload: UpdatePackageRequest): Promise<PackageActionResult> {
  const result = await authedFetch<PackageDto>(`/api/packages/${packageId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!result.ok || !result.data) {
    return { success: false, error: "Failed to update package." };
  }

  revalidatePath("/packages");
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { success: true, package: result.data };
}

export async function deactivatePackage(packageId: string): Promise<PackageActionResult> {
  const result = await authedFetch(`/api/packages/${packageId}/deactivate`, {
    method: "PATCH",
  });

  if (!result.ok) {
    return { success: false, error: "Failed to deactivate package." };
  }

  revalidatePath("/packages");
  revalidatePath("/clients");
  revalidatePath("/dashboard");
  return { success: true };
}

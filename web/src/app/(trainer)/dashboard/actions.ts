"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/backend-client";

export interface UpdateSlugActionResult {
  success: boolean;
  error?: string;
  slug?: string;
}

export async function updateCalendarSlug(slug: string): Promise<UpdateSlugActionResult> {
  const result = await authedFetch<{ error?: string; slug?: string }>("/api/trainers/me/calendar-slug", {
    method: "PATCH",
    body: JSON.stringify({ slug }),
  });

  if (!result.ok) {
    return { success: false, error: result.data?.error ?? "Bir şeyler ters gitti." };
  }

  revalidatePath("/dashboard");
  return { success: true, slug: result.data?.slug };
}

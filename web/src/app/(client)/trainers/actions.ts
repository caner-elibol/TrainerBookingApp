"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/backend-client";
import type { Review, UpsertReviewRequest } from "@/lib/types";

export interface ReviewActionResult {
  success: boolean;
  review?: Review;
}

export async function upsertTrainerReview(trainerId: string, payload: UpsertReviewRequest): Promise<ReviewActionResult> {
  const result = await authedFetch<Review>(`/api/trainers/${trainerId}/my-review`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!result.ok || !result.data) {
    return { success: false };
  }

  revalidatePath("/my-packages");
  return { success: true, review: result.data };
}

"use server";

import { authedFetch } from "@/lib/backend-client";

export interface PurchaseActionResult {
  success: boolean;
  error?: string;
  merchantOid?: string;
  iframeToken?: string;
}

export async function purchasePackage(packageId: string): Promise<PurchaseActionResult> {
  const result = await authedFetch<{ error?: string; merchantOid?: string; iframeToken?: string }>(
    "/api/payments/purchase",
    {
      method: "POST",
      body: JSON.stringify({ packageId }),
    },
  );

  if (!result.ok) {
    return { success: false, error: result.data?.error ?? "Bir şeyler ters gitti." };
  }

  return { success: true, merchantOid: result.data?.merchantOid, iframeToken: result.data?.iframeToken };
}

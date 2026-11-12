"use client";

import { useState, useTransition } from "react";
import { purchasePackage } from "./actions";
import Button from "@/components/ui/Button";
import ButtonLink from "@/components/ui/ButtonLink";

export default function PurchaseButton({
  packageId,
  slug,
  canPurchase,
}: {
  packageId: string;
  slug: string;
  canPurchase: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!canPurchase) {
    return (
      <ButtonLink href={`/login?redirect=${encodeURIComponent(`/pt/${slug}`)}`} variant="secondary" className="w-full">
        Satın almak için giriş yap
      </ButtonLink>
    );
  }

  function handlePurchase() {
    setResult(null);
    startTransition(async () => {
      const outcome = await purchasePackage(packageId);
      setResult(
        outcome.success
          ? { success: true, message: `Satın alma başlatıldı (sipariş ${outcome.merchantOid}).` }
          : { success: false, message: outcome.error ?? "Bir şeyler ters gitti." },
      );
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button variant="secondary" className="w-full" isLoading={isPending} onClick={handlePurchase}>
        {isPending ? "İşleniyor…" : "Satın Al"}
      </Button>
      {result && (
        <p
          role="status"
          aria-live="polite"
          className={`text-center text-xs ${result.success ? "text-success-600" : "text-error-600"}`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}

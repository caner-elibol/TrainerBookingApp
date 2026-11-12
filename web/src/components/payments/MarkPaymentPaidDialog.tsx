"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import type { PaymentMethod } from "@/lib/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import FormField from "@/components/ui/FormField";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function MarkPaymentPaidDialog({
  packageTitle,
  amount,
  onConfirm,
  onConfirmed,
}: {
  packageTitle: string;
  amount: number;
  onConfirm: (method: PaymentMethod) => Promise<{ success: boolean; error?: string }>;
  onConfirmed?: (method: PaymentMethod) => void;
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await onConfirm(method);
      if (!result.success) {
        setError(result.error ?? "Ödeme onaylanamadı.");
        return;
      }
      setOpen(false);
      onConfirmed?.(method);
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Ödeme Alındı
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setError(null);
        }}
      >
        <DialogContent>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success-600" />
            Ödeme Alındı Olarak İşaretle
          </DialogTitle>
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-sm text-ink-secondary">
              <span className="font-semibold text-foreground">{packageTitle}</span> paketi için ₺{amount.toLocaleString("tr-TR")}{" "}
              ödemenin nasıl alındığını seç.
            </p>
            <FormField label="Ödeme Yöntemi" htmlFor="mark-paid-method">
              <Select id="mark-paid-method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                <option value="Cash">Nakit/Elden</option>
                <option value="BankTransfer">IBAN</option>
              </Select>
            </FormField>

            {error && <Alert variant="error">{error}</Alert>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                İptal
              </Button>
              <Button variant="secondary" isLoading={isPending} onClick={handleConfirm}>
                {isPending ? "Kaydediliyor…" : "Onayla"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

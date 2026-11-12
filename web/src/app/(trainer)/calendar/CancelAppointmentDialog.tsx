"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import Button, { BUTTON_BASE_CLASSES, BUTTON_SIZE_CLASSES } from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

export default function CancelAppointmentDialog({
  open,
  onOpenChange,
  clientName,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  isPending: boolean;
  onConfirm: (refundSession: boolean) => void;
}) {
  const [pendingChoice, setPendingChoice] = useState<boolean | null>(null);

  function handleChoice(refundSession: boolean) {
    setPendingChoice(refundSession);
    onConfirm(refundSession);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Randevuyu iptal et</DialogTitle>
        <DialogDescription className="break-words">
          {clientName} ile olan randevu iptal edilecek. Paket hakkını ne yapmak istersin?
        </DialogDescription>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleChoice(false)}
            disabled={isPending}
            className={cn(
              BUTTON_BASE_CLASSES,
              BUTTON_SIZE_CLASSES.md,
              "w-full whitespace-normal bg-error-600 text-white hover:bg-error-700 focus-visible:ring-error-600",
            )}
          >
            {isPending && pendingChoice === false && <Spinner size={16} />}
            Paket hakkını düş ve iptal et
          </button>
          <Button
            variant="outline"
            className="w-full whitespace-normal"
            disabled={isPending}
            isLoading={isPending && pendingChoice === true}
            onClick={() => handleChoice(true)}
          >
            Paket hakkını iade et ve iptal et
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Vazgeç
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

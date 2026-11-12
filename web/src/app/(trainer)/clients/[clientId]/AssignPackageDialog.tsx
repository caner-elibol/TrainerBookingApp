"use client";

import { useState, useTransition } from "react";
import { Plus, RotateCw } from "lucide-react";
import { assignPackage } from "./actions";
import type { PackageDto } from "@/lib/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function AssignPackageDialog({
  clientId,
  packages,
  variant = "default",
}: {
  clientId: string;
  packages: PackageDto[];
  variant?: "default" | "renewal";
}) {
  const [open, setOpen] = useState(false);
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");
  const [sessionCount, setSessionCount] = useState<number | "">(packages[0]?.sessionCount ?? "");
  const [paymentStatus, setPaymentStatus] = useState<"Pending" | "Paid">("Pending");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "BankTransfer">("Cash");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setPackageId(packages[0]?.id ?? "");
    setSessionCount(packages[0]?.sessionCount ?? "");
    setPaymentStatus("Pending");
    setPaymentMethod("Cash");
    setError(null);
  }

  function handlePackageChange(value: string) {
    setPackageId(value);
    const selected = packages.find((p) => p.id === value);
    setSessionCount(selected ? selected.sessionCount : "");
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await assignPackage(clientId, {
        packageId,
        sessionCount: Number(sessionCount) || 0,
        isPaid: paymentStatus === "Paid",
        method: paymentStatus === "Paid" ? paymentMethod : null,
      });

      if (!result.success) {
        setError(result.error ?? "Paket eklenemedi.");
        return;
      }

      setOpen(false);
      reset();
    });
  }

  return (
    <>
      {variant === "renewal" ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen(true)}
          disabled={packages.length === 0}
          title={packages.length === 0 ? "Önce bir paket oluşturmalısın." : undefined}
        >
          <RotateCw className="h-3.5 w-3.5" />
          Paket Yenilemeyi Hatırlat
        </Button>
      ) : (
        <Button
          variant="secondary"
          onClick={() => setOpen(true)}
          disabled={packages.length === 0}
          title={packages.length === 0 ? "Önce bir paket oluşturmalısın." : undefined}
        >
          <Plus className="h-4 w-4" />
          Paket Ekle
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent>
          <DialogTitle>Paket Ekle</DialogTitle>
          <div className="mt-4 flex flex-col gap-4">
            <FormField label="Paket" htmlFor="assign-package-id">
              <Select id="assign-package-id" value={packageId} onChange={(e) => handlePackageChange(e.target.value)}>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.title} ({pkg.sessionCount} seans)
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Seans Sayısı" htmlFor="assign-package-session-count">
              <Input
                id="assign-package-session-count"
                type="number"
                min={1}
                value={sessionCount}
                onChange={(e) => setSessionCount(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </FormField>
            <FormField label="Ödeme Durumu" htmlFor="assign-package-payment-status">
              <Select
                id="assign-package-payment-status"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as "Pending" | "Paid")}
              >
                <option value="Pending">Ödeme Bekliyor</option>
                <option value="Paid">Ödendi</option>
              </Select>
            </FormField>
            {paymentStatus === "Paid" && (
              <FormField label="Ödeme Yöntemi" htmlFor="assign-package-payment-method">
                <Select
                  id="assign-package-payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as "Cash" | "BankTransfer")}
                >
                  <option value="Cash">Nakit/Elden</option>
                  <option value="BankTransfer">IBAN</option>
                </Select>
              </FormField>
            )}

            {error && <Alert variant="error">{error}</Alert>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                İptal
              </Button>
              <Button variant="secondary" disabled={!packageId || !sessionCount} isLoading={isPending} onClick={handleSubmit}>
                {isPending ? "Ekleniyor…" : "Paketi Ekle"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

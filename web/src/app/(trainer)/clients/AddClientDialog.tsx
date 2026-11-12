"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Plus, UserPlus } from "lucide-react";
import { createClient } from "./actions";
import type { PackageDto } from "@/lib/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import PhoneInput from "@/components/ui/PhoneInput";
import { PHONE_INVALID_MESSAGE, normalizePhone } from "@/lib/phone";

const NO_PACKAGE = "__none__";

export default function AddClientDialog({
  packages,
  defaultOpen = false,
}: {
  packages: PackageDto[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [packageId, setPackageId] = useState(NO_PACKAGE);
  const [sessionCount, setSessionCount] = useState<number | "">("");
  const [paymentStatus, setPaymentStatus] = useState<"Pending" | "Paid">("Pending");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "BankTransfer">("Cash");
  const [error, setError] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = inviteToken ? `${origin}/invite/${inviteToken}` : "";

  function reset() {
    setFullName("");
    setPhone("");
    setPackageId(NO_PACKAGE);
    setSessionCount("");
    setPaymentStatus("Pending");
    setPaymentMethod("Cash");
    setError(null);
    setInviteToken(null);
    setCopied(false);
  }

  function handlePackageChange(value: string) {
    setPackageId(value);
    const selected = packages.find((p) => p.id === value);
    setSessionCount(selected ? selected.sessionCount : "");
  }

  function handleSubmit() {
    setError(null);
    const normalizedPhone = phone.trim() ? normalizePhone(phone) : null;
    if (phone.trim() && !normalizedPhone) {
      setError(PHONE_INVALID_MESSAGE);
      return;
    }
    startTransition(async () => {
      const hasPackage = packageId !== NO_PACKAGE;
      const result = await createClient({
        fullName: fullName.trim(),
        phone: normalizedPhone,
        packageId: hasPackage ? packageId : null,
        sessionCount: hasPackage ? Number(sessionCount) || null : null,
        isPaid: hasPackage && paymentStatus === "Paid",
        method: hasPackage && paymentStatus === "Paid" ? paymentMethod : null,
      });

      if (!result.success || !result.inviteToken) {
        setError(result.error ?? "Danışan oluşturulamadı.");
        return;
      }

      setInviteToken(result.inviteToken);
    });
  }

  function handleCopy() {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Danışan Ekle
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent>
          {!inviteToken ? (
            <>
              <DialogTitle>Yeni Danışan</DialogTitle>
              <div className="mt-4 flex flex-col gap-4">
                <FormField label="Ad Soyad" htmlFor="new-client-name">
                  <Input id="new-client-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </FormField>
                <FormField label="Telefon" htmlFor="new-client-phone">
                  <PhoneInput id="new-client-phone" value={phone} onValueChange={setPhone} />
                </FormField>
                <FormField label="Paket (opsiyonel)" htmlFor="new-client-package">
                  <Select id="new-client-package" value={packageId} onChange={(e) => handlePackageChange(e.target.value)}>
                    <option value={NO_PACKAGE}>Paket seçilmedi</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.title} ({pkg.sessionCount} seans)
                      </option>
                    ))}
                  </Select>
                </FormField>
                {packageId !== NO_PACKAGE && (
                  <>
                    <FormField label="Seans Sayısı" htmlFor="new-client-session-count">
                      <Input
                        id="new-client-session-count"
                        type="number"
                        min={1}
                        value={sessionCount}
                        onChange={(e) => setSessionCount(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </FormField>
                    <FormField label="Ödeme Durumu" htmlFor="new-client-payment-status">
                      <Select
                        id="new-client-payment-status"
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value as "Pending" | "Paid")}
                      >
                        <option value="Pending">Ödeme Bekliyor</option>
                        <option value="Paid">Ödendi</option>
                      </Select>
                    </FormField>
                    {paymentStatus === "Paid" && (
                      <FormField label="Ödeme Yöntemi" htmlFor="new-client-payment-method">
                        <Select
                          id="new-client-payment-method"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as "Cash" | "BankTransfer")}
                        >
                          <option value="Cash">Nakit/Elden</option>
                          <option value="BankTransfer">IBAN</option>
                        </Select>
                      </FormField>
                    )}
                  </>
                )}

                {error && <Alert variant="error">{error}</Alert>}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    İptal
                  </Button>
                  <Button variant="secondary" disabled={!fullName.trim()} isLoading={isPending} onClick={handleSubmit}>
                    {isPending ? "Oluşturuluyor…" : "Danışan Oluştur"}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-ink" />
                Danışan Oluşturuldu
              </DialogTitle>
              <div className="mt-4 flex flex-col gap-3">
                <p className="text-sm text-ink-secondary">
                  Bu bağlantıyı danışanınla paylaş; şifresini belirleyip profilini tamamlayabilir.
                </p>
                <code className="truncate rounded-lg bg-subtle px-3 py-2 text-xs text-ink">{inviteLink}</code>
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Kopyalandı!" : "Bağlantıyı Kopyala"}
                </Button>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Kapat
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

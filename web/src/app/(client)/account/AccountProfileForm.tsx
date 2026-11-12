"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AccountProfile } from "@/lib/types";
import { updateAccountProfile } from "@/lib/actions/account";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import PhoneInput from "@/components/ui/PhoneInput";
import { formatPhone, normalizePhone } from "@/lib/phone";

export default function AccountProfileForm({ profile }: { profile: AccountProfile | null }) {
  const router = useRouter();
  const [phone, setPhone] = useState(formatPhone(profile?.phone));
  const [city, setCity] = useState(profile?.city ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth ?? "");
  const [heightCm, setHeightCm] = useState(profile?.heightCm != null ? String(profile.heightCm) : "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  function handleSave() {
    setSaved(false);
    setError(false);
    setPhoneError(false);
    const normalizedPhone = phone.trim() ? normalizePhone(phone) : null;
    if (phone.trim() && !normalizedPhone) {
      setPhoneError(true);
      return;
    }
    startTransition(async () => {
      const result = await updateAccountProfile({
        phone: normalizedPhone,
        city: city.trim() || null,
        dateOfBirth: dateOfBirth || null,
        heightCm: heightCm.trim() ? Number(heightCm) : null,
      });
      if (!result.success) {
        setError(true);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Telefon</span>
        <PhoneInput value={phone} onValueChange={setPhone} invalid={phoneError} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Şehir</span>
        <Input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="İstanbul, Türkiye" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Doğum Tarihi</span>
        <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Boy (cm)</span>
        <Input type="number" min={100} max={250} step="0.1" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
      </label>

      {error && <Alert variant="error">Kaydedilemedi. Lütfen tekrar dene.</Alert>}
      {saved && !isPending && <Alert variant="success">Bilgilerin kaydedildi.</Alert>}

      <Button type="button" variant="secondary" isLoading={isPending} onClick={handleSave} className="self-start">
        {isPending ? "Kaydediliyor…" : "Kaydet"}
      </Button>
    </div>
  );
}

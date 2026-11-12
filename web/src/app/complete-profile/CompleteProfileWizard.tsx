"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { requestEmailActivation, confirmEmailActivation } from "@/lib/actions/onboarding";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

type Step = "email" | "confirm";

export default function CompleteProfileWizard({ homeHref }: { homeHref: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestEmailActivation(email);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setStep("confirm");
    });
  }

  function handleConfirmSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await confirmEmailActivation(code);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(homeHref);
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">E-posta Ekle</CardTitle>
        <CardDescription>
          {step === "email" && "Adım 1/2 — E-posta adresin"}
          {step === "confirm" && "Adım 2/2 — Doğrulama kodu"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-ink-secondary">Randevu ve ödeme bildirimlerini e-postana da almak için adresini gir.</p>
            <FormField label="E-posta" htmlFor="onboarding-email">
              <Input
                id="onboarding-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </FormField>

            {error && <Alert variant="error">{error}</Alert>}

            <Button type="submit" variant="primary" isLoading={isPending} className="w-full">
              {isPending ? "Gönderiliyor…" : "Kod Gönder"}
            </Button>

            <Link href={homeHref} className="text-center text-sm font-medium text-ink-secondary underline">
              Şimdi değil, daha sonra ekle
            </Link>
          </form>
        )}

        {step === "confirm" && (
          <form onSubmit={handleConfirmSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-ink-secondary">{email} adresine gönderilen 6 haneli kodu gir.</p>
            <FormField label="Doğrulama Kodu" htmlFor="onboarding-code">
              <Input
                id="onboarding-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </FormField>

            {error && <Alert variant="error">{error}</Alert>}

            <Button type="submit" variant="primary" isLoading={isPending} className="w-full">
              {isPending ? "Doğrulanıyor…" : "Doğrula ve Bitir"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

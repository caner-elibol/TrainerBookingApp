"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { submitProfileStep } from "@/lib/actions/onboarding";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function ProfileDetailsForm({
  initialHeightCm,
  initialDateOfBirth,
}: {
  initialHeightCm: number | null;
  initialDateOfBirth: string | null;
}) {
  const router = useRouter();
  const [heightCm, setHeightCm] = useState(initialHeightCm?.toString() ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(initialDateOfBirth ?? "");
  const [weightKg, setWeightKg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitProfileStep({
        heightCm: Number(heightCm),
        dateOfBirth,
        weightKg: Number(weightKg),
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push("/home");
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Profilini Tamamla</CardTitle>
        <CardDescription>Boy, doğum tarihi ve kilo bilgilerini ekle.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Boy (cm)" htmlFor="profile-height">
            <Input
              id="profile-height"
              type="number"
              min={100}
              max={250}
              step="0.1"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Doğum Tarihi" htmlFor="profile-dob">
            <Input
              id="profile-dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Kilo (kg)" htmlFor="profile-weight">
            <Input
              id="profile-weight"
              type="number"
              min={20}
              max={300}
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              required
            />
          </FormField>

          {error && <Alert variant="error">{error}</Alert>}

          <Button type="submit" variant="primary" isLoading={isPending} className="w-full">
            {isPending ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

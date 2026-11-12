"use client";

import { useEffect } from "react";
import Link from "next/link";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center gap-6 px-4">
      <Alert variant="error" title="Bir şeyler ters gitti.">
        Beklenmedik bir hata oluştu. Lütfen tekrar dene.
      </Alert>
      <div className="flex gap-3">
        <Button variant="primary" onClick={reset}>
          Tekrar Dene
        </Button>
        <Link href="/" className="inline-flex items-center text-sm font-medium text-ink underline">
          Ana Sayfaya Dön
        </Link>
      </div>
    </main>
  );
}

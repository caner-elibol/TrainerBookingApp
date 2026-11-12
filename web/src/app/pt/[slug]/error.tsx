"use client";

import { useEffect } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

export default function TrainerProfileError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Trainer profile page failed to load:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center gap-6 px-4 py-12">
      <Alert
        variant="error"
        title="Bir şeyler ters gitti."
        action={
          <Button variant="secondary" size="sm" onClick={reset}>
            Tekrar Dene
          </Button>
        }
      >
        Bu sayfayı yüklerken bir sorun oluştu.
      </Alert>
    </main>
  );
}

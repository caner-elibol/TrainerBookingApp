"use client";

import { useEffect } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";

export default function RouteErrorState({
  error,
  reset,
  title = "Bir şeyler ters gitti.",
  description = "Verileri yüklerken bir sorun oluştu.",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col gap-4 py-6">
      <Alert
        variant="error"
        title={title}
        action={
          <Button variant="secondary" size="sm" onClick={reset}>
            Tekrar Dene
          </Button>
        }
      >
        {description}
      </Alert>
    </div>
  );
}

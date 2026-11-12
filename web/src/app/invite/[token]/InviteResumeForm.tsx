"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { extractErrorMessage } from "@/lib/api-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import Spinner from "@/components/ui/Spinner";

type Status = "checking" | "error";

export default function InviteResumeForm({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/auth/invite/${encodeURIComponent(token)}/resume`, { method: "POST" })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (cancelled) return;

        if (!res.ok) {
          setError(extractErrorMessage(data));
          setStatus("error");
          return;
        }

        router.push(data?.isNewAccount ? "/complete-profile" : "/appointments");
        router.refresh();
      })
      .catch(() => {
        if (cancelled) return;
        setError("Bir şeyler ters gitti. Lütfen tekrar dene.");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-subtle px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Hesabına Hoş Geldin</CardTitle>
        </CardHeader>
        <CardContent>
          {status === "checking" && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}

          {status === "error" && <Alert variant="error">{error ?? "Bu davet bağlantısı geçersiz veya süresi dolmuş."}</Alert>}
        </CardContent>
      </Card>
    </main>
  );
}

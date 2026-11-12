"use client";

import RouteErrorState from "@/components/ui/RouteErrorState";

export default function AccountError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorState error={error} reset={reset} description="Hesap bilgilerini yüklerken bir sorun oluştu." />;
}

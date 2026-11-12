"use client";

import RouteErrorState from "@/components/ui/RouteErrorState";

export default function PaymentsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorState error={error} reset={reset} description="Ödemelerini yüklerken bir sorun oluştu." />;
}

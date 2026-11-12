"use client";

import RouteErrorState from "@/components/ui/RouteErrorState";

export default function ClientDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorState error={error} reset={reset} description="Danışan bilgilerini yüklerken bir sorun oluştu." />;
}

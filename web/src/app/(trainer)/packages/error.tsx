"use client";

import RouteErrorState from "@/components/ui/RouteErrorState";

export default function PackagesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorState error={error} reset={reset} description="Paketlerini yüklerken bir sorun oluştu." />;
}

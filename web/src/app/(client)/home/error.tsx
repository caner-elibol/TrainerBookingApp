"use client";

import RouteErrorState from "@/components/ui/RouteErrorState";

export default function ClientHomeError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorState error={error} reset={reset} description="Panelini yüklerken bir sorun oluştu." />;
}

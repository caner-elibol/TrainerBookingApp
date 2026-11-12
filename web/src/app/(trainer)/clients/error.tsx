"use client";

import RouteErrorState from "@/components/ui/RouteErrorState";

export default function ClientsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorState error={error} reset={reset} description="Danışanlarını yüklerken bir sorun oluştu." />;
}

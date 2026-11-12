"use client";

import RouteErrorState from "@/components/ui/RouteErrorState";

export default function CalendarError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorState error={error} reset={reset} description="Takvimini yüklerken bir sorun oluştu." />;
}

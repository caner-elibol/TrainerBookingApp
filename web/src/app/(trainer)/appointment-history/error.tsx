"use client";

import RouteErrorState from "@/components/ui/RouteErrorState";

export default function AppointmentHistoryError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorState error={error} reset={reset} description="Randevu geçmişini yüklerken bir sorun oluştu." />;
}

"use client";

import RouteErrorState from "@/components/ui/RouteErrorState";

export default function OnboardingError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorState error={error} reset={reset} description="Takvim kurulumunu yüklerken bir sorun oluştu." />;
}

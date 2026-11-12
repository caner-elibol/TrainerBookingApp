"use client";

import RouteErrorState from "@/components/ui/RouteErrorState";

export default function SettingsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorState error={error} reset={reset} description="Ayarlarını yüklerken bir sorun oluştu." />;
}

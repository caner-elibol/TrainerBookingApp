import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { LocationTravelTime, TrainerLocation } from "@/lib/types";
import SectionCard from "@/components/ui/SectionCard";
import SettingsSubHeader from "@/components/settings/SettingsSubHeader";
import LocationsSettings from "../LocationsSettings";

export default async function LocationsSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Trainer") redirect("/");

  const [locationsResult, travelTimesResult] = await Promise.all([
    authedFetch<TrainerLocation[]>("/api/trainers/me/locations"),
    authedFetch<LocationTravelTime[]>("/api/trainers/me/locations/travel-times"),
  ]);
  const locations = locationsResult.ok ? (locationsResult.data ?? []) : [];
  const travelTimes = travelTimesResult.ok ? (travelTimesResult.data ?? []) : [];

  return (
    <div className="flex flex-col gap-6">
      <SettingsSubHeader title="Konumlar" />
      <SectionCard>
        <LocationsSettings initialLocations={locations} initialTravelTimes={travelTimes} />
      </SectionCard>
    </div>
  );
}

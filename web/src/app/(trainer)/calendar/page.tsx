import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { TrainerAppointment, TrainerClientSummary, TrainerSettingsResponse } from "@/lib/types";
import PageHeader from "@/components/trainer/PageHeader";
import Button from "@/components/ui/Button";
import WeekCalendarGrid from "./WeekCalendarGrid";
import BookForClientDialog from "./BookForClientDialog";

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const { new: openNew } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Trainer") redirect("/");

  const [settingsResult, appointmentsResult, clientsResult] = await Promise.all([
    authedFetch<TrainerSettingsResponse>("/api/trainers/me/settings"),
    authedFetch<TrainerAppointment[]>("/api/trainers/me/appointments"),
    authedFetch<TrainerClientSummary[]>("/api/trainers/me/clients"),
  ]);

  const workingHours = settingsResult.ok ? (settingsResult.data?.workingHours ?? []) : [];
  const sessionDurationMinutes = settingsResult.data?.sessionDurationMinutes ?? 60;
  const bufferDurationMinutes = settingsResult.data?.bufferDurationMinutes ?? 0;
  const clients = clientsResult.ok ? (clientsResult.data ?? []) : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Takvim"
        subtitle="Randevularını yönet, gününü planla, daha fazla insana ilham ver."
        action={
          <BookForClientDialog
            trigger={
              <Button variant="secondary">
                <Plus className="h-4 w-4" />
                Randevu Ekle
              </Button>
            }
            clients={clients}
            defaultOpen={openNew === "1"}
          />
        }
      />

      <WeekCalendarGrid
        initialAppointments={appointmentsResult.data ?? []}
        workingHours={workingHours}
        sessionDurationMinutes={sessionDurationMinutes}
        bufferDurationMinutes={bufferDurationMinutes}
        clients={clients}
      />
    </div>
  );
}

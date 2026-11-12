import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { TrainerAppointment } from "@/lib/types";
import { addDays, isoDate } from "@/lib/date";
import PageHeader from "@/components/trainer/PageHeader";
import AppointmentHistoryList from "./AppointmentHistoryList";

const INITIAL_WINDOW_DAYS = 30;

export default async function AppointmentHistoryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Trainer") redirect("/");

  const today = new Date();
  const yesterday = addDays(today, -1);
  const initialFrom = addDays(today, -INITIAL_WINDOW_DAYS);

  const appointmentsResult = await authedFetch<TrainerAppointment[]>(
    `/api/trainers/me/appointments?from=${isoDate(initialFrom)}&to=${isoDate(yesterday)}`,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Randevu Geçmişi" subtitle="Geçmişte gerçekleşen, iptal edilen veya kaçırılan randevularını gözden geçir." />
      <AppointmentHistoryList
        initialAppointments={appointmentsResult.data ?? []}
        initialFromIso={isoDate(initialFrom)}
        windowDays={INITIAL_WINDOW_DAYS}
      />
    </div>
  );
}

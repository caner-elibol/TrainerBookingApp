import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { ClientAppointment } from "@/lib/types";
import PageHeader from "@/components/trainer/PageHeader";
import ButtonLink from "@/components/ui/ButtonLink";
import AppointmentsList from "./AppointmentsList";

export default async function AppointmentsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Client") redirect("/");

  const result = await authedFetch<ClientAppointment[]>("/api/appointments/me");
  const appointments = result.ok && result.data ? result.data : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Randevularım"
        subtitle="Tüm antrenman randevularını buradan görüntüleyebilir, yeni randevu oluşturabilirsin."
        action={
          <ButtonLink href="/my-packages" variant="secondary">
            <Plus className="h-4 w-4" />
            Yeni Randevu Al
          </ButtonLink>
        }
      />
      <AppointmentsList initialAppointments={appointments} />
    </div>
  );
}

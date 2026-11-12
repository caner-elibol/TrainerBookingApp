"use client";

import { useMemo, useState, useTransition } from "react";
import { MapPin, X } from "lucide-react";
import type { ClientAppointment } from "@/lib/types";
import { mockServiceFor } from "@/lib/fixtures/names";
import { cancelAppointment } from "./actions";
import { CARD_BASE_CLASSES } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import Alert from "@/components/ui/Alert";
import AvatarCircle from "@/components/ui/AvatarCircle";
import MiniCalendar from "@/components/ui/MiniCalendar";
import { cn } from "@/lib/cn";

const CANCELLATION_WINDOW_HOURS = 12;

function statusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "Confirmed":
      return "success";
    case "Cancelled":
    case "NoShow":
      return "error";
    default:
      return "gray";
  }
}

function statusLabelTr(status: string): string {
  switch (status) {
    case "Confirmed":
      return "Onaylandı";
    case "Cancelled":
      return "İptal Edildi";
    case "Completed":
      return "Tamamlandı";
    case "NoShow":
      return "Gelmedi";
    default:
      return status;
  }
}

type TabKey = "upcoming" | "past" | "cancelled";

function AppointmentCard({
  appointment,
  onCancelRequest,
  isCancelling,
  now,
}: {
  appointment: ClientAppointment;
  onCancelRequest: (appointment: ClientAppointment) => void;
  isCancelling: boolean;
  now: number;
}) {
  const hoursUntilStart = (new Date(appointment.startTimeUtc).getTime() - now) / (1000 * 60 * 60);
  const isUpcomingConfirmed = appointment.status === "Confirmed" && hoursUntilStart >= 0;
  const canCancel = isUpcomingConfirmed && hoursUntilStart >= CANCELLATION_WINDOW_HOURS;
  const start = new Date(appointment.startTimeUtc);
  const end = new Date(appointment.endTimeUtc);

  return (
    <div className={cn(CARD_BASE_CLASSES, "flex flex-col gap-4")}>
      <div className="flex shrink-0 flex-col items-center justify-center rounded-xl bg-subtle px-4 py-2 text-ink">
        <span className="text-2xl font-bold leading-none">{start.getDate()}</span>
        <span className="text-xs font-medium">{start.toLocaleDateString("tr-TR", { month: "short" })}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <AvatarCircle name={appointment.trainerName} size={36} />
            <div>
              <p className="text-sm font-bold text-foreground">{appointment.trainerName}</p>
              <p className="text-xs text-ink-secondary">Provider</p>
            </div>
          </div>
          <Badge variant={statusBadgeVariant(appointment.status)}>{statusLabelTr(appointment.status)}</Badge>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-secondary">
          <span>{mockServiceFor(appointment.id)}</span>
          <span>
            {start.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} –{" "}
            {end.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> CoreFit Stüdyo
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {canCancel && (
          <>
            <Button variant="danger" size="sm" onClick={() => onCancelRequest(appointment)} isLoading={isCancelling}>
              <X className="h-3.5 w-3.5" />
              İptal Et
            </Button>
            <p className="max-w-[160px] text-right text-[11px] text-ink-muted">Randevu saatine 12 saatten fazla süre var.</p>
          </>
        )}
        {isUpcomingConfirmed && !canCancel && (
          <p className="max-w-[160px] text-right text-[11px] text-ink-muted">
            Randevuna 12 saatten az kaldığı için iptal edilemez. Bir sorun varsa eğitmeninle iletişime geç.
          </p>
        )}
      </div>
    </div>
  );
}

export default function AppointmentsList({ initialAppointments }: { initialAppointments: ClientAppointment[] }) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ClientAppointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [now] = useState(() => Date.now());

  const { upcoming, past, cancelled } = useMemo(() => {
    const sorted = [...appointments].sort((a, b) => new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime());
    return {
      upcoming: sorted.filter((a) => a.status !== "Cancelled" && new Date(a.startTimeUtc).getTime() >= now),
      past: sorted.filter((a) => a.status !== "Cancelled" && new Date(a.startTimeUtc).getTime() < now).reverse(),
      cancelled: sorted.filter((a) => a.status === "Cancelled").reverse(),
    };
  }, [appointments, now]);

  const markedDates = useMemo(
    () => new Set(appointments.map((a) => new Date(a.startTimeUtc).toLocaleDateString("en-CA"))),
    [appointments],
  );

  const dateFilteredItems = useMemo(() => {
    if (!selectedDate) return null;
    return [...appointments]
      .filter((a) => new Date(a.startTimeUtc).toLocaleDateString("en-CA") === selectedDate)
      .sort((a, b) => new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime());
  }, [appointments, selectedDate]);

  function handleConfirmCancel() {
    if (!cancelTarget) return;
    const appointment = cancelTarget;
    setError(null);
    setBusyId(appointment.id);
    startTransition(async () => {
      const result = await cancelAppointment(appointment.id);
      setBusyId(null);
      setCancelTarget(null);

      if (!result.success) {
        setError(result.error ?? "Bir şeyler ters gitti.");
        return;
      }

      setAppointments((prev) => prev.map((a) => (a.id === appointment.id ? { ...a, status: "Cancelled" } : a)));
    });
  }

  if (appointments.length === 0) {
    return (
      <EmptyState
        title="Henüz randevun yok"
        description="Bir eğitmenle randevu aldığında burada görünecek."
      />
    );
  }

  const tabs: { key: TabKey; label: string; count: number; items: ClientAppointment[] }[] = [
    { key: "upcoming", label: "Yaklaşan", count: upcoming.length, items: upcoming },
    { key: "past", label: "Geçmiş", count: past.length, items: past },
    { key: "cancelled", label: "İptal", count: cancelled.length, items: cancelled },
  ];

  const activeItems = dateFilteredItems ?? tabs.find((t) => t.key === activeTab)?.items ?? [];

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="flex flex-col gap-4">
        {error && <Alert variant="error">{error}</Alert>}

        {dateFilteredItems ? (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-muted px-3 py-2">
            <p className="text-sm font-semibold text-foreground">
              {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
              <X className="h-3.5 w-3.5" /> Filtreyi Temizle
            </Button>
          </div>
        ) : (
          <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  activeTab === tab.key ? "bg-surface text-ink shadow-card" : "text-ink-secondary",
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        )}

        {activeItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-secondary">
            {dateFilteredItems ? "Bu tarihte randevu yok." : "Bu kategoride randevu yok."}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {activeItems.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onCancelRequest={setCancelTarget}
                isCancelling={isPending && busyId === appt.id}
                now={now}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <div className={CARD_BASE_CLASSES}>
          <MiniCalendar markedDates={markedDates} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>

        <div className="rounded-2xl bg-subtle p-5">
          <p className="text-sm font-bold text-foreground">Online randevu almak çok kolay!</p>
          <p className="mt-1 text-xs text-ink-secondary">Uygun saatleri görüntüleyip saniyeler içinde randevunu oluşturabilirsin.</p>
        </div>
      </div>

      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Bu randevuyu iptal etmek istiyor musun?"
        description="Bu işlem geri alınamaz."
        confirmLabel="Randevuyu İptal Et"
        variant="danger"
        isConfirming={isPending}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}

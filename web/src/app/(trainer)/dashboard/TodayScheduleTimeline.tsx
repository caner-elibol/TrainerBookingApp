"use client";

import { useState } from "react";
import { Coffee, Plus, TriangleAlert } from "lucide-react";
import type { TrainerAppointment, TrainerClientSummary, TrainerLocation } from "@/lib/types";
import type { ScheduleSlot } from "@/lib/scheduleSlots";
import { markAttendance } from "../calendar/actions";
import BookForClientDialog from "../calendar/BookForClientDialog";
import AvatarCircle from "@/components/ui/AvatarCircle";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export type TodaySlot =
  | { slot: ScheduleSlot; kind: "booked"; appointment: TrainerAppointment }
  | {
      slot: ScheduleSlot;
      kind: "available";
      startTimeUtc: string;
      validLocations: TrainerLocation[];
      restricted: boolean;
    }
  | { slot: ScheduleSlot; kind: "break" };

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
      return "İptal edildi";
    case "Completed":
      return "Tamamlandı";
    case "NoShow":
      return "Gelmedi";
    default:
      return status;
  }
}

export default function TodayScheduleTimeline({
  slots,
  todayIso,
  clients,
}: {
  slots: TodaySlot[];
  todayIso: string;
  clients: TrainerClientSummary[];
}) {
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  if (slots.length === 0) {
    return <p className="text-sm text-ink-secondary">Bugün için planlanmış çalışma saati yok.</p>;
  }
function addPreviousSlotDuration(
  current: ScheduleSlot,
  previous: ScheduleSlot,
): string {
  const currentMinutes = current.hour * 60 + current.minute;
  const previousMinutes = previous.hour * 60 + previous.minute;

  const duration = currentMinutes - previousMinutes;
  const endMinutes = currentMinutes + duration;

  const endHour = Math.floor(endMinutes / 60);
  const endMinute = endMinutes % 60;

  return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
}
  function handleAttendance(appointmentId: string, attended: boolean) {
    setPending(appointmentId);
    markAttendance(appointmentId, attended)
      .then((result) => {
        if (!result.success) return;
        setStatusOverrides((prev) => ({ ...prev, [appointmentId]: attended ? "Completed" : "NoShow" }));
      })
      .finally(() => setPending(null));
  }

  return (
    <ol className="flex flex-col">
      {slots.map((entry, index) => {
        const isLast = index === slots.length - 1;
        const isBooked = entry.kind === "booked";
       const nextSlot = slots[index + 1];
       const previousSlot = slots[index - 1];

const endLabel =
  entry.kind === "booked"
    ? new Date(entry.appointment.endTimeUtc).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : nextSlot
      ? `${String(nextSlot.slot.hour).padStart(2, "0")}:${String(nextSlot.slot.minute).padStart(2, "0")}`
      : previousSlot
        ? addPreviousSlotDuration(entry.slot, previousSlot.slot)
        : "Bilinmiyor";
        return (
          <li key={entry.kind === "booked" ? entry.appointment.id : `slot-${entry.slot.label}`} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex flex-col items-end pt-3 text-right text-xs font-medium text-ink-secondary">
                <span>{entry.slot.label}</span>
                <span className="text-ink-muted">{endLabel}</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className={cn("mt-4 h-2.5 w-2.5 shrink-0 rounded-full", isBooked ? "bg-primary" : "bg-border-strong")} />
              {!isLast && <span className="w-px flex-1 bg-border-default" />}
            </div>
            <div className="flex-1 pb-4">
              {entry.kind === "booked" && (
                <div className="flex flex-col gap-2 rounded-xl border border-border-default bg-surface px-4 py-3 shadow-card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AvatarCircle name={entry.appointment.clientName} size={40} />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{entry.appointment.clientName}</p>
                        <p className="text-xs text-ink-secondary">{entry.appointment.locationName}</p>
                      </div>
                    </div>
                    <Badge variant={statusBadgeVariant(statusOverrides[entry.appointment.id] ?? entry.appointment.status)}>
                      {statusLabelTr(statusOverrides[entry.appointment.id] ?? entry.appointment.status)}
                    </Badge>
                  </div>
                  {entry.appointment.status === "Confirmed" &&
                    !statusOverrides[entry.appointment.id] &&
                    new Date(entry.appointment.endTimeUtc).getTime() <= now && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={pending === entry.appointment.id}
                          onClick={() => handleAttendance(entry.appointment.id, true)}
                        >
                          Geldi
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="flex-1"
                          disabled={pending === entry.appointment.id}
                          onClick={() => handleAttendance(entry.appointment.id, false)}
                        >
                          Gelmedi
                        </Button>
                      </div>
                    )}
                </div>
              )}
              {entry.kind === "break" && (
                <div className="flex items-center gap-3 rounded-xl bg-surface-muted px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-muted">
                    <Coffee className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Öğle Arası</p>
                    <p className="text-xs text-ink-secondary">Kendine zaman ayır.</p>
                  </div>
                </div>
              )}
              {entry.kind === "available" && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border-strong px-4 py-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
                      <Plus className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">Müsait Zaman</p>
                      <p className="truncate text-xs text-ink-secondary">Yeni randevu ekleyebilirsin.</p>
                      {entry.restricted && (
                        <p className="flex items-center gap-1 text-xs font-medium text-warning-600">
                          <TriangleAlert className="h-3 w-3 shrink-0" />
                          Sadece {entry.validLocations.map((l) => l.name).join(", ")} — diğer konuma yol süresi yüzünden yetişemezsin
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <BookForClientDialog
                      trigger={
                        <Button variant="outline" size="sm">
                          <Plus className="h-3.5 w-3.5" />
                          Ekle
                        </Button>
                      }
                      clients={clients}
                      preselectedSlot={{
                        dateIso: todayIso,
                        startTimeUtc: entry.startTimeUtc,
                        validLocationIds: entry.validLocations.map((l) => l.id),
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

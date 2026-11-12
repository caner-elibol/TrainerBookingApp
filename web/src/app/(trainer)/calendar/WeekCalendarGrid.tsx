"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Coffee, Lock, Plus, CalendarClock, TriangleAlert } from "lucide-react";
import { clientFetch } from "@/lib/client-api";
import { onAppointmentsChanged } from "@/lib/calendar-events";
import { cancelRemainingAppointments, markAttendance, setDayClosed } from "./actions";
import BookForClientDialog from "./BookForClientDialog";
import DayActionsMenu, { type ClosedReason } from "./DayActionsMenu";
import AppointmentActionsSheet, { statusBadgeVariant, statusLabelTr } from "./AppointmentActionsSheet";
import type { AvailableSlot, TrainerAppointment, TrainerClientSummary, TrainerLocation, WorkingHourDto } from "@/lib/types";
import { computeSlotStarts, type ScheduleSlot } from "@/lib/scheduleSlots";
import AvatarCircle from "@/components/ui/AvatarCircle";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";
import ButtonLink from "@/components/ui/ButtonLink";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { addDays, formatLocalTime, isoDate, localDayOf, localTimeKeyOf, TR_WEEKDAY_SHORT_MONDAY_FIRST } from "@/lib/date";

const BOOKING_WINDOW_DAYS = 7;
const CLOCK_TICK_MS = 30_000;

interface SessionInfo {
  user: { id: string; email: string; fullName: string; role: "Trainer" | "Client" } | null;
  accessToken: string | null;
}

interface ClosedDayEntry {
  date: string;
  reason: ClosedReason;
}

function statusBorderClass(status: string): string {
  switch (status) {
    case "Confirmed":
      return "border-ink";
    case "Completed":
      return "border-success-600";
    case "Locked":
      return "border-warning-500";
    case "Cancelled":
    case "NoShow":
      return "border-error-600";
    default:
      return "border-border-strong";
  }
}

function minutesFromTimeString(value: string | null): number | null {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function countdownBadge(startTimeUtc: string, now: number): { label: string; variant: BadgeVariant } | null {
  const diffMin = Math.round((new Date(startTimeUtc).getTime() - now) / 60000);
  if (diffMin < 0 || diffMin > 60) return null;
  const label = diffMin <= 1 ? "Şimdi başlıyor" : `${diffMin} dk sonra`;
  const variant: BadgeVariant = diffMin <= 15 ? "accent" : diffMin <= 30 ? "warning" : "brand";
  return { label, variant };
}

interface DayColumn {
  date: Date;
  iso: string;
  workingHour: WorkingHourDto | undefined;
  slots: ScheduleSlot[];
}

interface AvailableRow {
  startTimeUtc: string;
  endTimeUtc: string;
  locations: TrainerLocation[];
}

type CellState =
  | { kind: "booked"; appointment: TrainerAppointment }
  | { kind: "break" }
  | { kind: "available"; startTimeUtc: string; validLocations: TrainerLocation[]; restricted: boolean }
  | { kind: "blank" };

export default function WeekCalendarGrid({
  initialAppointments,
  workingHours,
  sessionDurationMinutes,
  bufferDurationMinutes,
  clients,
}: {
  initialAppointments: TrainerAppointment[];
  workingHours: WorkingHourDto[];
  sessionDurationMinutes: number;
  bufferDurationMinutes: number;
  clients: TrainerClientSummary[];
}) {
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => isoDate(today), [today]);
  const [appointments, setAppointments] = useState<TrainerAppointment[]>(initialAppointments);
  const [closedDays, setClosedDays] = useState<ClosedDayEntry[]>([]);
  const [session, setSession] = useState<SessionInfo | "loading">("loading");
  const [mobileSelectedDay, setMobileSelectedDay] = useState(() => todayIso);
  const [attendancePending, setAttendancePending] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [closedDayTogglePending, setClosedDayTogglePending] = useState<string | null>(null);
  const [activeSheetAppointment, setActiveSheetAppointment] = useState<TrainerAppointment | null>(null);
  const [locations, setLocations] = useState<TrainerLocation[]>([]);
  const [locationsLoaded, setLocationsLoaded] = useState(false);
  const [availableRows, setAvailableRows] = useState<AvailableRow[] | null>(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (isMountedRef.current) setSession(data);
      })
      .catch(() => {
        if (isMountedRef.current) setSession({ user: null, accessToken: null });
      });
  }, []);

  const token = session !== "loading" ? session.accessToken : null;
  const windowFrom = todayIso;
  const windowTo = useMemo(() => isoDate(addDays(today, BOOKING_WINDOW_DAYS - 1)), [today]);

  const refetchAppointments = useCallback(() => {
    if (session === "loading") return;
    clientFetch(`/api/trainers/me/appointments?from=${windowFrom}&to=${windowTo}`, token)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: TrainerAppointment[]) => {
        if (isMountedRef.current) setAppointments(data);
      })
      .catch(() => {
        if (isMountedRef.current) setAppointments([]);
      });
  }, [session, token, windowFrom, windowTo]);

  const refetchClosedDays = useCallback(() => {
    if (session === "loading") return;
    clientFetch(`/api/trainers/me/calendar/closed-days?from=${windowFrom}&to=${windowTo}`, token)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ClosedDayEntry[]) => {
        if (isMountedRef.current) setClosedDays(data);
      })
      .catch(() => {
        if (isMountedRef.current) setClosedDays([]);
      });
  }, [session, token, windowFrom, windowTo]);

  useEffect(() => {
    refetchAppointments();
  }, [refetchAppointments]);

  useEffect(() => onAppointmentsChanged(refetchAppointments), [refetchAppointments]);

  useEffect(() => {
    refetchClosedDays();
  }, [refetchClosedDays]);

  useEffect(() => {
    if (session === "loading") return;
    let cancelled = false;
    clientFetch("/api/trainers/me/locations", token)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: TrainerLocation[]) => {
        if (!cancelled) setLocations(data);
      })
      .catch(() => {
        if (!cancelled) setLocations([]);
      })
      .finally(() => {
        if (!cancelled) setLocationsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [session, token]);

  useEffect(() => {
    if (session === "loading" || !session.user || locations.length === 0) {
      setAvailableRows([]);
      return;
    }
    const trainerId = session.user.id;
    let cancelled = false;
    Promise.all(
      locations.map((loc) =>
        clientFetch(`/api/trainers/${trainerId}/availability?locationId=${loc.id}&date=${mobileSelectedDay}`, token)
          .then((r) => (r.ok ? r.json() : []))
          .then((slots: AvailableSlot[]) => [loc, slots] as const)
          .catch(() => [loc, []] as const),
      ),
    ).then((results) => {
      if (cancelled) return;
      const byStart = new Map<string, AvailableRow>();
      for (const [loc, slots] of results) {
        for (const slot of slots) {
          const existing = byStart.get(slot.startTimeUtc);
          if (existing) existing.locations.push(loc);
          else byStart.set(slot.startTimeUtc, { startTimeUtc: slot.startTimeUtc, endTimeUtc: slot.endTimeUtc, locations: [loc] });
        }
      }
      setAvailableRows(
        Array.from(byStart.values()).sort((a, b) => new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime()),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [session, token, locations, mobileSelectedDay, appointments]);

  const closedDaysByDate = useMemo(() => {
    const map: Record<string, ClosedReason> = {};
    for (const entry of closedDays) map[entry.date] = entry.reason;
    return map;
  }, [closedDays]);

  const hasAnyRealAppointment = appointments.some((a) => a.status === "Confirmed" || a.status === "Completed");

  const days: DayColumn[] = useMemo(
    () =>
      Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => {
        const date = addDays(today, i);
        const iso = isoDate(date);
        const workingHour = workingHours.find((wh) => wh.dayOfWeek === date.getDay());
        const slots = workingHour ? computeSlotStarts([workingHour], sessionDurationMinutes, bufferDurationMinutes) : [];
        return { date, iso, workingHour, slots };
      }),
    [today, workingHours, sessionDurationMinutes, bufferDurationMinutes],
  );

  function breakStateFor(day: DayColumn, slot: ScheduleSlot): CellState {
    const wh = day.workingHour;
    if (!wh) return { kind: "blank" };

    const slotMinutes = slot.hour * 60 + slot.minute;
    const breakStart = minutesFromTimeString(wh.breakStartTime);
    const breakEnd = minutesFromTimeString(wh.breakEndTime);
    if (
      breakStart !== null &&
      breakEnd !== null &&
      slotMinutes < breakEnd &&
      slotMinutes + sessionDurationMinutes > breakStart
    ) {
      return { kind: "break" };
    }

    return { kind: "blank" };
  }

  function handleAttendance(appointmentId: string, attended: boolean) {
    setAttendancePending(appointmentId);
    markAttendance(appointmentId, attended)
      .then((result) => {
        if (!result.success) {
          console.error("markAttendance failed", result.error);
          return;
        }
        setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, status: attended ? "Completed" : "NoShow" } : a)));
      })
      .finally(() => setAttendancePending(null));
  }

  function handleCancelled(appointmentId: string) {
    setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, status: "Cancelled" } : a)));
  }

  function handleToggleClosed(dateIso: string, closed: boolean) {
    setClosedDayTogglePending(dateIso);
    setDayClosed(dateIso, closed)
      .then((result) => {
        if (!result.success) {
          console.error("setDayClosed failed", result.error);
          return;
        }
        refetchClosedDays();
      })
      .finally(() => setClosedDayTogglePending(null));
  }

  async function handleCancelRemaining(dateIso: string): Promise<number | null> {
    const result = await cancelRemainingAppointments(dateIso);
    if (!result.success) {
      console.error("cancelRemainingAppointments failed", result.error);
      return null;
    }

    if ((result.cancelledCount ?? 0) > 0) {
      refetchAppointments();
      refetchClosedDays();
    }

    return result.cancelledCount;
  }

  const mobileDay = days.find((d) => d.iso === mobileSelectedDay) ?? days[0];
  const isViewingToday = mobileDay.iso === todayIso;
  const nowDate = new Date(now);
  const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();

  type AgendaRow = { key: string; slot: ScheduleSlot; state: Exclude<CellState, { kind: "blank" }> };

  const dayAppointments = appointments.filter(
    (a) => a.status !== "Cancelled" && localDayOf(a.startTimeUtc) === mobileDay.iso,
  );

  const appointmentRows: AgendaRow[] = dayAppointments.map((appointment) => {
    const label = localTimeKeyOf(appointment.startTimeUtc);
    const [hour, minute] = label.split(":").map(Number);
    return { key: `appt-${appointment.id}`, slot: { hour, minute, label }, state: { kind: "booked", appointment } };
  });

  function overlapsAnAppointment(slotMinutes: number): boolean {
    const slotEndMinutes = slotMinutes + sessionDurationMinutes;
    return dayAppointments.some((appt) => {
      const apptStart = minutesFromTimeString(localTimeKeyOf(appt.startTimeUtc))!;
      const apptEnd = minutesFromTimeString(localTimeKeyOf(appt.endTimeUtc))!;
      return slotMinutes < apptEnd && slotEndMinutes > apptStart;
    });
  }

  const breakRows = mobileDay.slots
    .filter((slot) => !overlapsAnAppointment(slot.hour * 60 + slot.minute))
    .map((slot) => ({ key: `slot-${slot.label}`, slot, state: breakStateFor(mobileDay, slot) }))
    .filter((row): row is AgendaRow => row.state.kind !== "blank");

  const availableAgendaRows: AgendaRow[] = (availableRows ?? [])
    .filter((row) => new Date(row.startTimeUtc).getTime() >= now)
    .map((row) => {
      const label = localTimeKeyOf(row.startTimeUtc);
      const [hour, minute] = label.split(":").map(Number);
      return {
        key: `avail-${row.startTimeUtc}`,
        slot: { hour, minute, label },
        state: {
          kind: "available",
          startTimeUtc: row.startTimeUtc,
          validLocations: row.locations,
          restricted: row.locations.length < locations.length,
        },
      };
    });

  const agendaRows = [...appointmentRows, ...breakRows, ...availableAgendaRows].sort(
    (a, b) => a.slot.hour * 60 + a.slot.minute - (b.slot.hour * 60 + b.slot.minute),
  );

  let nowLineShown = false;

  return (
    <div className="flex flex-col gap-4">
      {locationsLoaded && locations.length === 0 && (
        <Alert
          variant="warning"
          title="Henüz bir konumun yok"
          action={
            <ButtonLink href="/settings/locations" variant="primary" size="sm">
              Konum ekle
            </ButtonLink>
          }
        >
          Uygun saatler konuma göre hesaplanır. En az bir konum eklemeden takvimde boş saat görünmez ve randevu oluşturulamaz.
        </Alert>
      )}

      {!hasAnyRealAppointment && (
        <EmptyState
          icon={CalendarClock}
          title="Henüz randevun yok."
          description="Yukarıdaki 'Randevu Ekle' ile veya aşağıdan bir uygun zaman seçerek ilk randevunu oluştur."
        />
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map((day) => {
          const isSelected = day.iso === mobileSelectedDay;
          const hasAppointment = appointments.some((a) => a.status !== "Cancelled" && localDayOf(a.startTimeUtc) === day.iso);
          return (
            <button
              key={day.iso}
              type="button"
              onClick={() => setMobileSelectedDay(day.iso)}
              className={cn(
                "flex min-w-14 flex-col items-center gap-1 rounded-xl px-3 py-2.5",
                isSelected ? "bg-primary text-white" : "bg-surface-muted text-ink-secondary",
              )}
            >
              <span className="text-xs font-medium">{TR_WEEKDAY_SHORT_MONDAY_FIRST[(day.date.getDay() + 6) % 7]}</span>
              <span className="text-sm font-bold">{day.date.getDate()}</span>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  hasAppointment ? (isSelected ? "bg-white" : "bg-primary") : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>

      <div className="flex justify-center">
        <DayActionsMenu
          dateIso={mobileDay.iso}
          closedReason={closedDaysByDate[mobileDay.iso] ?? null}
          togglePending={closedDayTogglePending === mobileDay.iso}
          onToggleClosed={handleToggleClosed}
          onCancelRemaining={handleCancelRemaining}
        />
      </div>

      <div className="flex flex-col gap-2">
        {agendaRows.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">
            {mobileDay.slots.length === 0 ? "Bugün çalışma saatin yok." : "Bu gün için gösterilecek bir şey kalmadı."}
          </p>
        ) : (
          <>
            {agendaRows.map(({ key, slot, state }) => {
              const slotMinutes = slot.hour * 60 + slot.minute;
              const showNowLine = isViewingToday && !nowLineShown && slotMinutes >= nowMinutes;
              if (showNowLine) nowLineShown = true;
              return (
                <div key={key} className="flex flex-col gap-2">
                  {showNowLine && <CurrentTimeLine now={now} />}
                  <div className="flex gap-3">
                    <div className="w-12 shrink-0 pt-3 text-right text-xs text-ink-muted">{slot.label}</div>
                    <div className="min-w-0 flex-1">
                      <MobileAgendaCard
                        state={state}
                        clients={clients}
                        now={now}
                        day={mobileDay}
                        onOpenSheet={setActiveSheetAppointment}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {isViewingToday && !nowLineShown && <CurrentTimeLine now={now} />}
          </>
        )}
      </div>

      {activeSheetAppointment && (
        <AppointmentActionsSheet
          appointment={activeSheetAppointment}
          open={activeSheetAppointment !== null}
          onOpenChange={(open) => !open && setActiveSheetAppointment(null)}
          now={now}
          onAttendance={handleAttendance}
          onCancelled={handleCancelled}
        />
      )}
    </div>
  );
}

function CurrentTimeLine({ now }: { now: number }) {
  const label = new Date(now).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex items-center gap-3 pl-[3.25rem]" aria-hidden="true">
      <span className="-ml-[3.25rem] w-12 shrink-0 text-right text-[11px] font-semibold text-ink">{label}</span>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span className="h-px flex-1 bg-primary" />
    </div>
  );
}

function MobileAgendaCard({
  state,
  clients,
  now,
  day,
  onOpenSheet,
}: {
  state: Exclude<CellState, { kind: "blank" }>;
  clients: TrainerClientSummary[];
  now: number;
  day: DayColumn;
  onOpenSheet: (appointment: TrainerAppointment) => void;
}) {
  if (state.kind === "break") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-surface-muted px-4 py-3">
        <Coffee className="h-4 w-4 text-ink-muted" />
        <div>
          <p className="text-sm font-semibold text-foreground">Öğle Arası</p>
          <p className="text-xs text-ink-secondary">Kendine zaman ayır.</p>
        </div>
      </div>
    );
  }

  if (state.kind === "available") {
    const restrictedNames = state.restricted ? state.validLocations.map((l) => l.name).join(", ") : null;
    return (
      <BookForClientDialog
        trigger={
          <button
            type="button"
            className="flex w-full flex-col gap-1 rounded-xl border border-dashed border-border-strong px-4 py-3 text-left text-ink-muted hover:border-neutral-400 hover:text-ink"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Uygun Zaman</span>
              <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-ink">
                <Plus className="h-3.5 w-3.5" /> Randevu Ekle
              </span>
            </span>
            {restrictedNames && (
              <span className="flex items-center gap-1 text-xs font-medium text-warning-600">
                <TriangleAlert className="h-3 w-3 shrink-0" />
                Sadece {restrictedNames} — diğer konuma yol süresi yüzünden yetişemezsin
              </span>
            )}
          </button>
        }
        clients={clients}
        preselectedSlot={{
          dateIso: day.iso,
          startTimeUtc: state.startTimeUtc,
          validLocationIds: state.validLocations.map((l) => l.id),
        }}
      />
    );
  }

  const { appointment } = state;
  const isLocked = appointment.status === "Locked";
  const countdown = appointment.status === "Confirmed" ? countdownBadge(appointment.startTimeUtc, now) : null;

  return (
    <button
      type="button"
      onClick={() => onOpenSheet(appointment)}
      className={cn(
        "w-full rounded-xl border px-4 py-3 text-left shadow-card transition-colors",
        isLocked ? "border-warning-200 bg-warning-50" : "border-border-default bg-surface hover:bg-surface-muted",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <AvatarCircle name={appointment.clientName} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{appointment.clientName}</p>
            <p className="truncate text-xs text-ink-secondary">
              {formatLocalTime(appointment.startTimeUtc)} - {formatLocalTime(appointment.endTimeUtc)} · {appointment.locationName}
            </p>
          </div>
        </div>
        {isLocked ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-warning-100 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-warning-700">
            <Lock className="h-3 w-3" /> Seçiliyor...
          </span>
        ) : (
          <Badge className="shrink-0 whitespace-nowrap" variant={statusBadgeVariant(appointment.status)}>
            {statusLabelTr(appointment.status)}
          </Badge>
        )}
      </div>
      {countdown && (
        <div className="mt-2 flex justify-end">
          <Badge className="shrink-0 whitespace-nowrap" variant={countdown.variant}>
            {countdown.label}
          </Badge>
        </div>
      )}
    </button>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as signalR from "@microsoft/signalr";
import { Lock } from "lucide-react";
import { clientFetch, getSignalRHubUrl } from "@/lib/client-api";
import type { AvailableSlot, BusySlot, LockResult, MyPackage, TrainerLocation } from "@/lib/types";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import SectionCard from "@/components/ui/SectionCard";
import { BottomSheet, BottomSheetContent } from "@/components/ui/BottomSheet";
import { cn } from "@/lib/cn";
import ReservationPanel, { type LockedSlot } from "./ReservationPanel";

const WEEKDAY_LABELS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cts"];
const BOOKING_WINDOW_DAYS = 7;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoFor(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatLocalTime(utcIso: string): string {
  return new Date(utcIso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function formatLocalDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { weekday: "long", month: "long", day: "numeric" });
}

interface BookingExperienceProps {
  trainerId: string;
  trainerName: string;
  token: string | null;
  myPackages: MyPackage[];
  totalRemaining: number;
  onSlotBooked: (userPackageId: string) => void;
}

export default function BookingExperience({
  trainerId,
  trainerName,
  token,
  myPackages,
  totalRemaining,
  onSlotBooked,
}: BookingExperienceProps) {
  const router = useRouter();
  const [date, setDate] = useState(todayIso());
  const today = useMemo(() => new Date(), []);
  const days = useMemo(
    () =>
      Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        return { date: d, iso: isoFor(d.getFullYear(), d.getMonth(), d.getDate()) };
      }),
    [today],
  );
  const [slotsByDate, setSlotsByDate] = useState<Record<string, AvailableSlot[] | undefined>>({});
  const slots = slotsByDate[date] ?? null;
  const [slotStatus, setSlotStatus] = useState<Record<string, "Selecting" | "Booked">>({});
  const [hasUserSelectedDate, setHasUserSelectedDate] = useState(false);
  const [busySlotsByDate, setBusySlotsByDate] = useState<Record<string, BusySlot[] | undefined>>({});

  const displaySlots = useMemo(() => {
    const available = (slots ?? [])
      .filter((s) => slotStatus[s.startTimeUtc] !== "Booked")
      .map((slot) => ({ kind: "available" as const, slot }));
    const busy = (busySlotsByDate[date] ?? []).map((slot) => ({ kind: "busy" as const, slot }));
    return [...available, ...busy].sort(
      (a, b) => new Date(a.slot.startTimeUtc).getTime() - new Date(b.slot.startTimeUtc).getTime(),
    );
  }, [slots, slotStatus, busySlotsByDate, date]);

  const [locations, setLocations] = useState<TrainerLocation[] | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);

  const [lockedSlot, setLockedSlot] = useState<LockedSlot | null>(null);
  const [isLocking, startLocking] = useTransition();
  const [isConfirming, startConfirming] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const activePackage = myPackages[0];

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const lockedSlotRef = useRef<LockedSlot | null>(null);
  lockedSlotRef.current = lockedSlot;

  useEffect(() => {
    let cancelled = false;
    clientFetch(`/api/trainers/${trainerId}/locations`, null)
      .then((response) => (response.ok ? response.json() : []))
      .then((data: TrainerLocation[]) => {
        if (cancelled) return;
        setLocations(data);
        if (data.length === 1) setLocationId(data[0].id);
      })
      .catch(() => {
        if (!cancelled) setLocations([]);
      });
    return () => {
      cancelled = true;
    };
  }, [trainerId]);

  useEffect(() => {
    if (!locationId) return;

    let cancelled = false;
    Promise.all(
      days.map(async ({ iso }): Promise<[string, AvailableSlot[]]> => {
        try {
          const response = await clientFetch(
            `/api/trainers/${trainerId}/availability?locationId=${locationId}&date=${iso}`,
            null,
          );
          const data: AvailableSlot[] = response.ok ? await response.json() : [];
          return [iso, data];
        } catch {
          return [iso, []];
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      setSlotsByDate((prev) => {
        const next = { ...prev };
        for (const [iso, data] of results) next[iso] = data;
        return next;
      });

      if (hasUserSelectedDate) return;
      const currentDaySlots = results.find(([iso]) => iso === date)?.[1];
      if (currentDaySlots && currentDaySlots.length > 0) return;

      const firstAvailable = results.find(([, daySlots]) => daySlots.length > 0);
      if (firstAvailable) setDate(firstAvailable[0]);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainerId, days, locationId]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      days.map(async ({ iso }): Promise<[string, BusySlot[]]> => {
        try {
          const response = await clientFetch(`/api/trainers/${trainerId}/busy-slots?date=${iso}`, null);
          const data: BusySlot[] = response.ok ? await response.json() : [];
          return [iso, data];
        } catch {
          return [iso, []];
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      setBusySlotsByDate((prev) => {
        const next = { ...prev };
        for (const [iso, data] of results) next[iso] = data;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [trainerId, days]);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder().withUrl(getSignalRHubUrl()).withAutomaticReconnect().build();

    connection.on("SlotStatusChanged", (raw: unknown) => {
      const msg = raw as Record<string, unknown>;
      const msgTrainerId = (msg.trainerId ?? msg.TrainerId) as string | undefined;
      if (msgTrainerId !== trainerId) return;

      const startTimeUtc = (msg.startTimeUtc ?? msg.StartTimeUtc) as string;
      const status = (msg.status ?? msg.Status) as number;

      setSlotStatus((prev) => {
        const next = { ...prev };
        if (status === 1) delete next[startTimeUtc];
        else if (status === 0) next[startTimeUtc] = "Selecting";
        else if (status === 2) next[startTimeUtc] = "Booked";
        return next;
      });
    });

    connection.onreconnected(() => {
      connection.invoke("JoinTrainerCalendar", trainerId).catch(() => {});
    });

    let cancelled = false;
    const startPromise = connection
      .start()
      .then(() => {
        if (cancelled) return;
        return connection.invoke("JoinTrainerCalendar", trainerId);
      })
      .catch(() => {});

    connectionRef.current = connection;

    return () => {
      cancelled = true;
      startPromise.finally(() => {
        connection.invoke("LeaveTrainerCalendar", trainerId).catch(() => {});
        connection.stop();
      });
    };
  }, [trainerId]);

  useEffect(() => {
    return () => {
      const held = lockedSlotRef.current;
      if (held) {
        clientFetch(`/api/appointments/${held.appointmentId}/release`, token, { method: "POST" }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDateSelect(iso: string) {
    setHasUserSelectedDate(true);
    setDate(iso);
  }

  function handleLocationSelect(id: string) {
    setLocationId(id);
    setHasUserSelectedDate(false);
  }

  const releaseCurrentLock = useCallback(async () => {
    const held = lockedSlotRef.current;
    if (!held) return;
    setLockedSlot(null);
    await clientFetch(`/api/appointments/${held.appointmentId}/release`, token, { method: "POST" }).catch(() => {});
  }, [token]);

  function handleSlotClick(slot: AvailableSlot) {
    setError(null);
    if (!activePackage) {
      setError("Aktif bir paketin yok. Önce bir paket satın al.");
      return;
    }
    if (!locationId) {
      setError("Önce bir konum seç.");
      return;
    }

    startLocking(async () => {
      if (lockedSlot) await releaseCurrentLock();

      const lockResponse = await clientFetch("/api/appointments/lock", token, {
        method: "POST",
        body: JSON.stringify({
          trainerId,
          userPackageId: activePackage.userPackageId,
          locationId,
          startTimeUtc: slot.startTimeUtc,
        }),
      });

      if (!lockResponse.ok) {
        const body = await lockResponse.json().catch(() => null);
        setError(body?.error ?? "Bu saat artık uygun değil.");
        return;
      }

      const lockResult = (await lockResponse.json()) as LockResult;
      setLockedSlot({
        appointmentId: lockResult.appointmentId,
        expiresAt: new Date(lockResult.lockExpirationTimeUtc).getTime(),
        startTimeUtc: slot.startTimeUtc,
        endTimeUtc: new Date(new Date(slot.startTimeUtc).getTime() + 50 * 60_000).toISOString(),
      });
    });
  }

  function handleConfirm() {
    if (!lockedSlot || !activePackage) return;
    setError(null);

    startConfirming(async () => {
      const confirmResponse = await clientFetch(`/api/appointments/${lockedSlot.appointmentId}/confirm`, token, {
        method: "POST",
      });

      if (!confirmResponse.ok) {
        const body = await confirmResponse.json().catch(() => null);
        setError(body?.error ?? "Randevu onaylanamadı.");
        return;
      }

      onSlotBooked(activePackage.userPackageId);

      const bookedMessage = `Randevunuz ${trainerName} ile ${formatLocalDate(date)} günü ${formatLocalTime(
        lockedSlot.startTimeUtc,
      )} saatinde ayarlanmıştır.`;
      router.push(`/home?bookedMsg=${encodeURIComponent(bookedMessage)}`);
    });
  }

  const handleExpire = useCallback(() => {
    if (isConfirming) return;
    setLockedSlot(null);
    setError("Süre doldu, lütfen tekrar bir saat seç.");
  }, [isConfirming]);

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (open || isConfirming) return;
      setLockedSlot(null);
      setError(null);
    },
    [isConfirming],
  );

  if (myPackages.length === 0) {
    return <EmptyState title="Kullanılabilir paket yok" description="Randevu alabilmek için önce bir paket satın al." />;
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <SectionCard title="Randevu Oluştur" bodyClassName="flex flex-col gap-5">
        <p className="-mt-3 text-sm text-ink-secondary">Uygun tarih ve saati seçerek antrenman randevunu oluştur.</p>

        <div className="grid grid-cols-1 gap-6">
          {locations === null && <Alert variant="info">Konumlar yükleniyor…</Alert>}
          {locations !== null && locations.length === 0 && (
            <Alert variant="error">Antrenör henüz bir konum eklememiş. Lütfen daha sonra tekrar dene.</Alert>
          )}
          {locations !== null && locations.length > 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-bold text-foreground">Konum Seç</p>
              <div role="group" aria-label="Bir konum seç" className="flex flex-wrap gap-2">
                {locations.map((loc) => {
                  const isSelected = loc.id === locationId;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleLocationSelect(loc.id)}
                      className={cn(
                        "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        isSelected && "bg-primary text-white",
                        !isSelected && "cursor-pointer bg-surface-muted text-ink-secondary hover:bg-subtle",
                      )}
                    >
                      {loc.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {locations !== null && locations.length > 1 && !locationId && (
            <Alert variant="info">Devam etmek için önce bir konum seç.</Alert>
          )}

          {locationId && (
          <>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-foreground">Gün Seç</p>
            <p className="text-xs text-ink-secondary">Randevular en fazla 7 gün öncesinden alınabilir.</p>

            <div role="group" aria-label="Bir gün seç" className="flex gap-2 overflow-x-auto pb-1">
              {days.map(({ date: d, iso }) => {
                const daySlots = slotsByDate[iso];
                const isLoadingDay = daySlots === undefined;
                const isEmptyDay = Array.isArray(daySlots) && daySlots.length === 0;
                const isSelected = iso === date;

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => handleDateSelect(iso)}
                    disabled={isEmptyDay}
                    aria-label={`${formatLocalDate(iso)}, ${isEmptyDay ? "uygun değil" : "uygun"}`}
                    className={cn(
                      "flex min-w-14 flex-col items-center gap-1 rounded-xl px-3 py-2.5 transition-colors",
                      isSelected && "bg-primary text-white",
                      !isSelected && isEmptyDay && "cursor-not-allowed bg-surface-muted text-ink-muted/50",
                      !isSelected && !isEmptyDay && "cursor-pointer bg-surface-muted text-ink-secondary hover:bg-subtle",
                      !isSelected && isLoadingDay && "opacity-60",
                    )}
                  >
                    <span className="text-xs font-medium">{WEEKDAY_LABELS[d.getDay()]}</span>
                    <span className="text-sm font-bold">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-foreground capitalize">{formatLocalDate(date)}</p>

            {slots === null && <Alert variant="info">Saatler yükleniyor…</Alert>}
            {slots !== null && displaySlots.length === 0 && (
              <EmptyState title="Bu gün için uygun saat yok." description="Takvimden başka bir gün seç." />
            )}
            {slots !== null && displaySlots.length > 0 && (
              <div role="group" aria-label={`${formatLocalDate(date)} için uygun saatler`} className="grid grid-cols-3 gap-2">
                {displaySlots.map((entry) => {
                  if (entry.kind === "busy") {
                    return (
                      <div
                        key={entry.slot.startTimeUtc}
                        aria-label={`${formatLocalTime(entry.slot.startTimeUtc)}, dolu`}
                        className="flex cursor-not-allowed flex-col items-center gap-1 rounded-lg border border-error-200 bg-error-50 px-2 py-2 text-sm font-medium text-error-400"
                      >
                        <span>{formatLocalTime(entry.slot.startTimeUtc)}</span>
                        <Badge variant="error" className="px-1.5 py-0 text-[10px]">
                          Dolu
                        </Badge>
                      </div>
                    );
                  }

                  const slot = entry.slot;
                  const isSelectingByOther = slotStatus[slot.startTimeUtc] === "Selecting";
                  const isThisLocked = lockedSlot?.startTimeUtc === slot.startTimeUtc;

                  return (
                    <button
                      key={slot.startTimeUtc}
                      onClick={() => handleSlotClick(slot)}
                      disabled={isSelectingByOther || isLocking}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-sm font-medium transition-colors",
                        isThisLocked && "border-ink bg-primary text-white",
                        isSelectingByOther && "cursor-not-allowed border-warning-300 bg-warning-50 text-warning-700",
                        !isThisLocked &&
                          !isSelectingByOther &&
                          "cursor-pointer border-border-default bg-surface hover:border-neutral-400 hover:bg-subtle",
                      )}
                    >
                      {isSelectingByOther ? (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          <span className="text-[11px] leading-tight">Seçiliyor...</span>
                        </>
                      ) : (
                        formatLocalTime(slot.startTimeUtc)
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="mt-1 text-xs text-ink-muted">
              Her seans 50 dakika sürer. Lütfen size en uygun saati seçin.
            </p>
          </div>
          </>
          )}
        </div>

        {error && !lockedSlot && <Alert variant="error">{error}</Alert>}
      </SectionCard>

      {!lockedSlot && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-default p-6 text-center text-sm text-ink-secondary">
          Randevu detaylarını görmek için yukarıdan bir saat seç.
        </div>
      )}

      <BottomSheet open={!!lockedSlot} onOpenChange={handleSheetOpenChange}>
        <BottomSheetContent>
          {lockedSlot && (
            <ReservationPanel
              lockedSlot={lockedSlot}
              trainerName={trainerName}
              packageTitle={activePackage?.packageTitle}
              remainingSessions={totalRemaining}
              isConfirming={isConfirming}
              error={error}
              onConfirm={handleConfirm}
              onExpire={handleExpire}
            />
          )}
        </BottomSheetContent>
      </BottomSheet>
    </div>
  );
}

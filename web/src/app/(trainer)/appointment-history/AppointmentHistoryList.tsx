"use client";

import { useEffect, useMemo, useState } from "react";
import { clientFetch } from "@/lib/client-api";
import type { TrainerAppointment } from "@/lib/types";
import { addDays, formatLocalTime, isoDate, localDayOf } from "@/lib/date";
import { mockServiceFor } from "@/lib/fixtures/names";
import AvatarCircle from "@/components/ui/AvatarCircle";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { CARD_BASE_CLASSES } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const STATUS_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  Completed: { label: "Tamamlandı", variant: "success" },
  Confirmed: { label: "Onaylandı", variant: "brand" },
  NoShow: { label: "Gelmedi", variant: "error" },
};

interface SessionInfo {
  accessToken: string | null;
}

export default function AppointmentHistoryList({
  initialAppointments,
  initialFromIso,
  windowDays,
}: {
  initialAppointments: TrainerAppointment[];
  initialFromIso: string;
  windowDays: number;
}) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [fromIso, setFromIso] = useState(initialFromIso);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(setSession)
      .catch(() => setSession({ accessToken: null }));
  }, []);

  const groups = useMemo(() => {
    const sorted = [...appointments]
      .filter((a) => a.status !== "Locked" && a.status !== "Cancelled")
      .sort((a, b) => new Date(b.startTimeUtc).getTime() - new Date(a.startTimeUtc).getTime());

    const byDay = new Map<string, TrainerAppointment[]>();
    for (const appt of sorted) {
      const day = localDayOf(appt.startTimeUtc);
      const list = byDay.get(day) ?? [];
      list.push(appt);
      byDay.set(day, list);
    }
    return Array.from(byDay.entries());
  }, [appointments]);

  function handleLoadOlder() {
    setIsLoadingMore(true);
    const olderFrom = addDays(new Date(`${fromIso}T00:00:00`), -windowDays);
    const olderFromIso = isoDate(olderFrom);
    const to = addDays(new Date(`${fromIso}T00:00:00`), -1);

    clientFetch(`/api/trainers/me/appointments?from=${olderFromIso}&to=${isoDate(to)}`, session?.accessToken ?? null)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: TrainerAppointment[]) => {
        setAppointments((prev) => [...prev, ...data]);
        setFromIso(olderFromIso);
      })
      .finally(() => setIsLoadingMore(false));
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState title="Henüz geçmiş randevu yok" description="Gerçekleşen, iptal edilen veya kaçırılan randevuların burada listelenir." />
        <Button variant="outline" className="self-center" isLoading={isLoadingMore} onClick={handleLoadOlder}>
          Daha eski randevuları göster
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map(([day, dayAppointments]) => (
        <div key={day} className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-ink-secondary">
            {new Date(`${day}T00:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" })}
          </p>
          <div className="flex flex-col gap-2">
            {dayAppointments.map((appt) => {
              const status = STATUS_BADGE[appt.status] ?? { label: appt.status, variant: "gray" as BadgeVariant };
              return (
                <div key={appt.id} className={cn(CARD_BASE_CLASSES, "flex items-center gap-3 py-3")}>
                  <AvatarCircle name={appt.clientName} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{appt.clientName}</p>
                    <p className="text-xs text-ink-secondary">
                      {formatLocalTime(appt.startTimeUtc)} - {formatLocalTime(appt.endTimeUtc)} · {mockServiceFor(appt.id)}
                    </p>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <Button variant="outline" className="self-center" isLoading={isLoadingMore} onClick={handleLoadOlder}>
        Daha eski randevuları göster
      </Button>
    </div>
  );
}

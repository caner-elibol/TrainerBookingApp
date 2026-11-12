"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Clock, Lock, User } from "lucide-react";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import AvatarCircle from "@/components/ui/AvatarCircle";

export interface LockedSlot {
  appointmentId: string;
  expiresAt: number;
  startTimeUtc: string;
  endTimeUtc: string;
}

function useCountdown(expiresAt: number, onExpire: () => void): string {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, expiresAt - Date.now()));
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    const interval = setInterval(() => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setRemainingMs(remaining);
      if (remaining === 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function ReservationPanel({
  lockedSlot,
  trainerName,
  packageTitle,
  remainingSessions,
  isConfirming,
  error,
  onConfirm,
  onExpire,
}: {
  lockedSlot: LockedSlot;
  trainerName: string;
  packageTitle?: string;
  remainingSessions?: number;
  isConfirming: boolean;
  error: string | null;
  onConfirm: () => void;
  onExpire: () => void;
}) {
  const [now] = useState(() => Date.now());
  const countdown = useCountdown(lockedSlot.expiresAt, onExpire);
  const start = new Date(lockedSlot.startTimeUtc);
  const end = new Date(lockedSlot.endTimeUtc);
  const isWithinCancellationWindow = (start.getTime() - now) / (1000 * 60 * 60) < 12;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">Seçtiğiniz Randevu</h3>
        <span className="flex items-center gap-1 rounded-full bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-700">
          <Clock className="h-3 w-3" /> 1 dakikalık süre tutuluyor
        </span>
      </div>

      <div className="flex flex-col items-center gap-2 rounded-xl bg-subtle py-5 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white">
          <Clock className="h-5 w-5" />
        </span>
        <p className="text-sm text-ink-secondary">Bu saat senin için</p>
        <p className="text-3xl font-bold tabular-nums text-ink">{countdown}</p>
        <p className="text-sm text-ink-secondary">süreyle ayrıldı</p>
      </div>

      <p className="text-xs text-ink-secondary">
        Bu süre içinde randevunu onaylamazsan, bu saat tekrar başkalarına açılacaktır.
      </p>

      <div className="flex flex-col gap-3 border-t border-border-default pt-4 text-sm">
        <span className="flex items-center gap-2.5">
          <Calendar className="h-4 w-4 text-ink-muted" />
          <span className="text-foreground">
            {start.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" })}
          </span>
        </span>
        <span className="flex items-center gap-2.5">
          <Clock className="h-4 w-4 text-ink-muted" />
          <span className="text-foreground">
            {start.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} –{" "}
            {end.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </span>
        <span className="flex items-center gap-2.5">
          <User className="h-4 w-4 text-ink-muted" />
          <span className="flex items-center gap-2 text-foreground">
            <AvatarCircle name={trainerName} size={24} />
            {trainerName}
          </span>
        </span>
        {packageTitle && (
          <span className="flex items-center gap-2.5">
            <Lock className="h-4 w-4 text-ink-muted" />
            <span className="text-foreground">
              {packageTitle}
              {typeof remainingSessions === "number" && (
                <span className="ml-1.5 text-xs text-success-600">{remainingSessions} hakkın kaldı</span>
              )}
            </span>
          </span>
        )}
      </div>

      {isWithinCancellationWindow && (
        <Alert variant="warning">Bu randevu 12 saatten az kaldığı için ileride iptal edilemeyecek.</Alert>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      <Button variant="secondary" onClick={onConfirm} isLoading={isConfirming} className="w-full">
        {isConfirming ? "Onaylanıyor…" : "Randevuyu Onayla →"}
      </Button>

      <p className="text-center text-xs text-ink-muted">
        Ödemen paket hakkından düşülecektir.
        <br />
        Randevu onaylandıktan sonra e-posta ile bilgilendirileceksin.
      </p>
    </div>
  );
}

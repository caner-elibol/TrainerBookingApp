"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Ban, CheckCircle2, ChevronRight, UserRound, XCircle } from "lucide-react";
import type { TrainerAppointment } from "@/lib/types";
import { formatLocalTime } from "@/lib/date";
import { mockServiceFor } from "@/lib/fixtures/names";
import { cancelAppointment } from "./actions";
import { BottomSheet, BottomSheetContent } from "@/components/ui/BottomSheet";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import CancelAppointmentDialog from "./CancelAppointmentDialog";
import AvatarCircle from "@/components/ui/AvatarCircle";

export function statusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "Confirmed":
      return "brand";
    case "Completed":
      return "success";
    case "Locked":
      return "warning";
    case "Cancelled":
    case "NoShow":
      return "error";
    default:
      return "gray";
  }
}

export function statusLabelTr(status: string): string {
  switch (status) {
    case "Confirmed":
      return "Onaylandı";
    case "Cancelled":
      return "İptal edildi";
    case "Completed":
      return "Tamamlandı";
    case "NoShow":
      return "Gelmedi";
    case "Locked":
      return "Seçiliyor...";
    default:
      return status;
  }
}

export default function AppointmentActionsSheet({
  appointment,
  open,
  onOpenChange,
  now,
  onAttendance,
  onCancelled,
}: {
  appointment: TrainerAppointment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  now: number;
  onAttendance: (id: string, attended: boolean) => void;
  onCancelled: (id: string) => void;
}) {
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isPastEnd = new Date(appointment.endTimeUtc).getTime() <= now;
  const isStarted = new Date(appointment.startTimeUtc).getTime() <= now;
  const canDecideAttendance = appointment.status === "Confirmed" && isPastEnd;
  const canCancel = appointment.status === "Confirmed" && !isStarted;

  function handleCancel(refundSession: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await cancelAppointment(appointment.id, refundSession);
      if (!result.success) {
        console.error("cancelAppointment failed", result.error);
        setError("Randevu iptal edilirken bir sorun oluştu.");
        setConfirmCancelOpen(false);
        return;
      }
      setConfirmCancelOpen(false);
      onOpenChange(false);
      onCancelled(appointment.id);
    });
  }

  return (
    <>
      <BottomSheet open={open} onOpenChange={onOpenChange}>
        <BottomSheetContent>
          <div className="flex items-center gap-3">
            <AvatarCircle name={appointment.clientName} size={44} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-bold text-foreground">{appointment.clientName}</p>
              <p className="truncate text-sm text-ink-secondary">{mockServiceFor(appointment.id)}</p>
            </div>
            <Badge variant={statusBadgeVariant(appointment.status)}>{statusLabelTr(appointment.status)}</Badge>
          </div>

          <div className="mt-4 flex flex-col gap-1.5 rounded-xl bg-surface-muted px-4 py-3 text-sm text-ink-secondary">
            <div className="flex items-center justify-between">
              <span>Tarih</span>
              <span className="font-medium text-foreground">
                {new Date(appointment.startTimeUtc).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Saat</span>
              <span className="font-medium text-foreground">
                {formatLocalTime(appointment.startTimeUtc)} - {formatLocalTime(appointment.endTimeUtc)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Konum</span>
              <span className="font-medium text-foreground">{appointment.locationName}</span>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-error-600">{error}</p>}

          <div className="mt-4 flex flex-col gap-2">
            {canDecideAttendance && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={isPending}
                  onClick={() => {
                    onAttendance(appointment.id, true);
                    onOpenChange(false);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" /> Tamamlandı
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  disabled={isPending}
                  onClick={() => {
                    onAttendance(appointment.id, false);
                    onOpenChange(false);
                  }}
                >
                  <XCircle className="h-4 w-4" /> Gelmedi
                </Button>
              </div>
            )}

            <Link
              href={`/clients/${appointment.clientId}`}
              className="flex items-center justify-between rounded-lg border border-border-default px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted"
            >
              <span className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-ink-muted" /> Danışanı Gör
              </span>
              <ChevronRight className="h-4 w-4 text-ink-muted" />
            </Link>

            {canCancel && (
              <button
                type="button"
                onClick={() => setConfirmCancelOpen(true)}
                disabled={isPending}
                className="flex items-center justify-center gap-2 rounded-lg border border-error-100 px-4 py-2.5 text-sm font-semibold text-error-600 hover:bg-error-50"
              >
                <Ban className="h-4 w-4" /> İptal Et
              </button>
            )}
          </div>
        </BottomSheetContent>
      </BottomSheet>

      <CancelAppointmentDialog
        open={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        clientName={appointment.clientName}
        isPending={isPending}
        onConfirm={handleCancel}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { Ban, Lock, LockOpen } from "lucide-react";
import Badge from "@/components/ui/Badge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/cn";

export type ClosedReason = "Manual" | "BulkCancelled";

export default function DayActionsMenu({
  dateIso,
  closedReason,
  togglePending,
  onToggleClosed,
  onCancelRemaining,
}: {
  dateIso: string;
  closedReason: ClosedReason | null;
  togglePending: boolean;
  onToggleClosed: (dateIso: string, closed: boolean) => void;
  onCancelRemaining: (dateIso: string) => Promise<number | null>;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const isClosed = closedReason !== null;

  async function handleConfirmCancel() {
    setIsCancelling(true);
    const count = await onCancelRemaining(dateIso);
    setIsCancelling(false);
    setConfirmOpen(false);
    setResultMessage(
      count === null ? "İptal işlemi başarısız oldu." : count > 0 ? `${count} randevu iptal edildi.` : "İptal edilecek randevu yok.",
    );
    setTimeout(() => setResultMessage(null), 4000);
  }

  return (
    <div className="flex flex-col items-center gap-1 px-1 pb-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onToggleClosed(dateIso, !isClosed)}
          disabled={togglePending}
          title={isClosed ? "Günü randevuya aç" : "Günü randevuya kapat"}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted",
            isClosed && "text-warning-600",
          )}
        >
          {isClosed ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          title="Kalan randevuları iptal et"
          className="flex h-6 w-6 items-center justify-center rounded-md text-ink-muted hover:bg-error-50 hover:text-error-600"
        >
          <Ban className="h-3.5 w-3.5" />
        </button>
      </div>
      {closedReason === "BulkCancelled" && (
        <Badge variant="error" className="text-[10px]">
          Bu günü iptal ettiniz
        </Badge>
      )}
      {closedReason === "Manual" && (
        <Badge variant="warning" className="text-[10px]">
          Kapalı
        </Badge>
      )}
      {resultMessage && <p className="text-center text-[10px] text-ink-secondary">{resultMessage}</p>}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Kalan randevuları iptal et"
        description="Bu gün için şu andan sonraki tüm onaylı randevular iptal edilecek, danışanlara e-posta ile bilgi verilecek, seanslar paketlerine geri yüklenecek ve gün yeni randevuya kapatılacak. Bu işlem geri alınamaz."
        confirmLabel="Randevuları iptal et"
        variant="danger"
        isConfirming={isCancelling}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}

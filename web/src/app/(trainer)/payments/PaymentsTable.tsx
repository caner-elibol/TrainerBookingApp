"use client";

import { useMemo, useState } from "react";
import type { PaymentMethod, TrainerPayment, TrainerPaymentStatus } from "@/lib/types";
import { markPaymentPaid } from "./actions";
import { STATUS_BADGE, STATUS_LABEL, methodLabel } from "@/lib/payment-status";
import MarkPaymentPaidDialog from "@/components/payments/MarkPaymentPaidDialog";
import AvatarCircle from "@/components/ui/AvatarCircle";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/cn";

type TabKey = "Tümü" | TrainerPaymentStatus;

const TABS: TabKey[] = ["Tümü", "Paid", "Pending", "Failed"];
const TAB_LABEL: Record<TabKey, string> = { Tümü: "Tümü", Paid: "Ödendi", Pending: "Bekliyor", Failed: "Başarısız" };

export default function PaymentsTable({ initialPayments }: { initialPayments: TrainerPayment[] }) {
  const [payments, setPayments] = useState(initialPayments);
  const [activeTab, setActiveTab] = useState<TabKey>("Tümü");

  const filtered = useMemo(
    () => (activeTab === "Tümü" ? payments : payments.filter((p) => p.status === activeTab)),
    [payments, activeTab],
  );

  function handleConfirmed(paymentId: string, method: PaymentMethod) {
    setPayments((prev) => prev.map((p) => (p.paymentId === paymentId ? { ...p, status: "Paid", method } : p)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 overflow-x-auto border-b border-border-default">
        {TABS.map((tab) => {
          const count = tab === "Tümü" ? payments.length : payments.filter((p) => p.status === tab).length;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
                activeTab === tab ? "border-ink text-ink" : "border-transparent text-ink-secondary hover:text-foreground",
              )}
            >
              {TAB_LABEL[tab]} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={payments.length === 0 ? "Henüz ödeme yok." : "Bu kategoride ödeme yok."}
          description={payments.length === 0 ? "Danışanların paket satın aldıkça ödemeler burada listelenir." : undefined}
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filtered.map((row) => (
            <li key={row.paymentId} className="rounded-xl border border-border-default bg-surface p-3">
              <div className="flex items-start gap-3">
                <AvatarCircle name={row.clientName} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-foreground">{row.clientName}</p>
                    <p className="shrink-0 font-semibold text-foreground">₺{row.amount.toLocaleString("tr-TR")}</p>
                  </div>
                  <p className="truncate text-xs text-ink-secondary">{row.packageTitle}</p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <p className="text-xs text-ink-muted">
                      {methodLabel(row.method)} ·{" "}
                      {new Date(row.createdAtUtc).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                    </p>
                    <Badge variant={STATUS_BADGE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                  </div>
                  {row.status === "Pending" && (
                    <div className="mt-2">
                      <MarkPaymentPaidDialog
                        packageTitle={row.packageTitle}
                        amount={row.amount}
                        onConfirm={(method) => markPaymentPaid(row.paymentId, { method })}
                        onConfirmed={(method) => handleConfirmed(row.paymentId, method)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

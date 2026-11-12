"use client";

import { useState } from "react";
import type { ClientPaymentHistory, PaymentMethod } from "@/lib/types";
import { markPaymentPaid } from "./actions";
import { STATUS_BADGE, STATUS_LABEL, methodLabel } from "@/lib/payment-status";
import MarkPaymentPaidDialog from "@/components/payments/MarkPaymentPaidDialog";
import Badge from "@/components/ui/Badge";

export default function PaymentHistoryCard({ clientId, initialPayments }: { clientId: string; initialPayments: ClientPaymentHistory[] }) {
  const [payments, setPayments] = useState(initialPayments);

  if (payments.length === 0) {
    return <p className="text-sm text-ink-secondary">Henüz ödeme yok.</p>;
  }

  function handleConfirmed(paymentId: string, method: PaymentMethod) {
    setPayments((prev) => prev.map((p) => (p.paymentId === paymentId ? { ...p, status: "Paid", method } : p)));
  }

  return (
    <div className="flex flex-col gap-3">
      {payments.map((payment) => (
        <div key={payment.paymentId} className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">{payment.packageTitle}</p>
            <p className="text-xs text-ink-secondary">
              {new Date(payment.createdAtUtc).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              {" · "}
              {methodLabel(payment.method)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <p className="text-sm font-bold text-foreground">₺{payment.amount.toLocaleString("tr-TR")}</p>
            <Badge variant={STATUS_BADGE[payment.status]}>{STATUS_LABEL[payment.status]}</Badge>
            {payment.status === "Pending" && (
              <MarkPaymentPaidDialog
                packageTitle={payment.packageTitle}
                amount={payment.amount}
                onConfirm={(method) => markPaymentPaid(clientId, payment.paymentId, { method })}
                onConfirmed={(method) => handleConfirmed(payment.paymentId, method)}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

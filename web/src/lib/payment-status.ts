import type { TrainerPaymentStatus, PaymentMethod } from "@/lib/types";
import type { BadgeVariant } from "@/components/ui/Badge";

export const STATUS_LABEL: Record<TrainerPaymentStatus, string> = {
  Paid: "Ödendi",
  Pending: "Beklemede",
  Failed: "Başarısız",
};

export const STATUS_BADGE: Record<TrainerPaymentStatus, BadgeVariant> = {
  Paid: "success",
  Pending: "warning",
  Failed: "error",
};

export function methodLabel(method: PaymentMethod | null): string {
  if (method === "Cash") return "Nakit/Elden";
  if (method === "BankTransfer") return "IBAN";
  return "Online";
}

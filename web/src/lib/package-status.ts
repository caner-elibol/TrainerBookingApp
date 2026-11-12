import type { BadgeVariant } from "@/components/ui/Badge";

export function remainingSessionsBadgeVariant(remaining: number): BadgeVariant {
  if (remaining <= 0) return "error";
  if (remaining === 1) return "warning";
  if (remaining === 2) return "warning";
  return "gray";
}

export function remainingSessionsLabel(remaining: number): string {
  if (remaining <= 0) return "Paket bitti";
  if (remaining === 1) return "1 seans kaldı";
  return `${remaining} seans kaldı`;
}

export function isRenewalCandidate(remaining: number): boolean {
  return remaining === 1;
}

export function isPackageExpired(remaining: number): boolean {
  return remaining <= 0;
}

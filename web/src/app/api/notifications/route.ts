import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { TrainerAppointment, TrainerPaymentsSummary } from "@/lib/types";

export interface NotificationItem {
  id: string;
  title: string;
  subtitle?: string;
  timestampUtc: string;
  href: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
}

function sortAndCap(items: NotificationItem[], cap: number): NotificationItem[] {
  return items.sort((a, b) => new Date(b.timestampUtc).getTime() - new Date(a.timestampUtc).getTime()).slice(0, cap);
}

async function trainerNotifications(): Promise<NotificationItem[]> {
  const [paymentsResult, appointmentsResult] = await Promise.all([
    authedFetch<TrainerPaymentsSummary>("/api/trainers/me/payments"),
    authedFetch<TrainerAppointment[]>("/api/trainers/me/appointments"),
  ]);

  const items: NotificationItem[] = [];

  const payments = (paymentsResult.ok ? paymentsResult.data?.payments : null) ?? [];
  for (const p of payments.filter((p) => p.status === "Paid").slice(0, 5)) {
    items.push({
      id: `payment-${p.paymentId}`,
      title: `${p.clientName} paket satın aldı`,
      subtitle: `${p.packageTitle} · ₺${p.amount.toLocaleString("tr-TR")}`,
      timestampUtc: p.createdAtUtc,
      href: "/payments",
    });
  }

  const appointments = (appointmentsResult.ok ? appointmentsResult.data : null) ?? [];
  const now = Date.now();
  const upcoming = appointments
    .filter((a) => a.status !== "Cancelled" && new Date(a.startTimeUtc).getTime() >= now)
    .sort((a, b) => new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime())
    .slice(0, 3);
  for (const a of upcoming) {
    items.push({
      id: `appointment-${a.id}`,
      title: `${a.clientName} ile randevun var`,
      subtitle: new Date(a.startTimeUtc).toLocaleString("tr-TR", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }),
      timestampUtc: a.startTimeUtc,
      href: `/clients/${a.clientId}`,
    });
  }

  return sortAndCap(items, 6);
}

async function clientNotifications(): Promise<NotificationItem[]> {
  return [];
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ items: [] } satisfies NotificationsResponse, { status: 401 });
  }

  const items = user.role === "Trainer" ? await trainerNotifications() : await clientNotifications();
  return NextResponse.json({ items } satisfies NotificationsResponse);
}

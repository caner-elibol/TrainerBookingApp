"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon, Search, UserPlus } from "lucide-react";
import type { TrainerAppointment, TrainerClientSummary } from "@/lib/types";
import { ageFromDateOfBirth, formatLocalTime } from "@/lib/date";
import { remainingSessionsBadgeVariant, remainingSessionsLabel } from "@/lib/package-status";
import AvatarCircle from "@/components/ui/AvatarCircle";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

const PAGE_SIZE = 6;

function nextAppointmentFor(clientId: string, appointments: TrainerAppointment[]) {
  const now = Date.now();
  return appointments
    .filter((a) => a.clientId === clientId && a.status !== "Cancelled" && new Date(a.startTimeUtc).getTime() >= now)
    .sort((a, b) => new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime())[0];
}

export default function ClientsTable({
  clients,
  appointments,
}: {
  clients: TrainerClientSummary[];
  appointments: TrainerAppointment[];
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.clientName.toLowerCase().includes(q));
  }, [clients, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-foreground">Danışan Listesi ({filtered.length})</h2>
        <div className="relative w-full">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            placeholder="Listede ara..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-border-default bg-surface py-2 pr-3 pl-9 text-sm text-foreground placeholder:text-ink-muted focus:border-ink focus:ring-2 focus:ring-ink/10 focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title={clients.length === 0 ? "Henüz danışanın yok." : "Aramanızla eşleşen danışan bulunamadı."}
          description={clients.length === 0 ? "İlk danışanını ekleyerek başlayabilirsin." : undefined}
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {pageItems.map((client) => {
            const isActive = client.remainingSessions > 0;
            const nextAppt = nextAppointmentFor(client.clientId, appointments);
            return (
              <li key={client.clientId}>
                <Link
                  href={`/clients/${client.clientId}`}
                  className="flex items-center gap-3 rounded-xl border border-border-default bg-surface p-3 transition-colors hover:bg-surface-muted"
                >
                  <AvatarCircle name={client.clientName} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-foreground">{client.clientName}</p>
                      <Badge variant={isActive ? "success" : "error"} className="shrink-0">
                        {isActive ? "Aktif" : "Pasif"}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-ink-secondary">
                      {client.activePackageTitle ?? "Paket yok"}
                      {client.activePackageTitle && (
                        <>
                          {" · "}
                          <span
                            className={
                              remainingSessionsBadgeVariant(client.remainingSessions) === "error"
                                ? "font-medium text-error-600"
                                : remainingSessionsBadgeVariant(client.remainingSessions) === "warning"
                                  ? "font-medium text-warning-700"
                                  : undefined
                            }
                          >
                            {remainingSessionsLabel(client.remainingSessions)}
                          </span>
                        </>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">
                      {nextAppt
                        ? `Sonraki: ${new Date(nextAppt.startTimeUtc).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} · ${formatLocalTime(nextAppt.startTimeUtc)}`
                        : "Randevu yok"}
                    </p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 border-t border-border-default pt-3">
          <p className="shrink-0 text-xs text-ink-secondary">
            {currentPage}/{totalPages} sayfa
          </p>
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Önceki sayfa"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-secondary hover:bg-surface-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-medium ${
                  p === currentPage ? "bg-primary text-white" : "text-ink-secondary hover:bg-surface-muted"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Sonraki sayfa"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-secondary hover:bg-surface-muted disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { formatPhone } from "@/lib/phone";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Mail, Phone, Target } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { authedFetch } from "@/lib/backend-client";
import type { BodyMetric, ClientGoal, ClientHistory, ClientNote, PackageDto, TrainerAppointment } from "@/lib/types";
import { ageFromDateOfBirth, formatLocalTime } from "@/lib/date";
import { isRenewalCandidate, remainingSessionsBadgeVariant, remainingSessionsLabel } from "@/lib/package-status";
import ButtonLink from "@/components/ui/ButtonLink";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import SectionCard from "@/components/ui/SectionCard";
import AvatarCircle from "@/components/ui/AvatarCircle";
import { Package, CheckCircle2, CalendarClock, Layers, XCircle } from "lucide-react";
import ClientDetailTabs from "./ClientDetailTabs";
import PaymentHistoryCard from "./PaymentHistoryCard";
import AssignPackageDialog from "./AssignPackageDialog";

export default async function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Trainer") redirect("/");

  const [historyResult, goalsResult, notesResult, appointmentsResult, bodyMetricsResult, packagesResult] = await Promise.all([
    authedFetch<ClientHistory>(`/api/trainers/me/clients/${clientId}/history`),
    authedFetch<ClientGoal[]>(`/api/trainers/me/clients/${clientId}/goals`),
    authedFetch<ClientNote[]>(`/api/trainers/me/clients/${clientId}/notes`),
    authedFetch<TrainerAppointment[]>("/api/trainers/me/appointments"),
    authedFetch<BodyMetric[]>(`/api/trainers/me/clients/${clientId}/body-metrics`),
    authedFetch<PackageDto[]>("/api/packages/mine"),
  ]);
  const trainerPackages = (packagesResult.ok ? packagesResult.data : null)?.filter((p) => p.isActive) ?? [];

  if (!historyResult.ok || !historyResult.data) notFound();
  const { clientName, email, phone, city, dateOfBirth, packages, payments } = historyResult.data;
  const goals = (goalsResult.ok ? goalsResult.data : null) ?? [];
  const notes = (notesResult.ok ? notesResult.data : null) ?? [];
  const clientAppointments = (appointmentsResult.ok ? appointmentsResult.data : null)?.filter((a) => a.clientId === clientId) ?? [];
  const bodyMetrics = (bodyMetricsResult.ok ? bodyMetricsResult.data : null) ?? [];

  const paidActivePackage = packages.find((p) => p.isActive && p.remainingSessions > 0);
  const pendingPackage = packages.find((p) => !p.isActive);
  const activePackage = paidActivePackage ?? pendingPackage ?? packages[0];
  const isPendingPackage = !paidActivePackage && !!pendingPackage && activePackage === pendingPackage;
  const completedSessions = activePackage ? activePackage.totalSessions - activePackage.remainingSessions : 0;
  const noShowCount = clientAppointments.filter((a) => a.status === "NoShow").length;
  const nextAppt = clientAppointments
    .filter((a) => a.status !== "Cancelled" && new Date(a.startTimeUtc).getTime() >= new Date().getTime())
    .sort((a, b) => new Date(a.startTimeUtc).getTime() - new Date(b.startTimeUtc).getTime())[0];
  const lastPayment = [...payments].sort((a, b) => new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime())[0];
  const lastNote = notes[0];
  const showRenewalCta = !!activePackage && isRenewalCandidate(activePackage.remainingSessions);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <ButtonLink href="/clients" variant="ghost" size="sm" className="-ml-2 w-fit">
          <ChevronLeft className="h-4 w-4" />
          Danışanlara Geri Dön
        </ButtonLink>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold text-foreground">Danışan Detayı</h1>
            <p className="mt-1 text-sm text-ink-secondary">{clientName}&apos;ın profil bilgileri, randevuları, notları ve ilerleme durumu.</p>
          </div>
        </div>
      </div>

      <SectionCard>
        <div className="flex items-center gap-4">
          <AvatarCircle name={clientName} size={72} className="text-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-bold text-foreground">{clientName}</h2>
              <Badge variant={isPendingPackage ? "warning" : activePackage && activePackage.remainingSessions > 0 ? "success" : "error"}>
                {isPendingPackage ? "Ödeme Bekliyor" : activePackage && activePackage.remainingSessions > 0 ? "Aktif" : "Pasif"}
              </Badge>
            </div>
            {(dateOfBirth || city) && (
              <p className="mt-1 text-sm text-ink-secondary">
                {dateOfBirth ? `${ageFromDateOfBirth(dateOfBirth)} yaşında` : null}
                {dateOfBirth && city ? " · " : null}
                {city}
              </p>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-1.5 border-t border-border-default pt-3 text-sm text-ink-secondary">
          {phone && (
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-ink-muted" /> {formatPhone(phone)}
            </span>
          )}
          <span className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-ink-muted" /> {email}
          </span>
        </div>
        <div className="mt-3">
          <AssignPackageDialog clientId={clientId} packages={trainerPackages} />
        </div>
      </SectionCard>

      <SectionCard title="Özet">
        <div className="flex flex-col divide-y divide-border-default">
          <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0">
            <span className="flex items-center gap-2 text-sm text-ink-secondary">
              <Layers className="h-4 w-4 text-ink-muted" /> Kalan Seans
            </span>
            {activePackage ? (
              <Badge variant={remainingSessionsBadgeVariant(activePackage.remainingSessions)}>
                {remainingSessionsLabel(activePackage.remainingSessions)}
              </Badge>
            ) : (
              <span className="text-sm font-medium text-ink-muted">Paket yok</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <span className="flex items-center gap-2 text-sm text-ink-secondary">
              <CalendarClock className="h-4 w-4 text-ink-muted" /> Sonraki Randevu
            </span>
            <span className="text-right text-sm font-medium text-foreground">
              {nextAppt
                ? `${new Date(nextAppt.startTimeUtc).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} · ${formatLocalTime(nextAppt.startTimeUtc)}`
                : "Randevu yok"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 py-2.5">
            <span className="flex items-center gap-2 text-sm text-ink-secondary">
              <Package className="h-4 w-4 text-ink-muted" /> Son Ödeme
            </span>
            <span className="text-right text-sm font-medium text-foreground">
              {lastPayment ? `₺${lastPayment.amount.toLocaleString("tr-TR")}` : "Ödeme yok"}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3 py-2.5 last:pb-0">
            <span className="flex items-center gap-2 text-sm text-ink-secondary">
              <Target className="h-4 w-4 text-ink-muted" /> Son Not
            </span>
            <span className="max-w-[60%] truncate text-right text-sm font-medium text-foreground">
              {lastNote ? lastNote.body : "Not yok"}
            </span>
          </div>
        </div>

        {showRenewalCta && (
          <div className="mt-3 flex flex-col items-start gap-3 rounded-xl bg-warning-50 px-4 py-3">
            <p className="text-sm font-medium break-words text-warning-700">Paketi bitmek üzere — yenilemeyi hatırlat.</p>
            <AssignPackageDialog clientId={clientId} packages={trainerPackages} variant="renewal" />
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Package}
          label="Aktif Paket"
          value={activePackage?.packageTitle ?? "Paket yok"}
          caption={activePackage ? `${activePackage.totalSessions} seanslık paket` : undefined}
        />
        <StatCard
          icon={Layers}
          label="Kalan Seans"
          value={activePackage ? `${activePackage.remainingSessions} / ${activePackage.totalSessions}` : "0 / 0"}
        />
        <StatCard icon={CheckCircle2} label="Tamamlanan Seans" value={completedSessions} caption={activePackage ? `Toplam ${activePackage.totalSessions} seans` : undefined} />
        <StatCard icon={XCircle} label="Tamamlanmayan Antrenman" value={noShowCount} caption="Gelmedi olarak işaretlenen" />
      </div>

      <SectionCard>
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Target className="h-4 w-4 text-ink" /> Hedefleri
        </div>
        {goals.length === 0 ? (
          <p className="mt-2 text-sm text-ink-secondary">Henüz hedef eklenmedi.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5 text-sm text-ink-secondary">
            {goals.map((g) => (
              <li key={g.id} className="flex gap-2">
                <span className="text-ink">•</span> {g.label}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard>
        <ClientDetailTabs
          clientId={clientId}
          packages={packages}
          initialGoals={goals}
          initialNotes={notes}
          appointments={clientAppointments}
          initialBodyMetrics={bodyMetrics}
        />
      </SectionCard>

      <SectionCard title="Ödeme Geçmişi" action={<span className="text-sm font-medium text-ink">Tümünü Gör →</span>}>
        <PaymentHistoryCard clientId={clientId} initialPayments={payments} />
      </SectionCard>

      <SectionCard title="Son Notlar" action={<span className="text-sm font-medium text-ink">Tümünü Gör →</span>}>
        {notes.length === 0 ? (
          <p className="text-sm text-ink-secondary">Henüz not yok.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {notes.slice(0, 2).map((note) => (
              <div key={note.id} className="flex gap-3">
                <AvatarCircle name={note.authorName} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{note.authorName}</p>
                    <p className="text-xs text-ink-muted">
                      {new Date(note.createdAtUtc).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-ink-secondary">{note.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

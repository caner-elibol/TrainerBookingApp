"use client";

import { useState, useTransition } from "react";
import { Calendar, MessageSquare, Plus, TrendingUp } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import type { BodyMetric, ClientGoal, ClientNote, ClientPackageHistory, TrainerAppointment } from "@/lib/types";
import { formatLocalTime } from "@/lib/date";
import { createClientGoal, createClientNote, createBodyMetric } from "./actions";
import { markAttendance } from "../../calendar/actions";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { cn } from "@/lib/cn";

type TabKey = "history" | "notes" | "progress";

const TABS: { key: TabKey; label: string; icon: typeof Calendar }[] = [
  { key: "history", label: "Randevu Geçmişi", icon: Calendar },
  { key: "notes", label: "Notlar", icon: MessageSquare },
  { key: "progress", label: "İlerleme", icon: TrendingUp },
];

const STATUS_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  Completed: { label: "Tamamlandı", variant: "success" },
  Confirmed: { label: "Onaylandı", variant: "brand" },
  NoShow: { label: "Gelmedi", variant: "error" },
};

export default function ClientDetailTabs({
  clientId,
  packages,
  initialGoals,
  initialNotes,
  appointments,
  initialBodyMetrics,
}: {
  clientId: string;
  packages: ClientPackageHistory[];
  initialGoals: ClientGoal[];
  initialNotes: ClientNote[];
  appointments: TrainerAppointment[];
  initialBodyMetrics: BodyMetric[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("history");
  const [goals, setGoals] = useState(initialGoals);
  const [notes, setNotes] = useState(initialNotes);
  const [bodyMetrics, setBodyMetrics] = useState(initialBodyMetrics);
  const [appointmentsState, setAppointmentsState] = useState(appointments);
  const [attendancePending, setAttendancePending] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [goalLabel, setGoalLabel] = useState("");
  const [goalPercent, setGoalPercent] = useState(0);
  const [noteBody, setNoteBody] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [bodyFatPercent, setBodyFatPercent] = useState("");
  const [isPending, startTransition] = useTransition();

  const history = [...appointmentsState]
    .filter((a) => a.status !== "Locked" && a.status !== "Cancelled")
    .sort((a, b) => new Date(b.startTimeUtc).getTime() - new Date(a.startTimeUtc).getTime());
  const packageTitle = packages.find((p) => p.isActive)?.packageTitle ?? packages[0]?.packageTitle ?? "—";

  function handleAttendance(appointmentId: string, attended: boolean) {
    setAttendancePending(appointmentId);
    markAttendance(appointmentId, attended)
      .then((result) => {
        if (!result.success) return;
        setAppointmentsState((prev) =>
          prev.map((a) => (a.id === appointmentId ? { ...a, status: attended ? "Completed" : "NoShow" } : a)),
        );
      })
      .finally(() => setAttendancePending(null));
  }

  function handleAddGoal() {
    if (!goalLabel.trim()) return;
    startTransition(async () => {
      const result = await createClientGoal(clientId, { label: goalLabel, caption: null, percentComplete: goalPercent });
      if (result.success && result.goal) {
        setGoals((prev) => [...prev, result.goal!]);
        setGoalLabel("");
        setGoalPercent(0);
        setShowGoalForm(false);
      }
    });
  }

  function handleAddNote() {
    if (!noteBody.trim()) return;
    startTransition(async () => {
      const result = await createClientNote(clientId, { body: noteBody, tags: [] });
      if (result.success && result.note) {
        setNotes((prev) => [result.note!, ...prev]);
        setNoteBody("");
        setShowNoteForm(false);
      }
    });
  }

  function handleAddMetric() {
    const weight = weightKg.trim() ? Number(weightKg) : null;
    const waist = waistCm.trim() ? Number(waistCm) : null;
    const bodyFat = bodyFatPercent.trim() ? Number(bodyFatPercent) : null;
    if (weight === null && waist === null && bodyFat === null) return;

    startTransition(async () => {
      const result = await createBodyMetric(clientId, {
        weightKg: weight,
        chestCm: null,
        waistCm: waist,
        hipCm: null,
        armCm: null,
        bodyFatPercent: bodyFat,
      });
      if (result.success && result.metric) {
        setBodyMetrics((prev) => [...prev, result.metric!]);
        setWeightKg("");
        setWaistCm("");
        setBodyFatPercent("");
        setShowMetricForm(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 overflow-x-auto border-b border-border-default">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
                isActive ? "border-ink text-ink" : "border-transparent text-ink-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "history" && (
        <div>
          {history.length === 0 ? (
            <EmptyState icon={Calendar} title="Henüz randevu yok." description="Bu danışanla ilk seans tamamlandığında burada görünecek." />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {history.map((a) => {
                const status = STATUS_BADGE[a.status] ?? { label: a.status, variant: "gray" as BadgeVariant };
                const canDecideAttendance = a.status === "Confirmed" && new Date(a.endTimeUtc).getTime() <= now;
                return (
                  <li key={a.id} className="rounded-xl border border-border-default p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {new Date(a.startTimeUtc).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        <p className="text-xs text-ink-secondary">
                          {formatLocalTime(a.startTimeUtc)} - {formatLocalTime(a.endTimeUtc)} · {packageTitle}
                        </p>
                      </div>
                      {!canDecideAttendance && (
                        <Badge variant={status.variant} className="shrink-0">
                          {status.label}
                        </Badge>
                      )}
                    </div>
                    {canDecideAttendance && (
                      <div className="mt-2 flex gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={attendancePending === a.id}
                          onClick={() => handleAttendance(a.id, true)}
                        >
                          Geldi
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={attendancePending === a.id}
                          onClick={() => handleAttendance(a.id, false)}
                        >
                          Gelmedi
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="flex flex-col gap-4">
          {notes.length === 0 && !showNoteForm && <p className="py-4 text-center text-sm text-ink-secondary">Henüz not yok.</p>}
          {notes.map((note) => (
            <div key={note.id} className="rounded-xl border border-border-default p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{note.authorName}</p>
                <p className="text-xs text-ink-muted">
                  {new Date(note.createdAtUtc).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <p className="mt-2 text-sm text-ink-secondary">{note.body}</p>
              {note.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="brand">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}

          {showNoteForm ? (
            <div className="flex flex-col gap-2 rounded-xl border border-border-default p-4">
              <Textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Danışan hakkında bir not yaz..."
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowNoteForm(false)}>
                  İptal
                </Button>
                <Button variant="secondary" size="sm" onClick={handleAddNote} isLoading={isPending}>
                  Kaydet
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="self-start" onClick={() => setShowNoteForm(true)}>
              <Plus className="h-3.5 w-3.5" /> Not Ekle
            </Button>
          )}
        </div>
      )}

      {activeTab === "progress" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-foreground">Hedefler</p>
            {goals.length === 0 && !showGoalForm && <p className="py-2 text-sm text-ink-secondary">Henüz hedef yok.</p>}
            {goals.map((goal) => (
              <div key={goal.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-ink-secondary">{goal.label}</span>
                  <span className="font-semibold text-foreground">%{goal.percentComplete}</span>
                </div>
                <ProgressBar percent={goal.percentComplete} />
              </div>
            ))}

            {showGoalForm ? (
              <div className="flex flex-col gap-2 rounded-xl border border-border-default p-4">
                <Input value={goalLabel} onChange={(e) => setGoalLabel(e.target.value)} placeholder="Hedef (örn. Kilo vermek)" />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ink-secondary">İlerleme:</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={goalPercent}
                    onChange={(e) => setGoalPercent(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-ink-secondary">%</span>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowGoalForm(false)}>
                    İptal
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleAddGoal} isLoading={isPending}>
                    Kaydet
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="self-start" onClick={() => setShowGoalForm(true)}>
                <Plus className="h-3.5 w-3.5" /> Hedef Ekle
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-border-default pt-5">
            <p className="text-sm font-semibold text-foreground">Vücut Ölçümleri</p>
            {bodyMetrics.length === 0 && !showMetricForm && <p className="py-2 text-sm text-ink-secondary">Henüz ölçüm yok.</p>}
            {bodyMetrics.length > 0 && (
              <ul className="flex flex-col gap-2">
                {[...bodyMetrics]
                  .reverse()
                  .slice(0, 5)
                  .map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2 rounded-lg border border-border-default px-3 py-2 text-sm">
                      <span className="text-ink-secondary">
                        {new Date(m.recordedAtUtc).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                      </span>
                      <span className="flex gap-3 text-foreground">
                        <span>{m.weightKg !== null ? `${m.weightKg} kg` : "—"}</span>
                        <span>{m.waistCm !== null ? `${m.waistCm} cm bel` : "—"}</span>
                        <span>{m.bodyFatPercent !== null ? `%${m.bodyFatPercent} yağ` : "—"}</span>
                      </span>
                    </li>
                  ))}
              </ul>
            )}

            {showMetricForm ? (
              <div className="flex flex-col gap-2 rounded-xl border border-border-default p-4">
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex flex-col gap-1 text-xs text-ink-secondary">
                    Kilo (kg)
                    <Input type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-ink-secondary">
                    Bel (cm)
                    <Input type="number" step="0.1" value={waistCm} onChange={(e) => setWaistCm(e.target.value)} />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-ink-secondary">
                    Yağ Oranı (%)
                    <Input type="number" step="0.1" value={bodyFatPercent} onChange={(e) => setBodyFatPercent(e.target.value)} />
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowMetricForm(false)}>
                    İptal
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleAddMetric} isLoading={isPending}>
                    Kaydet
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="self-start" onClick={() => setShowMetricForm(true)}>
                <Plus className="h-3.5 w-3.5" /> Ölçüm Ekle
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

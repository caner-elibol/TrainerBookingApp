"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Dumbbell, PersonStanding, Bike, HeartPulse, Sparkles } from "lucide-react";
import { completeOnboarding } from "./actions";
import type { OnboardingRequest, TrainerSettingsResponse } from "@/lib/types";
import { DAYS, buildInitialDayStates, toWorkingHourDtos, type DayState } from "@/components/trainer/workingHours";
import WorkingHoursEditor from "@/components/trainer/WorkingHoursEditor";
import Stepper from "@/components/ui/Stepper";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import SectionCard from "@/components/ui/SectionCard";
import { cn } from "@/lib/cn";

const STEPS = [{ label: "Hizmet Alanı" }, { label: "Çalışma Programın" }, { label: "Seans Ayarları" }];

const EXPERTISE_OPTIONS = [
  { label: "Fitness", icon: Dumbbell },
  { label: "Reformer Pilates", icon: HeartPulse },
  { label: "Cycle", icon: Bike },
  { label: "Yoga", icon: Sparkles },
  { label: "Functional Training", icon: PersonStanding },
];

const SESSION_DURATION_OPTIONS = [30, 45, 50, 60];
const BUFFER_OPTIONS = [0, 5, 10, 15];

export default function OnboardingWizard({ initialSettings }: { initialSettings: TrainerSettingsResponse | null }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<string[]>([]);

  const [expertiseArea, setExpertiseArea] = useState(initialSettings?.expertiseArea ?? "Fitness");
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(initialSettings?.sessionDurationMinutes ?? 50);
  const [bufferDurationMinutes, setBufferDurationMinutes] = useState(initialSettings?.bufferDurationMinutes ?? 5);
  const [days, setDays] = useState<Record<number, DayState>>(() => buildInitialDayStates(initialSettings));

  const previewSlots = useMemo(() => {
    const enabledDays = DAYS.filter((d) => days[d.value].enabled).slice(0, 5);
    return enabledDays.map((d) => {
      const state = days[d.value];
      const startHour = Number(state.startTime.slice(0, 2));
      const endHour = Number(state.endTime.slice(0, 2));
      const slots: string[] = [];
      for (let h = startHour; h < Math.min(endHour, startHour + 6); h++) {
        slots.push(`${String(h).padStart(2, "0")}:00 – ${String(h + 1).padStart(2, "0")}:00`);
      }
      return { label: d.label, slots };
    });
  }, [days]);

  function handleSubmit() {
    setErrors([]);

    const payload: OnboardingRequest = {
      expertiseArea,
      sessionDurationMinutes,
      bufferDurationMinutes,
      workingHours: toWorkingHourDtos(days),
    };

    startTransition(async () => {
      const result = await completeOnboarding(payload);
      if (!result.success) {
        setErrors(result.errors);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <SectionCard>
        <Stepper steps={STEPS} currentStep={step} className="mb-6" />

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Hizmet Alanı</h2>
              <p className="text-sm text-ink-secondary">Danışanlarına sunacağın hizmetleri seç.</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {EXPERTISE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = expertiseArea === opt.label;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setExpertiseArea(opt.label)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors",
                      isSelected ? "border-ink bg-subtle" : "border-border-default hover:bg-surface-muted",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-ink" />
                      <span className="font-medium text-foreground">{opt.label}</span>
                    </span>
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2",
                        isSelected ? "border-ink bg-primary text-white" : "border-border-strong",
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <Button type="button" variant="secondary" onClick={() => setStep(2)} className="self-end">
              İleri
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Çalışma Programın</h2>
              <p className="text-sm text-ink-secondary">Haftalık çalışma saatlerini belirle.</p>
            </div>
            <WorkingHoursEditor days={days} onChange={setDays} />
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Geri
              </Button>
              <Button type="button" variant="secondary" disabled={!DAYS.some((d) => days[d.value].enabled)} onClick={() => setStep(3)}>
                İleri
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Seans Ayarları</h2>
              <p className="text-sm text-ink-secondary">Seans süresi ve seanslar arası buffer süresini belirle.</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Seans Süresi</p>
              <div className="flex flex-wrap gap-2">
                {SESSION_DURATION_OPTIONS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSessionDurationMinutes(mins)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm font-semibold",
                      sessionDurationMinutes === mins
                        ? "border-ink bg-subtle text-ink"
                        : "border-border-default text-ink-secondary hover:bg-surface-muted",
                    )}
                  >
                    {mins} dk
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Seanslar Arası Süre</p>
              <div className="flex flex-wrap gap-2">
                {BUFFER_OPTIONS.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setBufferDurationMinutes(mins)}
                    className={cn(
                      "rounded-lg border px-4 py-2 text-sm font-semibold",
                      bufferDurationMinutes === mins
                        ? "border-ink bg-subtle text-ink"
                        : "border-border-default text-ink-secondary hover:bg-surface-muted",
                    )}
                  >
                    {mins} dk
                  </button>
                ))}
              </div>
            </div>

            {![30, 45, 50, 60].includes(sessionDurationMinutes) && (
              <Input
                type="number"
                min={5}
                value={sessionDurationMinutes}
                onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                aria-label="Özel seans süresi (dakika)"
              />
            )}

            {errors.length > 0 && (
              <Alert variant="error">
                <ul className="list-inside list-disc">
                  {errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Geri
              </Button>
              <Button type="button" variant="secondary" isLoading={isPending} onClick={handleSubmit}>
                {isPending ? "Kaydediliyor…" : "Takvimimi Oluştur"}
              </Button>
            </div>
          </div>
        )}
      </SectionCard>

      <div className="flex flex-col gap-6">
        <SectionCard title="Takvim Önizlemesi">
          <div className="flex flex-col gap-3">
            {previewSlots.length === 0 ? (
              <p className="text-sm text-ink-secondary">Önizleme için en az bir gün seç.</p>
            ) : (
              previewSlots.map((day) => (
                <div key={day.label}>
                  <p className="mb-1.5 text-xs font-semibold text-ink-secondary">{day.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {day.slots.map((slot) => (
                      <span key={slot} className="rounded-md bg-subtle px-2 py-1 text-xs font-medium text-ink">
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="CoreFit senin için otomatik oluşturur">
          <ul className="flex flex-col gap-2.5 text-sm text-ink-secondary">
            {[
              "Belirlediğin kurallara göre uygun saatleri otomatik oluşturur.",
              "Mola sürelerini ve seans aralarını senin yerine planlar.",
              "Dilediğin zaman takvimini düzenleyebilir, manuel randevu ekleyebilirsin.",
            ].map((line) => (
              <li key={line} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                {line}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}

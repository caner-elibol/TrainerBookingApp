"use client";

import { Clock } from "lucide-react";
import { useSettingsForm } from "../useSettingsForm";
import SettingsSaveBar from "../SettingsSaveBar";
import { cn } from "@/lib/cn";
import type { TrainerSettingsResponse } from "@/lib/types";

const SESSION_DURATION_OPTIONS = [30, 45, 50, 60];
const BUFFER_OPTIONS = [0, 5, 10, 15];

export default function SessionPanel({ initialSettings }: { initialSettings: TrainerSettingsResponse | null }) {
  const form = useSettingsForm(initialSettings, null);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold text-foreground">Seans Ayarları</h2>
        <p className="text-sm text-ink-secondary">Seans süresi ve seanslar arası buffer süresini belirle.</p>
      </div>
      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
          <Clock className="h-4 w-4 text-ink" /> Seans Süresi
        </p>
        <div className="flex flex-wrap gap-2">
          {SESSION_DURATION_OPTIONS.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => form.setSessionDurationMinutes(mins)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-semibold",
                form.sessionDurationMinutes === mins
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
              onClick={() => form.setBufferDurationMinutes(mins)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-semibold",
                form.bufferDurationMinutes === mins
                  ? "border-ink bg-subtle text-ink"
                  : "border-border-default text-ink-secondary hover:bg-surface-muted",
              )}
            >
              {mins} dk
            </button>
          ))}
        </div>
      </div>
      <SettingsSaveBar isPending={form.isPending} saved={form.saved} errors={form.errors} onSave={form.handleSaveHours} />
    </div>
  );
}

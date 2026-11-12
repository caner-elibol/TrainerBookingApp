"use client";

import Input from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { DAYS, type DayState } from "./workingHours";

export interface WorkingHoursEditorProps {
  days: Record<number, DayState>;
  onChange: (days: Record<number, DayState>) => void;
}

export default function WorkingHoursEditor({ days, onChange }: WorkingHoursEditorProps) {
  function updateDay(value: number, patch: Partial<DayState>) {
    onChange({ ...days, [value]: { ...days[value], ...patch } });
  }

  return (
    <div className="flex flex-col divide-y divide-border-default">
      {DAYS.map((day) => {
        const state = days[day.value];
        return (
          <div key={day.value} className="flex flex-col gap-3 py-3.5">
            <label className="flex w-36 shrink-0 cursor-pointer items-center gap-3">
              <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
                <input
                  type="checkbox"
                  checked={state.enabled}
                  onChange={(e) => updateDay(day.value, { enabled: e.target.checked })}
                  className="peer sr-only"
                />
                <span className="absolute inset-0 rounded-full bg-border-strong transition-colors peer-checked:bg-primary" />
                <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </span>
              <span className="font-medium text-foreground">{day.label}</span>
            </label>

            <div
              className={cn(
                "flex flex-wrap items-center gap-3 text-sm",
                !state.enabled && "pointer-events-none opacity-40",
              )}
            >
              <div className="w-28">
                <Input type="time" value={state.startTime} onChange={(e) => updateDay(day.value, { startTime: e.target.value })} />
              </div>
              <span className="text-ink-secondary">–</span>
              <div className="w-28">
                <Input type="time" value={state.endTime} onChange={(e) => updateDay(day.value, { endTime: e.target.value })} />
              </div>

              <label className="ml-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={state.hasBreak}
                  onChange={(e) => updateDay(day.value, { hasBreak: e.target.checked })}
                  className="h-4 w-4 rounded border-border-strong text-ink focus:ring-ink"
                />
                <span className="text-ink-secondary">Öğle Arası</span>
              </label>

              {state.hasBreak && (
                <div className="flex w-full flex-wrap items-center gap-3 border-l-2 border-border-strong pl-3">
                  <div className="w-24">
                    <Input
                      type="time"
                      value={state.breakStartTime}
                      onChange={(e) => updateDay(day.value, { breakStartTime: e.target.value })}
                    />
                  </div>
                  <span className="text-ink-secondary">–</span>
                  <div className="w-24">
                    <Input
                      type="time"
                      value={state.breakEndTime}
                      onChange={(e) => updateDay(day.value, { breakEndTime: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

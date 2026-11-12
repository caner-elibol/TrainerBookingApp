"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { isoFor, daysInMonth } from "@/lib/date";

const WEEKDAY_LABELS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cts", "Paz"];

export interface MiniCalendarProps {
  markedDates: Set<string>;
  selectedDate?: string | null;
  onSelectDate?: (iso: string) => void;
}

export default function MiniCalendar({ markedDates, selectedDate, onSelectDate }: MiniCalendarProps) {
  const today = new Date();
  const todayIso = today.toLocaleDateString("en-CA");
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth());

  const firstWeekday = (new Date(visibleYear, visibleMonth, 1).getDay() + 6) % 7;
  const totalDays = daysInMonth(visibleYear, visibleMonth);
  const cells: Array<{ day: number; iso: string } | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => ({ day: i + 1, iso: isoFor(visibleYear, visibleMonth, i + 1) })),
  ];

  const monthLabel = new Date(visibleYear, visibleMonth, 1).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  function goPrev() {
    setVisibleMonth((m) => {
      if (m === 0) {
        setVisibleYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }

  function goNext() {
    setVisibleMonth((m) => {
      if (m === 11) {
        setVisibleYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-foreground capitalize">{monthLabel}</p>
        <div className="flex gap-1">
          <button type="button" onClick={goPrev} aria-label="Önceki ay" className="flex h-7 w-7 items-center justify-center rounded-md text-ink-secondary hover:bg-surface-muted">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={goNext} aria-label="Sonraki ay" className="flex h-7 w-7 items-center justify-center rounded-md text-ink-secondary hover:bg-surface-muted">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="text-xs font-medium text-ink-muted">
            {label}
          </span>
        ))}
        {cells.map((cell, index) => {
          if (!cell) return <span key={`empty-${index}`} />;
          const isToday = cell.iso === todayIso;
          const isSelected = cell.iso === selectedDate;
          const isMarked = markedDates.has(cell.iso);

          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onSelectDate?.(cell.iso)}
              className={cn(
                "mx-auto flex h-8 w-8 flex-col items-center justify-center rounded-full text-xs transition-colors",
                isSelected && "bg-primary font-semibold text-white",
                !isSelected && isToday && "bg-subtle-strong font-semibold text-ink",
                !isSelected && !isToday && "text-foreground hover:bg-surface-muted",
              )}
            >
              {cell.day}
              {isMarked && <span className={cn("mt-0.5 h-1 w-1 rounded-full", isSelected ? "bg-white" : "bg-primary")} />}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" /> Randevu var
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-subtle-strong" /> Bugün
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary ring-2 ring-neutral-300" /> Seçili tarih
        </span>
      </div>
    </div>
  );
}

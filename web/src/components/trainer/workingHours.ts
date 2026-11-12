import type { DayOfWeekValue, TrainerSettingsResponse, WorkingHourDto } from "@/lib/types";

export const DAYS: { value: DayOfWeekValue; label: string }[] = [
  { value: 1, label: "Pazartesi" },
  { value: 2, label: "Salı" },
  { value: 3, label: "Çarşamba" },
  { value: 4, label: "Perşembe" },
  { value: 5, label: "Cuma" },
  { value: 6, label: "Cumartesi" },
  { value: 0, label: "Pazar" },
];

export interface DayState {
  enabled: boolean;
  startTime: string;
  endTime: string;
  hasBreak: boolean;
  breakStartTime: string;
  breakEndTime: string;
}

export function defaultDayState(enabled: boolean): DayState {
  return {
    enabled,
    startTime: "09:00",
    endTime: "20:00",
    hasBreak: false,
    breakStartTime: "13:00",
    breakEndTime: "14:00",
  };
}

export function buildInitialDayStates(initial: TrainerSettingsResponse | null): Record<number, DayState> {
  const map: Record<number, DayState> = {};
  const weekdays = new Set([1, 2, 3, 4, 5]);
  for (const day of DAYS) {
    map[day.value] = defaultDayState(!initial && weekdays.has(day.value));
  }

  if (initial) {
    for (const wh of initial.workingHours) {
      map[wh.dayOfWeek] = {
        enabled: true,
        startTime: wh.startTime.slice(0, 5),
        endTime: wh.endTime.slice(0, 5),
        hasBreak: Boolean(wh.breakStartTime && wh.breakEndTime),
        breakStartTime: wh.breakStartTime?.slice(0, 5) ?? "13:00",
        breakEndTime: wh.breakEndTime?.slice(0, 5) ?? "14:00",
      };
    }
  }

  return map;
}

export function toWorkingHourDtos(days: Record<number, DayState>): WorkingHourDto[] {
  return DAYS.filter((d) => days[d.value].enabled).map((d) => {
    const state = days[d.value];
    return {
      dayOfWeek: d.value,
      startTime: `${state.startTime}:00`,
      endTime: `${state.endTime}:00`,
      breakStartTime: state.hasBreak ? `${state.breakStartTime}:00` : null,
      breakEndTime: state.hasBreak ? `${state.breakEndTime}:00` : null,
    };
  });
}

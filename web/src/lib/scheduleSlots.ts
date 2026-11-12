import type { WorkingHourDto } from "@/lib/types";

export interface ScheduleSlot {
  hour: number;
  minute: number;
  label: string;
}

function timeStringToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function computeSlotStarts(
  workingHours: WorkingHourDto[],
  sessionMinutes: number,
  bufferMinutes: number,
): ScheduleSlot[] {
  const blockMinutes = sessionMinutes + bufferMinutes;
  if (blockMinutes <= 0) return [];

  const slots = new Map<number, ScheduleSlot>();

  for (const wh of workingHours) {
    const startMinutes = timeStringToMinutes(wh.startTime);
    const endMinutes = timeStringToMinutes(wh.endTime);

    for (let current = startMinutes; current + sessionMinutes <= endMinutes; current += blockMinutes) {
      if (!slots.has(current)) {
        const hour = Math.floor(current / 60);
        const minute = current % 60;
        slots.set(current, { hour, minute, label: `${pad(hour)}:${pad(minute)}` });
      }
    }
  }

  return Array.from(slots.entries())
    .sort(([a], [b]) => a - b)
    .map(([, slot]) => slot);
}

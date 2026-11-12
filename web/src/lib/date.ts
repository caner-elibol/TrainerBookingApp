export function isoFor(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function isoDate(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

export function localDayOf(utcIso: string): string {
  return new Date(utcIso).toLocaleDateString("en-CA");
}

export function formatLocalTime(utcIso: string): string {
  return new Date(utcIso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function localHourOf(utcIso: string): number {
  return new Date(utcIso).getHours();
}

export function localTimeKeyOf(utcIso: string): string {
  const d = new Date(utcIso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, amount: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

export const TR_WEEKDAY_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
export const TR_WEEKDAY_SHORT_MONDAY_FIRST = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export function formatDayMonth(date: Date): string {
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const startLabel = weekStart.toLocaleDateString("tr-TR", { day: "numeric", month: sameMonth ? undefined : "long" });
  const endLabel = weekEnd.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  return `${startLabel} – ${endLabel}`;
}

export function ageFromDateOfBirth(dateOfBirth: string): number {
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const hasHadBirthdayThisYear = today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hasHadBirthdayThisYear) age--;
  return age;
}

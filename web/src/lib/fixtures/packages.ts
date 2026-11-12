export type PackageCategory = "fitness" | "pilates" | "online" | "nutrition" | "duo";

export function categoryForTitle(title: string): PackageCategory {
  const lower = title.toLowerCase();
  if (lower.includes("pilates")) return "pilates";
  if (lower.includes("online")) return "online";
  if (lower.includes("beslenme")) return "nutrition";
  if (lower.includes("duo") || lower.includes("ikili")) return "duo";
  return "fitness";
}

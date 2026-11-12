import { BarChart3, Calendar, History, Home, Package, Settings, User, Users, Wallet } from "lucide-react";

export interface TrainerNavItem {
  href: string;
  label: string;
  icon: typeof Home;
  matchPrefixes?: string[];
}

export const TRAINER_NAV_ITEMS: TrainerNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/calendar", label: "Takvim", icon: Calendar },
  { href: "/appointment-history", label: "Randevu Geçmişi", icon: History },
  { href: "/clients", label: "Danışanlar", icon: Users },
  { href: "/packages", label: "Paketler", icon: Package },
  { href: "/payments", label: "Ödemeler", icon: Wallet },
  { href: "/reports", label: "Raporlar", icon: BarChart3 },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export const TRAINER_BOTTOM_NAV_ITEMS: TrainerNavItem[] = [
  { href: "/dashboard", label: "Ana Sayfa", icon: Home },
  { href: "/calendar", label: "Takvim", icon: Calendar, matchPrefixes: ["/appointment-history"] },
  { href: "/clients", label: "Müşteriler", icon: Users },
  { href: "/settings", label: "Profil", icon: User, matchPrefixes: ["/packages", "/payments", "/reports"] },
];

export function isNavItemActive(item: TrainerNavItem, pathname: string): boolean {
  return [item.href, ...(item.matchPrefixes ?? [])].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

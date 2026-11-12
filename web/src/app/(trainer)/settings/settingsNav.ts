import { BarChart3, Bell, Calendar, CreditCard, History, MapPin, Package, Settings, User, Wallet } from "lucide-react";
import type { SettingsNavItem } from "@/components/settings/SettingsItem";

export type { SettingsNavItem };

export const SETTINGS_GENERAL_ITEMS: SettingsNavItem[] = [
  { id: "profile", title: "Profil", icon: User, href: "/settings/profile" },
  { id: "working-hours", title: "Çalışma Saatleri", icon: Calendar, href: "/settings/working-hours" },
  { id: "locations", title: "Konumlar", icon: MapPin, href: "/settings/locations" },
  { id: "session", title: "Seans Ayarları", icon: Settings, href: "/settings/session" },
  { id: "notifications", title: "Bildirimler", icon: Bell, href: "/settings/notifications" },
  { id: "payment", title: "Ödeme Yöntemleri", icon: CreditCard, href: "/settings/payment" },
];

export const SETTINGS_OTHER_ITEMS: SettingsNavItem[] = [
  { id: "appointment-history", title: "Randevu Geçmişi", icon: History, href: "/appointment-history" },
  { id: "packages", title: "Paketler", icon: Package, href: "/packages" },
  { id: "payments", title: "Ödemeler", icon: Wallet, href: "/payments" },
  { id: "reports", title: "Raporlar", icon: BarChart3, href: "/reports" },
];

export const SETTINGS_TAB_REDIRECTS: Record<string, string> = {
  profile: "/settings/profile",
  hours: "/settings/working-hours",
  locations: "/settings/locations",
  session: "/settings/session",
  notifications: "/settings/notifications",
  billing: "/settings/payment",
};

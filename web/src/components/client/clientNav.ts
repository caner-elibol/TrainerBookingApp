import { Calendar, Home, Package, Settings } from "lucide-react";

export interface ClientNavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

export const CLIENT_NAV_ITEMS: ClientNavItem[] = [
  { href: "/home", label: "Ana Sayfa", icon: Home },
  { href: "/appointments", label: "Randevularım", icon: Calendar },
  { href: "/my-packages", label: "Paketlerim", icon: Package },
  { href: "/account", label: "Ayarlar", icon: Settings },
];

export const CLIENT_BOTTOM_NAV_ITEMS: ClientNavItem[] = [
  { href: "/home", label: "Ana Sayfa", icon: Home },
  { href: "/appointments", label: "Randevular", icon: Calendar },
  { href: "/my-packages", label: "Paketlerim", icon: Package },
  { href: "/account", label: "Profil", icon: Settings },
];

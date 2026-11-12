import { User } from "lucide-react";
import type { SettingsNavItem } from "@/components/settings/SettingsItem";

export const ACCOUNT_GENERAL_ITEMS: SettingsNavItem[] = [
  { id: "profile", title: "Profil Bilgilerim", icon: User, href: "/account/profile" },
];

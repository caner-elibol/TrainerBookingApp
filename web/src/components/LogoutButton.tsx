"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import Button from "@/components/ui/Button";

export default function LogoutButton({ variant = "button" }: { variant?: "button" | "row" }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-2.5 text-sm font-semibold text-error-600"
      >
        <LogOut className="h-4 w-4" />
        Çıkış Yap
      </button>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout}>
      Çıkış Yap
    </Button>
  );
}

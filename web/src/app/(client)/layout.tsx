import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PhoneShell from "@/components/shell/PhoneShell";
import ClientHeader from "@/components/client/ClientHeader";
import ClientBottomNav from "@/components/client/ClientBottomNav";

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "Client") redirect("/");

  return (
    <PhoneShell header={<ClientHeader user={user} />} bottomNav={<ClientBottomNav />}>
      {children}
    </PhoneShell>
  );
}

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import CompleteProfileWizard from "./CompleteProfileWizard";

export default async function CompleteProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-subtle px-6 py-12">
      <CompleteProfileWizard homeHref={user.role === "Trainer" ? "/dashboard" : "/home"} />
    </div>
  );
}

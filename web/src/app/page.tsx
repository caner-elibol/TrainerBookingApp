import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import PublicNav from "@/components/PublicNav";
import ButtonLink from "@/components/ui/ButtonLink";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user?.role === "Trainer") redirect("/dashboard");
  if (user?.role === "Client") redirect("/home");

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav user={null} />
      <main className="flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-subtle via-white to-subtle px-6 py-16 text-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">Antrenmanlarını saniyeler içinde planla</h1>
          <p className="max-w-md text-lg text-ink-secondary">
            Provider&apos;ınla randevu al, paketlerini yönet, ilerlemeni tek yerden takip et.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/register" variant="secondary" size="lg">
              Hemen Başla
            </ButtonLink>
            <ButtonLink href="/login" variant="outline" size="lg">
              Giriş Yap
            </ButtonLink>
          </div>
        </div>
      </main>
    </div>
  );
}

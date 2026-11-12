import ButtonLink from "@/components/ui/ButtonLink";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-semibold tracking-wide text-ink uppercase">404</p>
      <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
      <p className="text-ink/60">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <ButtonLink href="/" variant="primary">
        Go home
      </ButtonLink>
    </main>
  );
}

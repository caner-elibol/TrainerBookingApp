import ButtonLink from "@/components/ui/ButtonLink";

export default function TrainerNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold tracking-wide text-ink uppercase">404</p>
      <h1 className="text-2xl font-semibold text-foreground">Eğitmen bulunamadı</h1>
      <p className="text-ink-secondary">
        Bu randevu bağlantısı herhangi bir eğitmen profiliyle eşleşmiyor. Bağlantıyı kontrol et veya eğitmeninden
        yeniden göndermesini iste.
      </p>
      <ButtonLink href="/" variant="primary">
        Ana Sayfaya Dön
      </ButtonLink>
    </main>
  );
}

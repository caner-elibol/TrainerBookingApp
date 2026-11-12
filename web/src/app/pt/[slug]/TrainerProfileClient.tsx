"use client";

import { useEffect, useState } from "react";
import { Apple, Award, Calendar as CalendarIcon, Check, Heart, Share2, Star, UserCheck, Users, Video } from "lucide-react";
import { clientFetch } from "@/lib/client-api";
import type { MyPackage, PackageDto, Review, TrainerProfile } from "@/lib/types";
import { categoryForTitle } from "@/lib/fixtures/packages";
import PurchaseButton from "./PurchaseButton";
import BookingExperience from "./BookingExperience";
import SectionCard from "@/components/ui/SectionCard";
import { CARD_BASE_CLASSES } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import AvatarCircle from "@/components/ui/AvatarCircle";
import { cn } from "@/lib/cn";

interface SessionInfo {
  user: { id: string; email: string; fullName: string; role: "Trainer" | "Client" } | null;
  accessToken: string | null;
}

const FEATURE_CHIPS = [
  { icon: UserCheck, label: "Kişiye özel program" },
  { icon: Apple, label: "Beslenme desteği" },
  { icon: Video, label: "Online / Yüz yüze" },
  { icon: CalendarIcon, label: "Esnek saatler" },
];

const CATEGORY_GRADIENTS: Record<string, string> = {
  fitness: "from-neutral-900 to-neutral-700",
  pilates: "from-neutral-800 to-neutral-600",
  online: "from-neutral-950 to-neutral-800",
  nutrition: "from-neutral-700 to-neutral-500",
  duo: "from-neutral-800 to-neutral-500",
};

export default function TrainerProfileClient({
  profile,
  packages,
  reviews,
  canPurchase,
}: {
  profile: TrainerProfile;
  packages: PackageDto[];
  reviews: Review[];
  slug: string;
  canPurchase: boolean;
}) {
  const [session, setSession] = useState<SessionInfo | "loading">("loading");
  const [myPackages, setMyPackages] = useState<MyPackage[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritePending, setFavoritePending] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSession(data);
      })
      .catch(() => {
        if (!cancelled) setSession({ user: null, accessToken: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isClient = session !== "loading" && session.user?.role === "Client";
  const token = session !== "loading" ? session.accessToken : null;

  useEffect(() => {
    if (!isClient || !token) return;
    let cancelled = false;
    clientFetch(`/api/trainers/${profile.trainerId}/my-packages`, token)
      .then((r) => (r.ok ? r.json() : []))
      .then((pkgs: MyPackage[]) => {
        if (!cancelled) setMyPackages(pkgs);
      })
      .catch(() => {
        if (!cancelled) setMyPackages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isClient, token, profile.trainerId]);

  useEffect(() => {
    if (!isClient || !token) return;
    let cancelled = false;
    clientFetch(`/api/trainers/${profile.trainerId}/favorite`, token)
      .then((r) => (r.ok ? r.json() : false))
      .then((favorite: boolean) => {
        if (!cancelled) setIsFavorite(favorite);
      })
      .catch(() => {
        if (!cancelled) setIsFavorite(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isClient, token, profile.trainerId]);

  const totalRemaining = myPackages.reduce((sum, pkg) => sum + pkg.remainingSessions, 0);

  function handleToggleFavorite() {
    if (!isClient || !token || favoritePending) return;
    const next = !isFavorite;
    setFavoritePending(true);
    clientFetch(`/api/trainers/${profile.trainerId}/favorite`, token, { method: next ? "PUT" : "DELETE" })
      .then((r) => {
        if (r.ok) setIsFavorite(next);
      })
      .finally(() => setFavoritePending(false));
  }

  function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: profile.fullName, url }).catch(() => {});
      return;
    }
    navigator.clipboard.writeText(url).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    });
  }

  function handleSlotBooked(userPackageId: string) {
    setMyPackages((prev) =>
      prev
        .map((pkg) => (pkg.userPackageId === userPackageId ? { ...pkg, remainingSessions: pkg.remainingSessions - 1 } : pkg))
        .filter((pkg) => pkg.remainingSessions > 0),
    );
  }

  const badges = Array.from(new Set([profile.expertiseArea, ...profile.specialties].filter(Boolean)));

  const showUsage = isClient && myPackages.length > 0;

  return (
    <div className="flex flex-col gap-8 py-6">
      <div className={cn(CARD_BASE_CLASSES, "flex flex-col gap-5 p-6")}>
        <AvatarCircle name={profile.fullName} size={128} className="mx-auto shrink-0 text-3xl" />

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{profile.fullName}</h1>
            <Award className="h-5 w-5 text-ink" aria-label="Onaylı eğitmen" />
          </div>
          <p className="text-sm text-ink-secondary">Provider</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {profile.averageRating !== null && (
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Star className="h-4 w-4 fill-warning-600 text-warning-600" /> {profile.averageRating}
                <span className="font-normal text-ink-secondary">{profile.reviewCount} değerlendirme</span>
              </span>
            )}
            {profile.yearsExperience > 0 && <span className="text-ink-secondary">{profile.yearsExperience}+ yıl deneyim</span>}
          </div>

          {badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <Badge key={b} variant="brand">
                  {b}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {FEATURE_CHIPS.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                <Icon className="h-4 w-4 text-ink" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {showUsage && (
          <div className="flex flex-col gap-3 border-t border-border-default pt-5">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-ink" />
              <div>
                <p className="text-sm text-ink-secondary">Kalan seansların</p>
                <p className="text-xl font-bold text-foreground">{totalRemaining}</p>
              </div>
            </div>
            {totalRemaining <= 3 && <Alert variant="warning">Azalıyor — paketini yenilemeyi düşün.</Alert>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleToggleFavorite}
          disabled={!isClient || favoritePending}
          title={!isClient ? "Favorilere eklemek için giriş yap" : undefined}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg border border-border-default px-3 py-2 text-sm hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50",
            isFavorite ? "text-error-600" : "text-ink-secondary",
          )}
        >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-error-600")} />
          {isFavorite ? "Favorilerde" : "Favorilere Ekle"}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-border-default px-3 py-2 text-sm text-ink-secondary hover:bg-surface-muted"
        >
          {shared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          {shared ? "Kopyalandı!" : "Paylaş"}
        </button>
      </div>

      {!showUsage ? (
        <SectionCard title="Paketler">
          {packages.length === 0 ? (
            <EmptyState title="Henüz paket yok" description="Bu eğitmen henüz bir paket yayınlamadı." />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {packages.map((pkg) => {
                const category = categoryForTitle(pkg.title);
                return (
                  <div key={pkg.id} className={cn(CARD_BASE_CLASSES, "flex flex-col overflow-hidden p-0")}>
                    <div className={cn("h-24 bg-gradient-to-br", CATEGORY_GRADIENTS[category])} />
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{pkg.title}</h3>
                        {pkg.description && <p className="mt-1 line-clamp-2 text-xs text-ink-secondary">{pkg.description}</p>}
                      </div>
                      <p className="text-lg font-bold text-foreground">₺{pkg.price.toLocaleString("tr-TR")}</p>
                      <Badge variant="brand" className="w-fit">
                        {pkg.sessionCount} seans
                      </Badge>
                      <div className="mt-auto">
                        <PurchaseButton packageId={pkg.id} slug={profile.calendarSlug} canPurchase={canPurchase} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      ) : (
        <BookingExperience
          trainerId={profile.trainerId}
          trainerName={profile.fullName}
          token={token}
          myPackages={myPackages}
          totalRemaining={totalRemaining}
          onSlotBooked={handleSlotBooked}
        />
      )}

      {reviews.length > 0 && (
        <SectionCard title="Üyeler Ne Diyor?">
          <div className="grid grid-cols-1 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border-default p-4">
                <div className="flex items-center gap-2.5">
                  <AvatarCircle name={r.clientName} size={32} />
                  <p className="text-sm font-semibold text-foreground">{r.clientName}</p>
                </div>
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "fill-warning-600 text-warning-600" : "text-border-strong")} />
                  ))}
                </div>
                <p className="mt-2 text-sm text-ink-secondary">{r.comment}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <div className="rounded-2xl bg-primary-hover px-8 py-8 text-center text-white">
        <p className="text-xl font-bold">Daha güçlü bir sen mümkün.</p>
        <p className="mt-1 text-sm text-white/80">Doğru eğitmenle, hedeflerine daha yakınsın.</p>
      </div>
    </div>
  );
}

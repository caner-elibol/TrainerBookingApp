"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import type { Review } from "@/lib/types";
import { upsertTrainerReview } from "./actions";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import { cn } from "@/lib/cn";

export default function TrainerReviewForm({ trainerId, initialReview }: { trainerId: string; initialReview: Review | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [comment, setComment] = useState(initialReview?.comment ?? "");
  const [saved, setSaved] = useState<Review | null>(initialReview);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (rating < 1) return;
    startTransition(async () => {
      const result = await upsertTrainerReview(trainerId, { rating, comment: comment.trim() || null });
      if (result.success && result.review) {
        setSaved(result.review);
        setIsOpen(false);
      }
    });
  }

  if (!isOpen) {
    return (
      <div className="mt-4 border-t border-border-default pt-4">
        {saved ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={cn("h-4 w-4", i < saved.rating ? "fill-warning-600 text-warning-600" : "text-border-strong")} />
              ))}
            </div>
            <button type="button" onClick={() => setIsOpen(true)} className="text-xs font-medium text-ink hover:underline">
              Değerlendirmeni düzenle
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="text-sm font-medium text-ink hover:underline"
          >
            Bu antrenörü değerlendir
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-border-default pt-4">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => {
          const value = i + 1;
          return (
            <button key={i} type="button" onClick={() => setRating(value)} aria-label={`${value} yıldız`}>
              <Star className={cn("h-6 w-6", value <= rating ? "fill-warning-600 text-warning-600" : "text-border-strong")} />
            </button>
          );
        })}
      </div>
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Deneyimini paylaş (opsiyonel)..." rows={2} />
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
          İptal
        </Button>
        <Button variant="secondary" size="sm" onClick={handleSubmit} isLoading={isPending} disabled={rating < 1}>
          Gönder
        </Button>
      </div>
    </div>
  );
}

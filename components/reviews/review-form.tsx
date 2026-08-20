"use client";

import { useFormState as useActionState } from "react-dom";
import { useState } from "react";
import { Star } from "lucide-react";
import { createReviewAction, type ActionResult } from "@/lib/reviews/actions";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/auth/submit-button";
import { cn } from "@/lib/utils/cn";

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(createReviewAction, undefined);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  if (state?.success) {
    return <p className="text-sm text-verified">{state.success}</p>;
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border bg-card p-5">
      <p className="text-sm font-semibold">Laisser un avis</p>

      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "h-6 w-6",
                (hoverRating || rating) >= star ? "fill-accent text-accent" : "text-muted-foreground/30"
              )}
            />
          </button>
        ))}
      </div>

      <Textarea name="comment" placeholder="Votre expérience avec ce professionnel (optionnel)" rows={3} />

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <SubmitButton className="w-auto" disabled={rating === 0}>
        Envoyer mon avis
      </SubmitButton>
    </form>
  );
}

export function ReviewDisplay({ rating, comment }: { rating: number; comment: string | null }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-5">
      <p className="text-sm font-semibold">Votre avis</p>
      <div className="mt-2 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={cn("h-4 w-4", i < rating ? "fill-accent text-accent" : "text-muted-foreground/30")} />
        ))}
      </div>
      {comment && <p className="mt-2 text-sm">{comment}</p>}
    </div>
  );
}

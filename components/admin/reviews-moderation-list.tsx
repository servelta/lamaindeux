"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { hideReviewAction, unhideReviewAction } from "@/lib/admin/review-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  hidden_by_admin: boolean;
  created_at: string;
  professionals: { company_name: string } | { company_name: string }[] | null;
};

export function ReviewsModerationList({ reviews }: { reviews: Review[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(reviewId: string, currentlyHidden: boolean) {
    startTransition(async () => {
      if (currentlyHidden) await unhideReviewAction(reviewId);
      else await hideReviewAction(reviewId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {reviews.length === 0 && <p className="text-sm text-muted-foreground">Aucun avis.</p>}
      {reviews.map((r) => {
        const professional = Array.isArray(r.professionals) ? r.professionals[0] : r.professionals;
        return (
          <div key={r.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-4 w-4", i < r.rating ? "fill-accent text-accent" : "text-muted-foreground/30")} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">{professional?.company_name}</span>
                {r.hidden_by_admin && <Badge variant="destructive">Masqué</Badge>}
              </div>
              <Button size="sm" variant="outline" disabled={isPending} onClick={() => toggle(r.id, r.hidden_by_admin)}>
                {r.hidden_by_admin ? "Réafficher" : "Masquer"}
              </Button>
            </div>
            {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
          </div>
        );
      })}
    </div>
  );
}

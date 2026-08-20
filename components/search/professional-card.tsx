import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, formatRating } from "@/lib/utils/format";
import type { ProfessionalSearchResult } from "@/lib/queries/search";

export function ProfessionalCard({ professional }: { professional: ProfessionalSearchResult }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary">
        {professional.avatar_url ? (
          <Image
            src={professional.avatar_url}
            alt={professional.company_name}
            width={56}
            height={56}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-display text-lg font-semibold text-primary">
            {professional.company_name.charAt(0)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/artisan/${professional.slug}`}
            className="font-display text-base font-semibold hover:text-primary"
          >
            {professional.company_name}
          </Link>
          <span className="verified-badge inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
            <BadgeCheck className="h-3.5 w-3.5" />
            Vérifié
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {professional.rating_count > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              <span className="font-mono-data">{formatRating(professional.rating_avg)}</span>
              <span>({professional.rating_count})</span>
            </span>
          )}
          <span>{professional.completed_jobs_count} interventions</span>
          <span>{professional.city_name}</span>
        </div>

        <p className="mt-2 text-sm">
          {professional.service_name} —{" "}
          <span className="font-mono-data font-medium">
            {formatPrice(professional.price_cents)}
          </span>
        </p>
      </div>

      <Button asChild className="shrink-0 sm:self-center">
        <Link href={`/artisan/${professional.slug}#reserver`}>Réserver</Link>
      </Button>
    </div>
  );
}

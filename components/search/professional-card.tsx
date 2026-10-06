import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BadgeCheck, MapPin, Star, BriefcaseBusiness } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, formatRating } from "@/lib/utils/format";
import type { ProfessionalSearchResult } from "@/lib/queries/search";

export function ProfessionalCard({ professional }: { professional: ProfessionalSearchResult }) {
  const profileUrl = `/artisan/${professional.slug}`;
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
      <div className="relative h-20 bg-gradient-to-r from-primary/15 via-teal-50 to-white">
        <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-sm"><BadgeCheck aria-hidden="true" className="h-4 w-4" />Profil vérifié</span>
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5 sm:px-6 sm:pb-6">
        <Link href={profileUrl} className="relative -mt-9 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-teal-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`Voir le profil de ${professional.company_name}`}>
          {professional.avatar_url ? <Image src={professional.avatar_url} alt={professional.company_name} width={80} height={80} className="h-full w-full object-cover" /> : <span className="font-display text-3xl font-semibold text-primary">{professional.company_name.charAt(0)}</span>}
        </Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">{professional.trade_name_singular}</p>
        <h3 className="mt-1 break-words font-display text-xl font-bold"><Link href={profileUrl} className="hover:text-primary">{professional.company_name}</Link></h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />Intervient à {professional.city_name}</p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {professional.rating_count > 0 ? <span className="inline-flex items-center gap-1.5"><Star aria-hidden="true" className="h-4 w-4 fill-amber-400 text-amber-400" /><strong>{formatRating(professional.rating_avg)}</strong><span className="text-muted-foreground">({professional.rating_count} avis)</span></span> : <span className="text-muted-foreground">Pas encore d’avis</span>}
          {professional.completed_jobs_count > 0 && <span className="inline-flex items-center gap-1.5 text-muted-foreground"><BriefcaseBusiness aria-hidden="true" className="h-4 w-4" />{professional.completed_jobs_count} intervention{professional.completed_jobs_count > 1 ? "s" : ""}</span>}
        </div>
        {professional.description && <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">{professional.description}</p>}
        <div className="mt-auto pt-5">
          <div className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 p-4">
            <div className="min-w-0"><p className="text-xs text-muted-foreground">Prestation proposée</p><p className="mt-1 break-words text-sm font-medium">{professional.service_name}</p></div>
            <p className="shrink-0 text-right font-display text-lg font-bold text-primary">{professional.pricing_type === "quote" ? "Sur devis" : formatPrice(professional.price_cents)}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="h-11 rounded-xl px-2"><Link href={profileUrl} aria-label={`Voir le profil de ${professional.company_name}`}>Voir le profil</Link></Button>
            <Button asChild className="h-11 rounded-xl px-2"><Link href={`${profileUrl}#reserver`} aria-label={`Réserver avec ${professional.company_name}`}>Réserver<ArrowUpRight aria-hidden="true" className="ml-1 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </div>
    </article>
  );
}

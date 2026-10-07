"use client";

import { useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BadgeCheck, MapPin, Star, BriefcaseBusiness, LoaderCircle, UserRound, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRating } from "@/lib/utils/format";
import type { ProfessionalSearchResult } from "@/lib/queries/search";

export function ProfessionalCard({ professional }: { professional: ProfessionalSearchResult }) {
  const profileUrl = "/artisan/" + professional.slug;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function navigate(event: MouseEvent<HTMLAnchorElement>, url: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    startTransition(() => router.push(url));
  }
  return (
    <article aria-busy={pending} className="group relative flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-primary/40 hover:shadow-lg focus-within:ring-2 focus-within:ring-primary/40">
      <Link href={profileUrl} onClick={event => navigate(event, profileUrl)} aria-label={"Voir le profil de " + professional.company_name} className="absolute inset-0 z-10 rounded-3xl focus-visible:outline-none" />
      <div className="pointer-events-none relative h-20 bg-gradient-to-r from-primary/15 via-teal-50 to-white">
        <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-sm"><BadgeCheck aria-hidden="true" className="h-4 w-4" />Profil vérifié</span>
      </div>
      <div className="pointer-events-none flex flex-1 flex-col px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="relative -mt-9 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-teal-50 shadow-sm">
          {professional.avatar_url ? <Image src={professional.avatar_url} alt={professional.company_name} width={80} height={80} className="h-full w-full object-cover" /> : <span className="font-display text-3xl font-semibold text-primary">{professional.company_name.charAt(0)}</span>}
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">{professional.trade_name_singular}</p>
        <h3 className="mt-1 break-words font-display text-xl font-bold transition-colors group-hover:text-primary">{professional.company_name}</h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />Intervient à {professional.city_name}</p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <span className="inline-flex flex-wrap items-center gap-1.5"><Star aria-hidden="true" className="h-4 w-4 fill-amber-400 text-amber-400" />{professional.google_review_count != null && professional.google_review_count > 0 && professional.google_rating != null ? <strong>{formatRating(professional.google_rating)}/5</strong> : null}<span className="text-muted-foreground">{professional.google_review_count != null ? professional.google_review_count + " avis Google" : "Avis Google non renseignés"}</span></span>
          {professional.completed_jobs_count > 0 && <span className="inline-flex items-center gap-1.5 text-muted-foreground"><BriefcaseBusiness aria-hidden="true" className="h-4 w-4" />{professional.completed_jobs_count} intervention{professional.completed_jobs_count > 1 ? "s" : ""}</span>}
        </div>
        {professional.description && <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">{professional.description}</p>}
        <div className="relative z-20 mt-auto grid grid-cols-2 gap-2 pt-5">
          <Button asChild variant="outline" className="pointer-events-auto h-11 rounded-xl px-2"><Link href={profileUrl} onClick={event => navigate(event, profileUrl)}><UserRound aria-hidden="true" className="mr-1.5 h-4 w-4 shrink-0" />Voir le profil</Link></Button>
          <Button asChild className="pointer-events-auto h-11 rounded-xl px-2"><Link href={profileUrl + "#reserver"} onClick={event => navigate(event, profileUrl + "#reserver")} aria-label={"Réserver avec " + professional.company_name}><CalendarDays aria-hidden="true" className="mr-1.5 h-4 w-4 shrink-0" />Réserver<ArrowUpRight aria-hidden="true" className="ml-1 h-4 w-4 shrink-0" /></Link></Button>
        </div>
      </div>
      {pending ? <div role="status" className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center gap-2 bg-white/90 text-sm font-semibold text-primary backdrop-blur-sm"><LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin motion-reduce:animate-none" />Chargement du profil…</div> : null}
    </article>
  );
}

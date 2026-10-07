import { BadgeCheck, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
export function ResultsHeader({ title, description, cityName }: { title: string; description: string; cityName?: string }) {
  return <header className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-teal-50 via-white to-primary/5 p-6 sm:p-10">
    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-primary"><span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2"><BadgeCheck aria-hidden="true" className="h-4 w-4" />Les artisans Le Plan B</span>{cityName && <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="h-4 w-4" />{cityName}</span>}</div>
    <h1 className="mt-5 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
    <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-primary"><span>Réservation gratuite</span><span>Prix affichés</span><span>Avec ou sans compte</span></div>
    {cityName && <Link href="/recherche" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">Changer de ville ou de métier<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>}
  </header>;
}

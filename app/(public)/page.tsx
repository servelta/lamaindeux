import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, MapPin, CalendarCheck, ShieldCheck, Wrench, Zap, Paintbrush, Flame, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchForm } from "@/components/search/search-form";
import { getActiveCities, getActiveServices, getActiveTrades, getAllTrades } from "@/lib/queries/search";

// This page reads the live catalog (trades/cities/services) that admins can
// change at any time via the admin dashboard or direct SQL — it must never
// be served from a stale cache, or newly activated trades/cities/services
// silently fail to appear until the next deploy.
export const dynamic = "force-dynamic";

const HOW_IT_WORKS = [
  {
    title: "Recherchez",
    body: "Indiquez votre ville et le service dont vous avez besoin.",
  },
  {
    title: "Choisissez",
    body: "Comparez les artisans vérifiés, leurs avis et leurs prix.",
  },
  {
    title: "Réservez",
    body: "Sélectionnez un créneau disponible en quelques clics.",
  },
  {
    title: "Confirmez",
    body: "Recevez votre confirmation par e-mail avec votre numéro de réservation.",
  },
];

const TRUST_ITEMS = [
  { icon: BadgeCheck, label: "Des artisans vérifiés" },
  { icon: MapPin, label: "Service partout en France" },
  { icon: CalendarCheck, label: "Réservation en ligne" },
  { icon: ShieldCheck, label: "Prix affichés, sans commission" },
];

// Maps each trade's icon name (stored as plain text in the trades table)
// to an actual lucide-react component for the trade-picker section.
const TRADE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench,
  Zap,
  Paintbrush,
  Flame,
  Hammer,
};

// Real photos for the trades that have them. Trades without an entry here
// (not yet photographed/launched) fall back to the icon-only card style.
const TRADE_PHOTOS: Record<string, string> = {
  plombier: "/images/trade-plombier.webp",
  electricien: "/images/trade-electricien.jpg",
};

export default async function HomePage() {
  const [activeTrades, allTrades, cities, services] = await Promise.all([
    getActiveTrades(),
    getAllTrades(),
    getActiveCities(),
    getActiveServices(),
  ]);

  const primaryTrade = activeTrades[0];
  const popularCities = cities.slice(0, 8);
  // Scoped to the primary trade, which the section below assumes: these link
  // to /{primaryTrade}/{city}/{service}, so another trade's service builds a
  // URL whose service does not resolve under that trade — a 404.
  const popularServices = primaryTrade
    ? services.filter((s) => s.trade_id === primaryTrade.id).slice(0, 8)
    : [];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="container relative grid gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">
              Un artisan de confiance, près de chez vous.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-primary-foreground/80">
              Recherchez un service et réservez directement en ligne. Sans
              commission sur l'intervention, sans frais pour vous.
            </p>

            <div className="mt-8 max-w-3xl">
              <SearchForm trades={activeTrades} cities={cities} services={services} />
            </div>
          </div>

          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-xl lg:block">
            <Image
              src="/images/hero-worker.jpg"
              alt="Artisan professionnel prêt à intervenir"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 40vw, 0px"
            />
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section className="border-b border-border/60 bg-card">
        <div className="container grid grid-cols-2 gap-6 py-8 sm:grid-cols-4">
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
              <Icon className="h-5 w-5 shrink-0 text-accent" />
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* TRADE PICKER — Plomberie live today, every other trade already
          exists in the catalog and just needs an admin flip to go live,
          which is exactly why this section is worth showing now rather
          than waiting until more trades launch. */}
      <section className="container py-16">
        <h2 className="font-display text-2xl font-semibold">Nos métiers</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          La plateforme s'ouvre progressivement à de nouveaux métiers du
          bâtiment et de la maison.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {allTrades.map((trade) => {
            const Icon = (trade.icon && TRADE_ICONS[trade.icon]) || Wrench;
            const photo = TRADE_PHOTOS[trade.slug_singular];

            if (trade.active) {
              return (
                <Link
                  key={trade.slug_plural}
                  href={`/${trade.slug_plural}`}
                  className="group flex flex-col items-center overflow-hidden rounded-lg border border-border bg-card text-center transition-colors hover:border-primary"
                >
                  {photo ? (
                    <div className="relative h-24 w-full">
                      <Image
                        src={photo}
                        alt={trade.name}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-24 w-full items-center justify-center bg-secondary">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <span className="px-4 py-3 text-sm font-medium">{trade.name}</span>
                </Link>
              );
            }
            return (
              <div
                key={trade.slug_plural}
                className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-center text-muted-foreground"
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">{trade.name}</span>
                <span className="text-xs">Bientôt disponible</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* POPULAR SERVICES — scoped to the primary (currently only) active trade */}
      {primaryTrade && popularServices.length > 0 && (
        <section className="container py-16">
          <h2 className="font-display text-2xl font-semibold">Services les plus demandés</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {popularServices.map((service) => (
              <Link
                key={service.slug}
                href={`/${primaryTrade.slug_plural}/paris/${service.slug}`}
                className="rounded-lg border border-border bg-card px-4 py-4 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {service.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* POPULAR CITIES — scoped to the primary active trade for the same reason */}
      {primaryTrade && popularCities.length > 0 && (
        <section className="bg-secondary/40">
          <div className="container py-16">
            <h2 className="font-display text-2xl font-semibold">
              Trouvez un {primaryTrade.name_singular.toLowerCase()} dans votre ville
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {popularCities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/${primaryTrade.slug_plural}/${city.slug}`}
                  className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  {primaryTrade.name_singular} {city.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="container py-16">
        <h2 className="font-display text-2xl font-semibold">Comment ça marche</h2>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-4 sm:gap-6">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={step.title} className="flex sm:flex-col sm:items-start">
              <div className="flex items-center gap-4 sm:mb-4 sm:block">
                <span className="font-mono-data flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className="font-display text-base font-semibold sm:mt-3">{step.title}</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground sm:mt-2">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-y border-border/60 bg-card">
        <div className="container flex flex-col items-center gap-4 py-16 text-center">
          <h2 className="font-display text-2xl font-semibold">Besoin d'un artisan ?</h2>
          <Button asChild size="lg">
            <Link href="#recherche">Trouver un artisan maintenant</Link>
          </Button>
        </div>
      </section>

      {/* PROFESSIONAL CTA */}
      <section className="container py-16">
        <div className="flex flex-col items-center gap-4 rounded-xl bg-primary px-6 py-12 text-center text-primary-foreground">
          <h2 className="font-display text-2xl font-semibold">Vous êtes artisan ?</h2>
          <p className="max-w-lg text-primary-foreground/80">
            Recevez de nouveaux clients sans commission sur vos
            interventions. Inscription gratuite, vérification par notre
            équipe.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/inscription/professionnel">Devenir artisan partenaire</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

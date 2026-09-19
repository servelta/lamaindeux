import Link from "next/link";
import Image from "next/image";
import {
  BadgeCheck,
  MapPin,
  CalendarCheck,
  ShieldCheck,
  Star,
  ArrowRight,
  Wrench,
  Zap,
  Paintbrush,
  Flame,
  Hammer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchForm } from "@/components/search/search-form";
import { TRADE_PHOTOS } from "@/lib/trade-photos";
import { formatRating } from "@/lib/utils/format";
import { pluralise } from "@/lib/utils/fr";
import {
  getActiveCities,
  getActiveServices,
  getAllTrades,
  getTradeStats,
} from "@/lib/queries/search";

// This page reads the live catalog (trades/cities/services) that admins can
// change at any time via the admin dashboard or direct SQL — it must never
// be served from a stale cache, or newly activated trades/cities/services
// silently fail to appear until the next deploy.
export const dynamic = "force-dynamic";

const HOW_IT_WORKS = [
  {
    title: "Recherchez",
    body: "Indiquez votre ville et le métier dont vous avez besoin.",
    image: "/images/how-it-works/1-recherchez.png",
    alt: "Formulaire de recherche d'artisan",
  },
  {
    title: "Choisissez",
    body: "Comparez les artisans vérifiés, leurs avis et leurs prix.",
    image: "/images/how-it-works/2-choisissez.png",
    alt: "Choix d'un artisan vérifié",
  },
  {
    title: "Réservez",
    body: "Sélectionnez un créneau disponible en quelques clics.",
    image: "/images/how-it-works/3-reservez.png",
    alt: "Réservation d'un créneau disponible",
  },
  {
    title: "Confirmez",
    body: "Recevez votre confirmation par e-mail avec votre numéro de réservation.",
    image: "/images/how-it-works/4-confirmez.png",
    alt: "Confirmation de réservation par e-mail",
  },
];

const TRUST_ITEMS = [
  { icon: BadgeCheck, label: "Des artisans vérifiés" },
  { icon: MapPin, label: "Réservation partout en France" },
  { icon: CalendarCheck, label: "Réservation en ligne" },
  { icon: ShieldCheck, label: "Prix affichés, sans commission" },
];

// Maps each trade's icon name (stored as plain text in the trades table)
// to an actual lucide-react component for the trade cards.
const TRADE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench,
  Zap,
  Paintbrush,
  Flame,
  Hammer,
};

export default async function HomePage() {
  const [allTrades, cities, services, tradeStats] = await Promise.all([
    getAllTrades(),
    getActiveCities(),
    getActiveServices(),
    getTradeStats(),
  ]);

  const activeTrades = allTrades.filter((t) => t.active);
  const comingSoonTrades = allTrades.filter((t) => !t.active);
  const primaryTrade = activeTrades[0];

  // Quick links under the search field: the most-requested services of the
  // primary trade. Scoped to it because these link to
  // /{primaryTrade}/{city}/{service} — another trade's service builds a URL
  // whose service does not resolve under that trade, a 404.
  const popularServices = primaryTrade
    ? services.filter((s) => s.trade_id === primaryTrade.id).slice(0, 4)
    : [];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        {/* Narrower than the container the rest of the page uses, so the
            hero does not run the full width of a wide screen. */}
        <div className="container relative mx-auto grid max-w-5xl gap-8 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1 className="max-w-xl font-display text-3xl font-bold leading-[1.12] tracking-tight sm:text-4xl">
              Le bon artisan, près de chez vous.
            </h1>
            <p className="mt-3 max-w-lg text-primary-foreground/80">
              Comparez des artisans vérifiés, consultez leurs prix et réservez
              en ligne. Gratuit, sans commission sur l&apos;intervention.
            </p>

            <div className="mt-6 max-w-3xl">
              <SearchForm trades={allTrades} cities={cities} />
            </div>

            {popularServices.length > 0 && primaryTrade && (
              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                <span className="text-primary-foreground/70">Populaire :</span>
                {popularServices.map((service) => (
                  <Link
                    key={service.slug}
                    href={`/${primaryTrade.slug_plural}/paris/${service.slug}`}
                    className="rounded-full border border-primary-foreground/25 px-3 py-1 text-primary-foreground/90 transition-colors hover:border-primary-foreground/60 hover:text-primary-foreground"
                  >
                    {service.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Shorter than the text column is tall, so the image cannot be
              what sets the hero's height. */}
          <div className="relative hidden aspect-[16/10] max-h-[340px] overflow-hidden rounded-2xl lg:block">
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

      {/* BROWSE BY TRADE — the category grid. Each active trade card carries
          its own live numbers; a trade with no artisans yet says so rather
          than printing a zero, and inactive trades keep the honest
          "Bientôt disponible" treatment they had before. */}
      <section className="container py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Parcourir par métier
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              La plateforme s&apos;ouvre progressivement à de nouveaux métiers
              du bâtiment et de la maison.
            </p>
          </div>
          <Link
            href="/recherche"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Voir tous les artisans
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activeTrades.map((trade) => {
            const Icon = (trade.icon && TRADE_ICONS[trade.icon]) || Wrench;
            const photo = TRADE_PHOTOS[trade.slug_singular];
            const stats = tradeStats[trade.id];
            const count = stats?.professionalCount ?? 0;
            const tradeLower = trade.name_singular.toLowerCase();

            return (
              <Link
                key={trade.slug_plural}
                href={`/${trade.slug_plural}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <div className="relative h-40 w-full overflow-hidden bg-secondary">
                  {photo ? (
                    <Image
                      src={photo}
                      alt={trade.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold group-hover:text-primary">
                      {trade.name}
                    </h3>
                    {stats?.ratingAvg != null && (
                      <span className="flex shrink-0 items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-accent text-accent" />
                        <span className="font-mono-data font-medium">
                          {formatRating(stats.ratingAvg)}
                        </span>
                        <span className="text-muted-foreground">({stats.ratingCount})</span>
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {count > 0
                      ? `${count} ${count > 1 ? pluralise(tradeLower) : tradeLower} vérifié${count > 1 ? "s" : ""}`
                      : "Bientôt des artisans dans votre ville"}
                  </p>

                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    Voir les artisans
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}

          {comingSoonTrades.map((trade) => {
            const Icon = (trade.icon && TRADE_ICONS[trade.icon]) || Wrench;
            return (
              <div
                key={trade.slug_plural}
                className="flex flex-col items-start justify-center gap-3 rounded-xl border border-dashed border-border bg-card/40 p-6 text-muted-foreground"
              >
                <Icon className="h-7 w-7" />
                <h3 className="font-display text-lg font-semibold">{trade.name}</h3>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  Bientôt disponible
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-border/60 bg-card">
        <div className="container py-20">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Comment ça marche
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-4 sm:gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="flex sm:flex-col sm:items-start">
                <div className="mb-3 w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm sm:mb-4">
                  <div className="relative aspect-square w-full">
                    <Image
                      src={step.image}
                      alt={step.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 25vw, 20vw"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:block">
                  <span className="font-mono-data flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="font-display text-base font-semibold sm:mt-3">{step.title}</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground sm:mt-2">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TWO-SIDED PANEL — the marketplace has two audiences and the page
          should address both once, side by side, rather than stacking two
          full-width CTAs that repeat each other. */}
      <section className="container py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col items-start rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
              Particuliers
            </span>
            <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Besoin d&apos;un artisan ?
            </h3>
            <p className="mt-3 text-muted-foreground">
              Comparez les profils vérifiés, les avis et les prix affichés,
              puis réservez un créneau en ligne. La réservation est gratuite et
              vous payez l&apos;artisan directement.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/recherche">Trouver un artisan</Link>
            </Button>
          </div>

          <div className="flex flex-col items-start rounded-2xl bg-primary p-8 text-primary-foreground shadow-sm sm:p-10">
            <span className="rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              Artisans
            </span>
            <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Vous êtes artisan ?
            </h3>
            <p className="mt-3 text-primary-foreground/80">
              Recevez de nouveaux clients sans commission sur vos
              interventions. Vous fixez vos prix et vos disponibilités.
              Inscription gratuite, vérification par notre équipe.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <Link href="/inscription/professionnel">Devenir artisan partenaire</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="border-t border-border/60 bg-card">
        <div className="container py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-semibold">Qui sommes-nous ?</h2>
            <p className="mt-4 text-muted-foreground">
              LaMainDeux est la plateforme qui connecte particuliers et artisans
              vérifiés partout en France — plombiers, électriciens, et bientôt
              bien d&apos;autres métiers. Recherchez, comparez et réservez en
              ligne, gratuitement, sans commission sur l&apos;intervention.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

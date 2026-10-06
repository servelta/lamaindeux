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
  { icon: BadgeCheck, label: "Des artisans vérifiés", detail: "Des profils contrôlés par notre équipe.", tint: "bg-primary/10" },
  { icon: MapPin, label: "Réservation partout en France", detail: "Trouvez un professionnel près de chez vous.", tint: "bg-secondary" },
  { icon: CalendarCheck, label: "Réservation en ligne", detail: "Avec ou sans connexion, vous choisissez.", tint: "bg-primary/10" },
  { icon: ShieldCheck, label: "Prix affichés, sans commission", detail: "Vous payez directement votre artisan.", tint: "bg-secondary" },
];

// Maps each trade's icon name (stored as plain text in the trades table)
// to an actual lucide-react component for the trade cards.
const TRADE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench,
  Zap,
  Paintbrush,
};

export default async function HomePage() {
  const [allTrades, cities, services, tradeStats] = await Promise.all([
    getAllTrades(),
    getActiveCities(),
    getActiveServices(),
    getTradeStats(),
  ]);

  const homeTrades = ["plombier", "electricien", "peintre"].flatMap((slug) =>
    allTrades.filter((trade) => trade.slug_singular === slug),
  );
  const activeTrades = homeTrades.filter((t) => t.active);
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
      {/* HERO — a floating panel rather than a full-bleed band: the colour
          is carried by the rounded block, so the page background shows
          down both sides and above it. */}
      <section className="container pb-12 pt-6 sm:pb-16 sm:pt-8">
        <div className="relative grid gap-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary to-[#163c47] px-6 py-8 text-primary-foreground shadow-lg shadow-primary/10 sm:gap-10 sm:px-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-12 lg:py-14">
          <div className="min-w-0">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium tracking-wide"><BadgeCheck aria-hidden="true" className="h-4 w-4 text-secondary" />Votre maison entre de bonnes mains</p>
            <h1 className="max-w-2xl font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Le bon artisan,
              <br />
              près de chez vous.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/80 sm:text-xl">
              Comparez des artisans vérifiés, consultez leurs prix et réservez
              en ligne. Gratuit, sans commission sur l&apos;intervention.
            </p>

            <div className="mt-8 max-w-3xl">
              <SearchForm trades={homeTrades} cities={cities} />
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

          <div className="relative aspect-[3/2] overflow-hidden rounded-3xl bg-white/10 shadow-xl lg:aspect-[4/3]">
            <Image
              src="/images/new image on the landing page.png"
              alt="Deux artisans prêts à vous accompagner dans votre maison"
              fill
              priority
              className="object-cover object-center"
              sizes="(min-width: 1024px) 40vw, (min-width: 640px) 80vw, 100vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 pt-16"><p className="flex items-center gap-2 text-sm font-medium text-white"><ShieldCheck aria-hidden="true" className="h-5 w-5" />Des professionnels. Un vrai coup de main.</p></div>
          </div>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section aria-label="Les avantages Plan B" className="container pb-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {TRUST_ITEMS.map(({ icon: Icon, label, detail, tint }) => (
            <div key={label} className="group relative min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
              <div className="flex items-center justify-between gap-2"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-primary ${tint}`}><Icon aria-hidden="true" className="h-5 w-5" /></span><span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/5 text-primary"><BadgeCheck className="h-3.5 w-3.5" /></span></div>
              <h2 className="mt-4 text-sm font-semibold leading-snug text-primary sm:text-base">{label}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BROWSE BY TRADE — the category grid. Each active trade card carries
          its own live numbers; a trade with no artisans yet says so rather
          than printing a zero, and inactive trades keep the honest
          "Bientôt disponible" treatment they had before. */}
      <section id="metiers" className="container py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Un besoin, le bon métier.
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Plomberie, électricité, peinture : trouvez le bon professionnel
              pour prendre soin de votre maison.
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

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {homeTrades.map((trade) => {
            const Icon = (trade.icon && TRADE_ICONS[trade.icon]) || Wrench;
            const photo = TRADE_PHOTOS[trade.slug_singular];
            const stats = tradeStats[trade.id];
            const count = stats?.professionalCount ?? 0;
            const tradeLower = trade.name_singular.toLowerCase();

            return (
              <article
                key={trade.slug_plural}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 focus-within:ring-2 focus-within:ring-primary motion-safe:hover:-translate-y-1"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary">
                  {photo ? (
                    <Image
                      src={photo}
                      alt={trade.name}
                      fill
                      className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.04]"
                      sizes="(min-width: 768px) 33vw, 100vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <span className="absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-primary shadow-sm"><Icon aria-hidden="true" className="h-5 w-5" /></span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-lg font-semibold group-hover:text-primary">
                      {trade.name}
                    </h3>
                    {trade.active && stats?.ratingAvg != null && (
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
                    {trade.active && count > 0
                      ? `${count} ${count > 1 ? pluralise(tradeLower) : tradeLower} vérifié${count > 1 ? "s" : ""}`
                      : trade.active ? "Bientôt des artisans dans votre ville" : "Ce métier arrive bientôt sur Plan B."}
                  </p>

                  {trade.active ? <><Link href={`/${trade.slug_plural}`} className="absolute inset-0 rounded-3xl focus:outline-none"><span className="sr-only">Voir les artisans en {trade.name.toLowerCase()}</span></Link><span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">Voir les artisans<ArrowRight aria-hidden="true" className="h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-1" /></span></> : <span className="mt-5 self-start rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">Bientôt disponible</span>}
                </div>
              </article>
            );
          })}

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-border/60 bg-card">
        <div className="container py-12 sm:py-16">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Comment ça marche
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="min-w-0 rounded-2xl bg-background p-3 sm:p-4">
                <div className="mb-4 w-full overflow-hidden rounded-xl border border-border/60 bg-background">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={step.image}
                      alt={step.alt}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 25vw, 50vw"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono-data flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="font-display text-base font-semibold">{step.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TWO-SIDED PANEL — the marketplace has two audiences and the page
          should address both once, side by side, rather than stacking two
          full-width CTAs that repeat each other. */}
      <section className="container py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col items-start rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
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
            <Button asChild size="lg" className="mt-8 h-auto min-h-11 max-w-full whitespace-normal py-3 text-center">
              <Link href="/recherche">Trouver un artisan</Link>
            </Button>
          </div>

          <div className="flex min-w-0 flex-col items-start rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm sm:p-10">
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
            <Button asChild size="lg" variant="secondary" className="mt-8 h-auto min-h-11 max-w-full whitespace-normal py-3 text-center">
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
              Plan B est la plateforme qui connecte particuliers et artisans
              vérifiés partout en France — plomberie, électricité et peinture.
              Recherchez, comparez et réservez en
              ligne, gratuitement, sans commission sur l&apos;intervention.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

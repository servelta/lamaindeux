import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarCheck,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  Phone,
  Quote,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAddress, formatPrice, formatRating } from "@/lib/utils/format";
import type { getProfessionalBySlug } from "@/lib/queries/search";
import { TRADE_BANNER_PHOTOS } from "@/lib/trade-photos";

type Profile = NonNullable<Awaited<ReturnType<typeof getProfessionalBySlug>>>;
const STEPS = [
  {
    number: "01",
    title: "Choisissez votre service",
    text: "Consultez les prestations et les tarifs de votre artisan.",
  },
  {
    number: "02",
    title: "Trouvez le bon créneau",
    text: "Sélectionnez une disponibilité et précisez votre besoin.",
  },
  {
    number: "03",
    title: "Recevez votre confirmation",
    text: "Retrouvez votre réservation et son suivi dans votre espace client.",
  },
];

export function PublicProfileLanding({ profile }: { profile: Profile }) {
  const { professional: pro, services, reviews, areas, gallery } = profile;
  const trade = pro.trade_name_singular ?? "Professionnel";
  const bookingUrl = `/artisan/${pro.slug}/reserver`;
  const phoneUrl = `tel:${pro.public_phone}`;
  const cover =
    gallery[0]?.url ??
    TRADE_BANNER_PHOTOS[pro.trade_slug_singular ?? ""] ??
    "/images/hero-worker.jpg";
  const fixedPrices = services.flatMap((service) =>
    service.pricing_type === "fixed" && service.price_cents != null
      ? [service.price_cents]
      : [],
  );
  const minimumPrice = fixedPrices.length ? Math.min(...fixedPrices) : null;
  const address = formatAddress(
    pro.business_address,
    pro.business_postcode,
    pro.business_city,
  );
  const cities = areas.flatMap((area) => {
    const city = Array.isArray(area.cities) ? area.cities[0] : area.cities;
    return city?.name ? [city.name] : [];
  });
  const sections = [
    { href: "#presentation", label: "Présentation" },
    { href: "#reserver", label: "Services & tarifs" },
    ...(gallery.length
      ? [{ href: "#realisations", label: "Réalisations" }]
      : []),
    { href: "#avis", label: "Avis clients" },
  ];

  return (
    <div className="pb-16">
      <div className="container py-5 sm:py-7">
        <nav
          aria-label="Fil d’Ariane"
          className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm"
        >
          <Link href="/recherche" className="shrink-0 hover:text-primary">
            Les artisans
          </Link>
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
          <span aria-current="page" className="truncate text-foreground">
            {pro.company_name}
          </span>
        </nav>
      </div>
      <section className="container" aria-labelledby="artisan-title">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary text-primary-foreground">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-32 h-96 w-96 rounded-full border border-white/10"
          />
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative px-6 py-10 sm:px-10 sm:py-14 lg:px-12 lg:py-16">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium">
                <BadgeCheck
                  aria-hidden="true"
                  className="h-4 w-4 text-secondary"
                />
                {trade} vérifié sur Plan b
              </span>
              <p className="mt-7 text-sm text-white/75">
                {pro.business_city
                  ? `Votre ${trade.toLowerCase()} à ${pro.business_city}`
                  : `Votre ${trade.toLowerCase()}, tout simplement`}
              </p>
              <h1
                id="artisan-title"
                className="mt-3 break-words font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
              >
                {pro.company_name}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/80 sm:text-lg">
                Un besoin, un projet, un imprévu ? Découvrez les prestations de
                votre artisan et préparez votre prochaine intervention.
              </p>
              <div className="mt-7 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-primary ring-2 ring-white/20">
                  {pro.avatar_url ? (
                    <Image
                      src={pro.avatar_url}
                      alt={`Portrait de ${pro.first_name} ${pro.last_name}`}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-xl font-bold">
                      {pro.company_name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {pro.first_name} {pro.last_name}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-white/75">
                    <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                    {pro.business_city || trade}
                  </p>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-secondary text-primary hover:bg-secondary/90"
                >
                  <a href={services.length ? "#reserver" : "#presentation"}>
                    {services.length
                      ? "Voir les services & réserver"
                      : "Découvrir le profil"}
                    <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                {pro.public_phone ? (
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    <a href={phoneUrl}>
                      <Phone aria-hidden="true" className="mr-2 h-4 w-4" />
                      Appeler l’artisan
                    </a>
                  </Button>
                ) : null}
              </div>
              <p className="mt-5 flex items-center gap-2 text-xs text-white/70">
                <ShieldCheck aria-hidden="true" className="h-4 w-4 shrink-0" />
                Réservation gratuite, sans commission sur l’intervention.
              </p>
            </div>
            <div className="relative min-h-[280px] sm:min-h-[360px] lg:min-h-full">
              <Image
                src={cover}
                alt={
                  gallery.length
                    ? `Réalisation de ${pro.company_name}`
                    : `Illustration du métier : ${trade.toLowerCase()}`
                }
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 46vw"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/10 to-transparent"
              />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 sm:bottom-8 sm:left-8 sm:right-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/75">
                    {gallery.length
                      ? "Le savoir-faire en images"
                      : "Un artisan, près de vous"}
                  </p>
                  <p className="mt-2 font-display text-2xl font-semibold">
                    Votre projet commence ici.
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"
                >
                  <ArrowUpRight className="h-5 w-5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section
        aria-label="Le profil en quelques chiffres"
        className="container mt-6"
      >
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border/60 bg-card sm:grid-cols-4">
          {[
            {
              icon: BadgeCheck,
              value: "Profil vérifié",
              label: "Par l’équipe Plan b",
            },
            {
              icon: Star,
              value:
                pro.rating_count > 0
                  ? `${formatRating(pro.rating_avg)} / 5`
                  : "À découvrir",
              label:
                pro.rating_count > 0
                  ? `${pro.rating_count} avis clients sur Plan b`
                  : "Pas encore d’avis sur Plan b",
            },
            {
              icon: Wrench,
              value: String(pro.completed_jobs_count),
              label: "Interventions réalisées",
            },
            {
              icon: CalendarCheck,
              value: `${services.length} service${services.length > 1 ? "s" : ""}`,
              label: services.length
                ? "À réserver en ligne"
                : "Prestations à venir",
            },
          ].map(({ icon: Icon, value, label }, index) => (
            <div
              key={label}
              className={`p-5 sm:p-6 ${index % 2 ? "border-l border-border/60" : ""} ${index > 1 ? "border-t border-border/60 sm:border-t-0" : ""} ${index === 2 ? "sm:border-l" : ""}`}
            >
              <Icon aria-hidden="true" className="mb-3 h-5 w-5 text-primary" />
              <p className="font-display text-lg font-semibold">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="container mt-10 grid items-start gap-10 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
        <div className="min-w-0 space-y-14">
          <nav
            aria-label="Sections du profil"
            className="flex flex-wrap gap-2 border-b border-border pb-5 text-sm"
          >
            {sections.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full bg-card px-4 py-2 font-medium transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <section id="presentation" className="scroll-mt-44">
            <SectionTitle
              eyebrow="Faisons connaissance"
              title="Un professionnel pour vos projets."
            />
            <p className="mt-5 whitespace-pre-line text-base leading-8 text-muted-foreground">
              {pro.description ||
                `${pro.first_name} ${pro.last_name} vous propose ses services${pro.business_city ? ` à ${pro.business_city}` : ""}. Consultez les prestations ci-dessous pour préparer votre prochaine intervention.`}
            </p>
            {cities.length || address ? (
              <div className="mt-6 rounded-2xl bg-muted/70 p-5">
                <div className="flex items-center gap-2 font-medium">
                  <MapPin aria-hidden="true" className="h-5 w-5 text-primary" />
                  Près de chez vous
                </div>
                {address ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {address}
                  </p>
                ) : null}
                {cities.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {cities.map((city, index) => (
                      <span
                        key={`${city}-${index}`}
                        className="rounded-full border border-border bg-card px-3 py-1 text-xs"
                      >
                        {city}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
          <section id="reserver" className="scroll-mt-44">
            <SectionTitle
              eyebrow="Le bon service, au bon prix"
              title="Comment puis-je vous aider ?"
            />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Choisissez votre prestation pour consulter les créneaux
              disponibles. Le paiement se règle directement avec le
              professionnel.
            </p>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {services.map((item) => {
                const service = Array.isArray(item.services)
                  ? item.services[0]
                  : item.services;
                return (
                  <article
                    key={item.id}
                    className="flex flex-col rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/40 hover:shadow-md motion-reduce:transition-none"
                  >
                    <div className="mb-5 flex items-center justify-between gap-2">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-primary">
                        <Wrench aria-hidden="true" className="h-5 w-5" />
                      </span>
                      {item.duration_minutes ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                          {item.duration_minutes} min
                        </span>
                      ) : null}
                    </div>
                    <h3 className="font-display text-lg font-semibold">
                      {service?.name ?? "Prestation"}
                    </h3>
                    {item.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                    <div className="mt-auto pt-6">
                      <p className="text-xs text-muted-foreground">
                        {item.pricing_type === "quote"
                          ? "Tarif personnalisé"
                          : "Tarif affiché"}
                      </p>
                      <p className="mt-1 font-mono-data text-2xl font-bold text-primary">
                        {item.pricing_type === "quote"
                          ? "Sur devis"
                          : formatPrice(item.price_cents)}
                      </p>
                      <Button asChild className="mt-5 w-full">
                        <Link href={`${bookingUrl}?service=${item.id}`}>
                          Réserver ce service
                          <ArrowRight
                            aria-hidden="true"
                            className="ml-2 h-4 w-4"
                          />
                        </Link>
                      </Button>
                    </div>
                  </article>
                );
              })}
              {!services.length ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 sm:col-span-2">
                  <CalendarCheck
                    aria-hidden="true"
                    className="h-8 w-8 text-primary"
                  />
                  <h3 className="mt-4 font-display text-xl font-semibold">
                    Les services arrivent bientôt.
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Cet artisan n’a pas encore de prestation réservable en
                    ligne.
                    {pro.public_phone
                      ? " Contactez-le pour discuter de votre projet."
                      : " Revenez prochainement pour découvrir ses prestations."}
                  </p>
                  {pro.public_phone ? (
                    <Button asChild className="mt-5">
                      <a href={phoneUrl}>
                        <Phone aria-hidden="true" className="mr-2 h-4 w-4" />
                        Contacter l’artisan
                      </a>
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
          {gallery.length ? (
            <section id="realisations" className="scroll-mt-44">
              <SectionTitle
                eyebrow="Le savoir-faire en action"
                title="Des réalisations qui parlent."
              />
              <p className="mt-4 text-sm text-muted-foreground">
                Découvrez les photos partagées par {pro.company_name}.
              </p>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4">
                {gallery.map((photo, index) => (
                  <a
                    key={photo.id}
                    href={photo.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Voir la réalisation ${index + 1} de ${pro.company_name} (nouvel onglet)`}
                    className={`group relative overflow-hidden rounded-2xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${index === 0 ? "col-span-2 aspect-[16/9]" : "aspect-[4/3]"}`}
                  >
                    <Image
                      src={photo.url}
                      alt={`Réalisation ${index + 1} de ${pro.company_name}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                      sizes={
                        index === 0
                          ? "(max-width: 1023px) 100vw, 65vw"
                          : "(max-width: 1023px) 50vw, 32vw"
                      }
                    />
                    <span
                      aria-hidden="true"
                      className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 text-primary"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}
          <section id="avis" className="scroll-mt-44">
            <SectionTitle
              eyebrow="La parole aux clients"
              title="Leurs projets, leurs avis."
            />
            {pro.google_rating != null ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Star aria-hidden="true" className="h-4 w-4 text-accent" />
                {formatRating(pro.google_rating)}/5 sur Google
                {pro.google_review_count != null
                  ? ` · ${pro.google_review_count} avis`
                  : ""}
              </p>
            ) : null}
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {reviews.map((review, index) => (
                <figure
                  key={`${review.created_at}-${index}`}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <Quote
                    aria-hidden="true"
                    className="mb-5 h-7 w-7 text-secondary"
                  />
                  <div
                    role="img"
                    aria-label={`${review.rating} sur 5 étoiles`}
                    className="flex gap-1"
                  >
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star
                        aria-hidden="true"
                        key={starIndex}
                        className={`h-4 w-4 ${starIndex < review.rating ? "fill-accent text-accent" : "text-muted-foreground/25"}`}
                      />
                    ))}
                  </div>
                  {review.comment ? (
                    <blockquote className="mt-4 whitespace-pre-line text-sm leading-7">
                      {review.comment}
                    </blockquote>
                  ) : null}
                  <figcaption className="mt-5 text-xs text-muted-foreground">
                    Avis client Plan b ·{" "}
                    <time dateTime={review.created_at}>
                      {new Date(review.created_at).toLocaleDateString("fr-FR", {
                        month: "long",
                        year: "numeric",
                        timeZone: "Europe/Paris",
                      })}
                    </time>
                  </figcaption>
                </figure>
              ))}
              {!reviews.length ? (
                <div className="rounded-2xl bg-secondary/30 p-7 sm:col-span-2">
                  <Star aria-hidden="true" className="h-6 w-6 text-accent" />
                  <h3 className="mt-3 font-display text-xl font-semibold">
                    Chaque belle histoire a un début.
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Aucun avis publié sur Plan b pour le moment. Après votre
                    intervention, partagez votre expérience pour aider les
                    prochains clients.
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
        <aside
          aria-label="Contacter et réserver"
          className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-44"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary/60 px-3 py-1.5 text-xs font-medium text-primary">
            <CalendarCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Votre prochain projet
          </span>
          <h2 className="mt-5 font-display text-2xl font-semibold">
            On passe à l’action ?
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {services.length
              ? "Choisissez votre service et trouvez un créneau qui vous convient."
              : "Découvrez le profil de votre artisan et ses coordonnées."}
          </p>
          {minimumPrice != null ? (
            <div className="mt-6 border-y border-border py-5">
              <p className="text-xs text-muted-foreground">
                Prestations à partir de
              </p>
              <p className="mt-1 font-mono-data text-3xl font-bold text-primary">
                {formatPrice(minimumPrice)}
              </p>
            </div>
          ) : null}
          {services.length ? (
            <Button asChild size="lg" className="mt-6 w-full">
              <a href="#reserver">
                Choisir mon service
                <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
              </a>
            </Button>
          ) : null}
          {pro.public_phone ? (
            <Button asChild variant="outline" className="mt-3 w-full">
              <a href={phoneUrl}>
                <Phone aria-hidden="true" className="mr-2 h-4 w-4" />
                {pro.public_phone}
              </a>
            </Button>
          ) : null}
          <ul className="mt-6 space-y-3 text-xs text-muted-foreground">
            {[
              "Artisan vérifié par Plan b",
              "Aucune commission sur l’intervention",
              "Paiement direct au professionnel",
            ].map((label) => (
              <li key={label} className="flex items-start gap-2">
                <Check
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-verified"
                />
                {label}
              </li>
            ))}
          </ul>
          {address ? (
            <p className="mt-6 flex items-start gap-2 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
              <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              {address}
            </p>
          ) : null}
        </aside>
      </div>
      <section className="container mt-16 sm:mt-20">
        <div className="rounded-[2rem] bg-secondary/60 px-6 py-10 sm:px-10 sm:py-12">
          <SectionTitle
            eyebrow="Avec Plan b, c’est simple"
            title="Du besoin au rendez-vous."
          />
          <div className="mt-9 grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number}>
                <span className="font-mono-data text-3xl font-medium text-primary/35">
                  {step.number}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container mt-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-primary px-6 py-9 text-primary-foreground sm:px-10 md:flex-row md:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-secondary">
              Votre artisan, votre Plan b
            </p>
            <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
              Un projet en tête ? Faites le premier pas.
            </h2>
          </div>
          <Button
            asChild
            size="lg"
            className="shrink-0 bg-secondary text-primary hover:bg-secondary/90"
          >
            <a
              href={
                services.length
                  ? "#reserver"
                  : pro.public_phone
                    ? phoneUrl
                    : "/recherche"
              }
            >
              {services.length
                ? "Découvrir les services"
                : pro.public_phone
                  ? "Contacter l’artisan"
                  : "Trouver un artisan"}
              <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
    </>
  );
}

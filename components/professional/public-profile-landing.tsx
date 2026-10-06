import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Clock3,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAddress, formatPrice, formatRating } from "@/lib/utils/format";
import type { getProfessionalBySlug } from "@/lib/queries/search";
import { TRADE_BANNER_PHOTOS } from "@/lib/trade-photos";
import { ProfilePhotoCarousel } from "@/components/professional/profile-photo-carousel";

type Profile = NonNullable<Awaited<ReturnType<typeof getProfessionalBySlug>>>;
type Review = Profile["reviews"][number];

export function PublicProfileLanding({ profile }: { profile: Profile }) {
  const { professional: pro, services, reviews, areas, gallery } = profile;
  const trade = pro.trade_name_singular ?? "Professionnel";
  const bookingUrl = `/artisan/${pro.slug}/reserver`;
  const phoneUrl = `tel:${pro.public_phone}`;
  const address = formatAddress(
    pro.business_address,
    pro.business_postcode,
    pro.business_city,
  );
  const cities = areas.flatMap((area) => {
    const city = Array.isArray(area.cities) ? area.cities[0] : area.cities;
    return city?.name ? [city.name] : [];
  });
  const photos = gallery.length
    ? gallery.map((photo, index) => ({
        id: photo.id,
        url: photo.url,
        alt: `Réalisation ${index + 1} de ${pro.company_name}`,
      }))
    : [
        {
          id: "trade",
          url:
            TRADE_BANNER_PHOTOS[pro.trade_slug_singular ?? ""] ??
            "/images/hero-worker.jpg",
          alt: `Illustration du métier : ${trade.toLowerCase()}`,
        },
      ];

  return (
    <div className="container max-w-6xl pb-12">
      <nav
        aria-label="Fil d’Ariane"
        className="flex items-center gap-2 py-5 text-xs text-muted-foreground sm:py-6 sm:text-sm"
      >
        <Link href="/recherche" className="shrink-0 hover:text-primary">
          Les artisans
        </Link>
        <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        <span aria-current="page" className="truncate text-foreground">
          {pro.company_name}
        </span>
      </nav>
      <section
        aria-labelledby="artisan-title"
        className="overflow-hidden rounded-[2rem] bg-primary text-primary-foreground"
      >
        <div className="grid lg:grid-cols-2">
          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium">
              <BadgeCheck
                aria-hidden="true"
                className="h-4 w-4 text-secondary"
              />
              {trade} vérifié
            </span>
            <h1
              id="artisan-title"
              className="mt-5 break-words font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
            >
              {pro.company_name}
            </h1>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-primary">
                {pro.avatar_url ? (
                  <Image
                    src={pro.avatar_url}
                    alt={`Portrait de ${pro.first_name} ${pro.last_name}`}
                    width={44}
                    height={44}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-display text-xl font-bold">
                    {pro.company_name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {pro.first_name} {pro.last_name}
                </p>
                {pro.business_city ? (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-white/75">
                    <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                    {pro.business_city}
                  </p>
                ) : null}
              </div>
            </div>
            {pro.rating_count > 0 ? (
              <a
                href="#avis"
                className="mt-5 inline-flex items-center gap-2 text-sm hover:underline"
              >
                <Star
                  aria-hidden="true"
                  className="h-4 w-4 fill-secondary text-secondary"
                />
                {formatRating(pro.rating_avg)}/5 · {pro.rating_count} avis Plan
                b
              </a>
            ) : pro.google_rating != null ? (
              <a
                href="#avis"
                className="mt-5 inline-flex items-center gap-2 text-sm hover:underline"
              >
                <Star
                  aria-hidden="true"
                  className="h-4 w-4 fill-secondary text-secondary"
                />
                {formatRating(pro.google_rating)}/5 sur Google
                {pro.google_review_count != null
                  ? ` · ${pro.google_review_count} avis`
                  : ""}
              </a>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              {services.length ? (
                <Button
                  asChild
                  size="lg"
                  className="bg-secondary text-primary hover:bg-secondary/90"
                >
                  <a href="#reserver">
                    Choisir un service
                    <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : null}
              {pro.public_phone ? (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <a href={phoneUrl}>
                    <Phone aria-hidden="true" className="mr-2 h-4 w-4" />
                    Appeler
                  </a>
                </Button>
              ) : null}
            </div>
            <p className="mt-4 text-xs text-white/70">
              Réservation gratuite sur Plan b.
            </p>
          </div>
          <ProfilePhotoCarousel key={pro.slug} photos={photos} />
        </div>
      </section>

      <section id="reserver" className="mt-9 scroll-mt-44 sm:mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Services & tarifs
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choisissez votre service, puis votre créneau.
        </p>
        <div className="mt-5 grid gap-3">
          {services.map((item) => {
            const service = Array.isArray(item.services)
              ? item.services[0]
              : item.services;
            return (
              <article
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-semibold">
                    {service?.name ?? "Prestation"}
                  </h3>
                  {item.duration_minutes ? (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                      {item.duration_minutes} min
                    </p>
                  ) : null}
                  {item.description ? (
                    <details className="mt-2 text-sm text-muted-foreground">
                      <summary className="w-fit cursor-pointer hover:text-primary">
                        Détails du service
                      </summary>
                      <p className="mt-2 whitespace-pre-line leading-6">
                        {item.description}
                      </p>
                    </details>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center justify-between gap-5 sm:gap-8">
                  <p className="font-mono-data text-xl font-bold text-primary">
                    {item.pricing_type === "quote"
                      ? "Sur devis"
                      : formatPrice(item.price_cents)}
                  </p>
                  <Button asChild>
                    <Link href={`${bookingUrl}?service=${item.id}`}>
                      Réserver
                      <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
          {!services.length ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Aucun service réservable pour le moment.
              {pro.public_phone
                ? " Appelez l’artisan pour votre projet."
                : " Revenez prochainement."}
            </p>
          ) : null}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Paiement directement à l’artisan, sans commission.
        </p>
      </section>

      {pro.description || address || cities.length ? (
        <section id="presentation" className="mt-7 scroll-mt-44">
          <details className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <summary className="cursor-pointer font-display text-lg font-semibold text-primary">
              À propos & zone d’intervention
            </summary>
            {pro.description ? (
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                {pro.description}
              </p>
            ) : null}
            {address ? (
              <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                {address}
              </p>
            ) : null}
            {cities.length ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Intervient à : {cities.join(", ")}
              </p>
            ) : null}
          </details>
        </section>
      ) : null}

      <section id="avis" className="mt-9 scroll-mt-44 sm:mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Avis clients
          </h2>
          {pro.rating_count > 0 ? (
            <p className="inline-flex items-center gap-2 text-sm">
              <Star
                aria-hidden="true"
                className="h-4 w-4 fill-accent text-accent"
              />
              {formatRating(pro.rating_avg)}/5 · {pro.rating_count} avis Plan b
            </p>
          ) : null}
        </div>
        {pro.google_rating != null ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {formatRating(pro.google_rating)}/5 sur Google
            {pro.google_review_count != null
              ? ` · ${pro.google_review_count} avis`
              : ""}
          </p>
        ) : null}
        {reviews.length ? (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {reviews.slice(0, 2).map((review, index) => (
                <ReviewCard
                  key={`${review.created_at}-${index}`}
                  review={review}
                />
              ))}
            </div>
            {reviews.length > 2 ? (
              <details className="mt-4">
                <summary className="w-fit cursor-pointer text-sm font-medium text-primary">
                  Voir plus d’avis ({reviews.length - 2})
                </summary>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {reviews.slice(2).map((review, index) => (
                    <ReviewCard
                      key={`${review.created_at}-${index}`}
                      review={review}
                    />
                  ))}
                </div>
              </details>
            ) : null}
          </>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Pas encore d’avis sur Plan b.
          </p>
        )}
      </section>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="rounded-2xl border border-border bg-card p-5">
      <div
        role="img"
        aria-label={`${review.rating} sur 5 étoiles`}
        className="flex gap-1"
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            aria-hidden="true"
            className={`h-4 w-4 ${index < review.rating ? "fill-accent text-accent" : "text-muted-foreground/25"}`}
          />
        ))}
      </div>
      {review.comment ? (
        <blockquote className="mt-3 whitespace-pre-line text-sm leading-6">
          {review.comment}
        </blockquote>
      ) : null}
      <figcaption className="mt-3 text-xs text-muted-foreground">
        Avis Plan b ·{" "}
        <time dateTime={review.created_at}>
          {new Date(review.created_at).toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
            timeZone: "Europe/Paris",
          })}
        </time>
      </figcaption>
    </figure>
  );
}

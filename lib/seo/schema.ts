const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Sitewide Organization + WebSite schema, emitted once in the root layout.
 * The SearchAction is what makes a Google "sitelinks search box" possible
 * under the homepage result — it costs nothing to include and only ever
 * helps, though Google decides on its own whether to render it.
 */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "LaMainDeux",
    url: SITE_URL,
    description:
      "Plateforme de mise en relation entre clients et artisans vérifiés en France (plomberie, électricité, peinture, chauffage...). Réservation en ligne gratuite, sans commission sur les interventions.",
  };
}

/**
 * primaryTradeSlugPlural picks which trade's search page the sitelinks
 * SearchAction points to — there's no single generic search-by-anything
 * page, so this defaults to whichever trade is currently live (only
 * "plombiers" at launch). Costs nothing to include and only ever helps;
 * Google decides on its own whether to actually render a sitelinks box.
 */
export function websiteSchema(primaryTradeSlugPlural: string = "plombiers") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "LaMainDeux",
    inLanguage: "fr-FR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/${primaryTradeSlugPlural}/{search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Maps a trade to the most specific valid schema.org business type.
 * schema.org defines dedicated subtypes for some trades (Plumber,
 * Electrician, HousePainter, HVACBusiness, GeneralContractor) — using the
 * specific one where it exists helps search/AI engines match the entity to
 * trade-specific intent queries. Falls back to the generic
 * HomeAndConstructionBusiness for any trade without a dedicated subtype.
 */
function schemaOrgTypeForTrade(tradeSlugSingular: string | null): string {
  const map: Record<string, string> = {
    plombier: "Plumber",
    electricien: "Electrician",
    peintre: "HousePainter",
    chauffagiste: "HVACBusiness",
  };
  return (tradeSlugSingular && map[tradeSlugSingular]) || "HomeAndConstructionBusiness";
}

/**
 * Uses the most specific schema.org business type available for the
 * professional's trade (see schemaOrgTypeForTrade) rather than always the
 * generic LocalBusiness — this is what actually helps search and AI
 * engines match the entity to trade-specific intent queries.
 * Deliberately omits telephone/email/street address: per Section 7, a
 * professional's direct contact details stay private until a booking exists,
 * so structured data only ever exposes what the public profile itself
 * shows (city-level area, services, rating).
 */
export function professionalSchema(params: {
  slug: string;
  companyName: string;
  description: string | null;
  city: string | null;
  ratingAvg: number;
  ratingCount: number;
  tradeSlugSingular: string | null;
  services: { name: string; priceCents: number | null; pricingType: "fixed" | "quote" }[];
}) {
  const url = `${SITE_URL}/artisan/${params.slug}`;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaOrgTypeForTrade(params.tradeSlugSingular),
    "@id": `${url}/#business`,
    name: params.companyName,
    url,
    ...(params.description ? { description: params.description } : {}),
    ...(params.city
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: params.city,
            addressCountry: "FR",
          },
        }
      : {}),
  };

  if (params.ratingCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: params.ratingAvg,
      reviewCount: params.ratingCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (params.services.length > 0) {
    schema.makesOffer = params.services.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.name },
      ...(s.pricingType === "fixed" && s.priceCents != null
        ? { price: (s.priceCents / 100).toFixed(2), priceCurrency: "EUR" }
        : {}),
    }));
  }

  return schema;
}

/**
 * Service schema for a /[trade]/[city]/[service] landing page — this
 * represents the service category as offered through the marketplace in
 * that city, distinct from any single professional's own business schema.
 */
export function cityServiceSchema(params: {
  serviceName: string;
  serviceDescription: string | null;
  cityName: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: params.serviceName,
    name: `${params.serviceName} à ${params.cityName}`,
    ...(params.serviceDescription ? { description: params.serviceDescription } : {}),
    areaServed: {
      "@type": "City",
      name: params.cityName,
    },
    provider: {
      "@type": "Organization",
      name: "LaMainDeux",
      url: SITE_URL,
    },
    url: `${SITE_URL}${params.url}`,
  };
}

/**
 * FAQPage schema. Note: as of 2026 Google limits FAQ rich-result eligibility
 * to a narrow set of authoritative sources, so this most likely won't earn
 * a visible snippet in Google itself — but it still helps other engines and
 * AI answer systems (Bing, Perplexity-style crawlers, etc.) parse the
 * page's Q&A content directly rather than guessing from prose, so it's
 * worth emitting regardless.
 */
export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

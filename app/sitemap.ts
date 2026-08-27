import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Regenerate at most once an hour — trade/city/service/professional lists
// don't churn fast enough to need per-request generation, but should stay
// fresh as new professionals activate or cities/services/trades are added.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: cities }, { data: trades }, { data: services }, { data: professionals }] = await Promise.all([
    supabase.from("cities").select("slug, name").eq("active", true),
    supabase.from("trades").select("id, slug_plural").eq("active", true),
    supabase.from("services").select("slug, trade_id").eq("active", true),
    supabase.from("professionals").select("slug, updated_at").eq("status", "ACTIVE"),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/inscription`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/inscription/professionnel`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/conditions-utilisation`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/cookies`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const tradePages: MetadataRoute.Sitemap = [];
  const cityPages: MetadataRoute.Sitemap = [];
  const cityServicePages: MetadataRoute.Sitemap = [];

  // For each active trade, its own city hub pages + the city×service
  // cross-join scoped to *that trade's* services only — an electrician's
  // services should never generate a /plombiers/... URL, and vice versa.
  for (const trade of trades ?? []) {
    const tradeServices = (services ?? []).filter((s) => s.trade_id === trade.id);

    // The trade hub itself (/plombiers) — where the homepage's "Nos métiers"
    // cards point, and the entry point into that trade's city pages.
    tradePages.push({
      url: `${SITE_URL}/${trade.slug_plural}`,
      changeFrequency: "weekly",
      priority: 0.7,
    });

    for (const city of cities ?? []) {
      cityPages.push({
        url: `${SITE_URL}/${trade.slug_plural}/${city.slug}`,
        changeFrequency: "daily",
        priority: 0.9,
      });

      // The city×service cross-join is the primary SEO landing surface
      // ("plombier réparation fuite Paris" etc.) — highest priority after
      // the city hub pages themselves.
      for (const service of tradeServices) {
        cityServicePages.push({
          url: `${SITE_URL}/${trade.slug_plural}/${city.slug}/${service.slug}`,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  }

  const professionalPages: MetadataRoute.Sitemap = (professionals ?? []).map((p) => ({
    url: `${SITE_URL}/artisan/${p.slug}`,
    lastModified: p.updated_at ?? undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticPages, ...tradePages, ...cityPages, ...cityServicePages, ...professionalPages];
}

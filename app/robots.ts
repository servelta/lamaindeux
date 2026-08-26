import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/dashboard",
        "/mon-compte",
        "/mes-reservations",
        "/reservations",
        "/profil",
        "/mes-services",
        "/calendrier",
        "/documents",
        // Booking form and confirmation pages are transactional/session-
        // dependent, not content search should send people to directly.
        "/artisan/*/reserver",
        "/reservation-confirmee/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

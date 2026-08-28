import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCityBySlug, getServiceBySlug, searchProfessionals, getTradeBySlugPlural } from "@/lib/queries/search";
import { ProfessionalCard } from "@/components/search/professional-card";
import { EmptySearchResults } from "@/components/search/empty-results";
import { JsonLd } from "@/components/seo/json-ld";
import { cityServiceSchema, faqSchema, breadcrumbSchema } from "@/lib/seo/schema";
import { pluralise, withParticle } from "@/lib/utils/fr";

type Props = {
  params: Promise<{ trade: string; city: string; service: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { trade: tradeSlug, city: citySlug, service: serviceSlug } = await params;
  const trade = await getTradeBySlugPlural(tradeSlug);
  if (!trade) return {};

  const [city, service] = await Promise.all([
    getCityBySlug(citySlug),
    getServiceBySlug(serviceSlug, trade.id),
  ]);
  if (!city || !service) return {};

  const title = `${service.name} ${city.name} — ${trade.name_singular} vérifié | LaMainDeux`;
  const description = `Besoin d'un service "${service.name.toLowerCase()}" à ${city.name} ? Comparez les ${pluralise(trade.name_singular.toLowerCase())} vérifiés, consultez les prix et réservez en ligne.`;
  const path = `/${trade.slug_plural}/${city.slug}/${service.slug}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website" },
  };
}

export const revalidate = 3600;

export default async function CityServicePage({ params }: Props) {
  const { trade: tradeSlug, city: citySlug, service: serviceSlug } = await params;

  const trade = await getTradeBySlugPlural(tradeSlug);
  if (!trade) notFound();

  const [city, service] = await Promise.all([
    getCityBySlug(citySlug),
    getServiceBySlug(serviceSlug, trade.id),
  ]);
  if (!city || !service) notFound();

  const professionals = await searchProfessionals({
    tradeSlugPlural: trade.slug_plural,
    citySlug,
    serviceSlug,
  });

  const tradeLower = trade.name_singular.toLowerCase();
  const faqItems = [
    {
      question: `Combien coûte un ${service.name.toLowerCase()} à ${city.name} ?`,
      answer:
        service.default_pricing_type === "fixed"
          ? `Ce service est généralement proposé à prix fixe, affiché directement sur le profil de chaque ${tradeLower}.`
          : "Ce type d'intervention nécessite souvent un devis, car le prix dépend de la situation exacte.",
    },
    {
      question: "Puis-je réserver en urgence ?",
      answer:
        `Les disponibilités affichées sur chaque profil reflètent les créneaux réels ${withParticle("du", tradeLower)}. Pour une urgence, filtrez par "Intervention d'urgence" si ce service est proposé.`,
    },
  ];

  const path = `/${trade.slug_plural}/${city.slug}/${service.slug}`;

  const schema = cityServiceSchema({
    serviceName: service.name,
    serviceDescription: service.description,
    cityName: city.name,
    url: path,
  });

  const breadcrumbs = breadcrumbSchema([
    { name: "Accueil", url: "/" },
    { name: `${trade.name_singular} ${city.name}`, url: `/${trade.slug_plural}/${city.slug}` },
    { name: `${service.name} ${city.name}`, url: path },
  ]);

  return (
    <div className="container py-12">
      <JsonLd data={schema} />
      <JsonLd data={breadcrumbs} />
      <JsonLd data={faqSchema(faqItems)} />

      <h1 className="font-display text-3xl font-bold">
        {service.name} à {city.name}
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {service.description ?? `Trouvez un ${tradeLower} vérifié pour un service de ${service.name.toLowerCase()} à ${city.name}.`}
      </p>

      <div className="mt-8 space-y-4">
        {professionals.length > 0 ? (
          professionals.map((p) => <ProfessionalCard key={`${p.profile_id}-${p.professional_service_id}`} professional={p} />)
        ) : (
          <EmptySearchResults cityName={city.name} serviceName={service.name} />
        )}
      </div>

      <section className="mt-16 max-w-2xl">
        <h2 className="font-display text-xl font-semibold">Questions fréquentes</h2>
        <div className="mt-4 space-y-4 text-sm">
          {faqItems.map((item) => (
            <div key={item.question}>
              <p className="font-medium">{item.question}</p>
              <p className="mt-1 text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

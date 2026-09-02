import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "@/components/search/search-form";
import { getActiveCities, getActiveServices, getActiveTrades } from "@/lib/queries/search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trouver un artisan",
  description: "Recherchez un artisan vérifié près de chez vous et trouvez le service dont vous avez besoin.",
};

export default async function SearchPage() {
  const [trades, cities, services] = await Promise.all([
    getActiveTrades(),
    getActiveCities(),
    getActiveServices(),
  ]);

  const servicesByTrade = await Promise.all(
    trades.map(async (trade) => ({
      trade,
      services: await getActiveServices(trade.id),
    }))
  );

  return (
    <div className="container py-12">
      <h1 className="font-display text-3xl font-bold">Trouver un artisan</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Indiquez votre ville et le service dont vous avez besoin pour trouver un artisan vérifié près de chez vous.
      </p>

      <div className="mt-8 max-w-3xl">
        <SearchForm trades={trades} cities={cities} services={services} />
      </div>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold">Parcourir tous les services</h2>
        <div className="mt-8 space-y-8">
          {servicesByTrade.map(({ trade, services: tradeServices }) => (
            <div key={trade.id}>
              <h3 className="font-display text-xl font-semibold">{trade.name}</h3>
              {tradeServices.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  {tradeServices.map((service) => (
                    <Link
                      key={service.id}
                      href={`/${trade.slug_plural}`}
                      className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                    >
                      {service.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">Aucun service disponible pour le moment.</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
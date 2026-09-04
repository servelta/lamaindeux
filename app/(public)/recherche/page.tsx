import type { Metadata } from "next";
import Image from "next/image";
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

  return (
    <div className="container py-12">
      <div className="mb-8 overflow-hidden rounded-lg">
        <Image
          src="/images/recherche-banner.png"
          alt="Nos artisans vérifiés : électricien, plombier, peintre et entrepreneur général"
          width={1600}
          height={800}
          priority
          className="h-48 w-full object-contain sm:h-64 md:h-80"
        />
      </div>
      <p className="max-w-2xl text-muted-foreground">
        Indiquez votre ville et le service dont vous avez besoin pour trouver un artisan vérifié près de chez vous.
      </p>

      <div className="mt-8 max-w-3xl">
        <SearchForm trades={trades} cities={cities} services={services} />
      </div>
    </div>
  );
}
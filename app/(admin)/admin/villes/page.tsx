import { requireAdmin } from "@/lib/admin/queries";
import { createClient } from "@/lib/supabase/server";
import { AddCityForm, CitiesList } from "@/components/admin/cities-manager";

export const metadata = { title: "Villes" };

export default async function AdminCitiesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: cities } = await supabase.from("cities").select("*").order("name");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Villes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Les villes disponibles pour la recherche et les pages SEO
        <code className="mx-1 rounded bg-secondary px-1">/[metier]/[ville]</code>.
      </p>

      <div className="mt-6">
        <AddCityForm />
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold">Toutes les villes</h2>
      <div className="mt-3">
        <CitiesList cities={cities ?? []} />
      </div>
    </div>
  );
}

import { requireAdmin } from "@/lib/admin/queries";
import { createClient } from "@/lib/supabase/server";
import { AddServiceForm, ServicesList } from "@/components/admin/services-manager";

export const metadata = { title: "Services" };

export default async function AdminServicesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: services }, { data: trades }] = await Promise.all([
    supabase.from("services").select("*").order("sort_order"),
    supabase.from("trades").select("id, name").eq("active", true).order("sort_order"),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Services</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Le catalogue de services que les professionnels peuvent proposer.
      </p>

      <div className="mt-6">
        <AddServiceForm trades={trades ?? []} />
      </div>

      <h2 className="mt-8 font-display text-lg font-semibold">Catalogue</h2>
      <div className="mt-3">
        <ServicesList services={services ?? []} />
      </div>
    </div>
  );
}

import {
  requireUserId,
  getOwnProfessional,
  getOwnProfessionalServices,
} from "@/lib/professional/queries";
import { createClient } from "@/lib/supabase/server";
import { ServiceList } from "@/components/professional/services-manager";
export const metadata = { title: "Mes services" };
export default async function MesServicesPage() {
  const id = await requireUserId();
  const professional = await getOwnProfessional(id);
  const client = await createClient();
  const [services, catalog] = await Promise.all([
    getOwnProfessionalServices(id),
    professional
      ? client
          .from("services")
          .select("id,name")
          .eq("trade_id", professional.trade_id)
          .eq("active", true)
          .order("sort_order")
          .order("name")
      : Promise.resolve({ data: [] }),
  ]);
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <h1 className="font-display text-2xl font-bold">Mes services</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Activez les services que vous proposez et choisissez vos tarifs et
        durées. Un service désactivé ne peut plus être réservé ; vos rendez-vous
        existants sont conservés.
      </p>
      <div className="mt-6">
        <ServiceList services={services} catalog={catalog.data ?? []} />
      </div>
    </div>
  );
}

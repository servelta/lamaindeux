import {
  requireUserId,
  getOwnProfessionalServices,
} from "@/lib/professional/queries";
import { createClient } from "@/lib/supabase/server";
import {
  AddServiceForm,
  ServiceList,
} from "@/components/professional/services-manager";
import {
  createProvisioningClient,
  provisionPlumbingServices,
} from "@/lib/professional/provision-plumbing-services";

export const metadata = { title: "Mes services" };

export default async function MesServicesPage() {
  const professionalId = await requireUserId();
  const supabase = await createClient();
  const { data: professional } = await supabase
    .from("professionals")
    .select("trades(slug_singular)")
    .eq("profile_id", professionalId)
    .single();
  const trade = Array.isArray(professional?.trades)
    ? professional.trades[0]
    : professional?.trades;
  const managed = trade?.slug_singular === "plombier";
  if (managed)
    await provisionPlumbingServices(createProvisioningClient(), professionalId);

  const [myServices, { data: catalog }] = await Promise.all([
    getOwnProfessionalServices(professionalId),
    supabase
      .from("services")
      .select("id, name, default_pricing_type")
      .eq("active", true)
      .order("sort_order"),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Mes services</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {managed
          ? "Vos services de plomberie sont attribués automatiquement par Plan B. Aucun ajout manuel nécessaire."
          : "Ajoutez les services que vous proposez, avec vos prix et durées."}
      </p>

      {!managed ? (
        <div className="mt-8">
          <AddServiceForm catalog={catalog ?? []} />
        </div>
      ) : null}

      <h2 className="mt-10 font-display text-lg font-semibold">
        Services proposés
      </h2>
      <div className="mt-4">
        <ServiceList
          services={
            (managed
              ? myServices.filter((service) => service.active)
              : myServices) as any
          }
          managed={managed}
        />
      </div>
    </div>
  );
}

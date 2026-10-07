import { requireUserId, getOwnProfessionalServices } from "@/lib/professional/queries";
import { createClient } from "@/lib/supabase/server";
import { ServiceList } from "@/components/professional/services-manager";
import { createProvisioningClient, provisionPlumbingServices } from "@/lib/professional/provision-plumbing-services";
export const metadata = { title: "Mes services" };
export default async function MesServicesPage() {
 const professionalId=await requireUserId();
 const supabase=await createClient();
 const {data:professional}=await supabase.from("professionals").select("profile_id").eq("profile_id",professionalId).single();
 if(professional) await provisionPlumbingServices(createProvisioningClient(),professionalId);
 const services=(await getOwnProfessionalServices(professionalId)).filter(service=>service.active);
 return <div className="mx-auto max-w-2xl px-4 py-10"><h1 className="font-display text-2xl font-bold">Mes services</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Deux services sont automatiquement attribués à chaque artisan : Service urgent et Intervention classique. Le Plan B gère cette liste pour vous ; aucun ajout, modification ou suppression n’est nécessaire.</p><div className="mt-6"><ServiceList services={services} /></div></div>;
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BillingForm } from "@/components/billing/billing-form";
import { formatAddress } from "@/lib/utils/format";
export const metadata = { title: "Devis et factures", robots: { index: false, follow: false } };
export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion?next=/devis-factures");
  const [{data:profile},{data:professional}] = await Promise.all([
    supabase.from("profiles").select("role").eq("id",user.id).single(),
    supabase.from("professionals").select("status,company_name,business_address,business_postcode,business_city,siret,siren,public_email,public_phone").eq("profile_id",user.id).single(),
  ]);
  if (profile?.role !== "professional" || professional?.status === "SUSPENDED" || !professional) redirect("/");
  return <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8"><p className="text-sm font-semibold text-primary">Votre activité, simplement</p><h1 className="mt-2 font-display text-3xl font-bold">Devis et factures</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Ajoutez vos prestations, vérifiez les informations et téléchargez votre document PDF. Vos coordonnées sont reprises depuis votre profil.</p><BillingForm issuer={{name:professional.company_name,address:formatAddress(professional.business_address,professional.business_postcode,professional.business_city),id:professional.siret || professional.siren || "",email:typeof user.app_metadata.professional_contact_email === "string" ? user.app_metadata.professional_contact_email : user.email || "",phone:professional.public_phone || ""}} /></div>;
}

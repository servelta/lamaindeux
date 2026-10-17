import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BillingForm } from "@/components/billing/billing-form";
import { getBookingBillingPrefill } from "@/lib/billing/booking-prefill";
import { formatAddress } from "@/lib/utils/format";
export const metadata = {
  title: "Devis et factures",
  robots: { index: false, follow: false },
};
type Props = { searchParams: Promise<{ booking?: string; kind?: string }> };
export default async function BillingPage({ searchParams }: Props) {
  const { booking, kind } = await searchParams;
  const initialKind = kind === "invoice" ? "invoice" : "quote";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const next = new URLSearchParams();
    if (booking) next.set("booking", booking);
    if (kind) next.set("kind", kind);
    redirect(
      "/connexion?next=" +
        encodeURIComponent(
          "/devis-factures" + (next.size ? "?" + next.toString() : ""),
        ),
    );
  }
  const [{ data: profile }, { data: professional }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    supabase
      .from("professionals")
      .select(
        "status,company_name,business_address,business_postcode,business_city,siret,siren,public_email,public_phone",
      )
      .eq("profile_id", user.id)
      .single(),
  ]);
  if (
    profile?.role !== "professional" ||
    professional?.status === "SUSPENDED" ||
    !professional
  )
    redirect("/");
  const prefill = booking
    ? await getBookingBillingPrefill(booking, user.id)
    : undefined;
  if (booking && !prefill) notFound();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <p className="text-sm font-semibold text-primary">
        Votre activité, simplement
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold">
        Devis et factures
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Ajoutez vos prestations, vérifiez les informations et téléchargez votre
        document PDF. Vos coordonnées sont reprises depuis votre profil.
      </p>
      {prefill ? (
        <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <Link
            href={`/reservations/${prefill.bookingId}`}
            className="font-semibold text-primary underline underline-offset-4"
          >
            Réservation {prefill.bookingNumber}
          </Link>
          <p className="mt-2 leading-6">
            Les coordonnées de {prefill.clientName}, la prestation et la date
            sont préremplies. Vous pouvez les modifier avant de générer le PDF.
          </p>
        </div>
      ) : null}
      <BillingForm
        key={prefill ? `${prefill.bookingId}-${initialKind}` : "blank"}
        initialKind={initialKind}
        prefill={prefill ?? undefined}
        issuer={{
          name: professional.company_name,
          address: formatAddress(
            professional.business_address,
            professional.business_postcode,
            professional.business_city,
          ),
          id: professional.siret || professional.siren || "",
          email:
            typeof user.app_metadata.professional_contact_email === "string"
              ? user.app_metadata.professional_contact_email
              : user.email || "",
          phone: professional.public_phone || "",
        }}
      />
    </div>
  );
}

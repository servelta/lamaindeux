import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "@/components/booking/booking-form";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
};

export const metadata = { title: "Réserver" };

export default async function ReserverPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { service: professionalServiceId } = await searchParams;
  const returnTo = `/artisan/${slug}/reserver?service=${professionalServiceId ?? ""}`;

  if (!professionalServiceId) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/connexion?next=${encodeURIComponent(returnTo)}`);
  }

  const [{ data: professional }, { data: professionalService }, { data: profile }] = await Promise.all([
    supabase.from("public_professional_profiles").select("profile_id, company_name, slug").eq("slug", slug).single(),
    supabase
      .from("professional_services")
      .select("id, price_cents, duration_minutes, pricing_type, active, services(name)")
      .eq("id", professionalServiceId)
      .single(),
    supabase.from("profiles").select("first_name, last_name, phone, role").eq("id", user.id).single(),
  ]);

  if (!professional?.profile_id || !professional.company_name || !professional.slug || !professionalService || !professionalService.active) {
    notFound();
  }

  if (profile?.role !== "customer") {
    return (
      <div className="container max-w-lg py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Seul un compte client peut effectuer une réservation. Ce compte est
          connecté en tant que {profile?.role === "professional" ? "professionnel" : "administrateur"}.
        </p>
      </div>
    );
  }

  const service = Array.isArray(professionalService.services) ? professionalService.services[0] : professionalService.services;

  return (
    <div className="container max-w-xl py-12">
      <p className="text-sm text-muted-foreground">
        <Link href={`/artisan/${professional.slug}`} className="hover:text-primary">
          {professional.company_name}
        </Link>
      </p>
      <h1 className="mt-1 font-display text-2xl font-bold">Réserver — {service?.name}</h1>

      <div className="mt-8">
        <BookingForm
          professionalId={professional.profile_id}
          professionalServiceId={professionalService.id}
          serviceName={service?.name ?? ""}
          priceCents={professionalService.price_cents}
          durationMinutes={professionalService.duration_minutes}
          isQuoteRequest={professionalService.pricing_type === "quote"}
          returnTo={returnTo}
          prefill={{
            firstName: profile?.first_name,
            lastName: profile?.last_name,
            phone: profile?.phone ?? undefined,
            email: user.email ?? undefined,
          }}
        />
      </div>
    </div>
  );
}

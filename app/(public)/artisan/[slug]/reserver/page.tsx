import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BookingForm } from "@/components/booking/booking-form";
import { BookingAccessChoice } from "@/components/booking/booking-access-choice";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string; mode?: string; date?: string; time?: string }>;
};

export const metadata = { title: "Réserver" };

export default async function ReserverPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { service: professionalServiceId, mode, date, time } = await searchParams;
  const context = new URLSearchParams({ service: professionalServiceId ?? "" });
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) context.set("date", date);
  if (time && /^\d{2}:\d{2}$/.test(time)) context.set("time", time);
  const returnTo = `/artisan/${encodeURIComponent(slug)}/reserver?${context}`;

  if (!professionalServiceId) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: professional }, { data: professionalService }, { data: profile }] = await Promise.all([
    supabase.from("public_professional_profiles").select("profile_id, company_name, slug").eq("slug", slug).single(),
    supabase
      .from("professional_services")
      .select("id, professional_id, price_cents, duration_minutes, pricing_type, active, services(name)")
      .eq("id", professionalServiceId)
      .single(),
    user ? supabase.from("profiles").select("first_name, last_name, phone, role").eq("id", user.id).single() : Promise.resolve({ data: null }),
  ]);

  if (!professional?.profile_id || !professional.company_name || !professional.slug || !professionalService || !professionalService.active || professionalService.professional_id !== professional.profile_id) {
    notFound();
  }

  if (user && profile?.role !== "customer") {
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
  const bookingForm = <BookingForm
    professionalId={professional.profile_id}
    professionalServiceId={professionalService.id}
    serviceName={service?.name ?? ""}
    companyName={professional.company_name}
    priceCents={professionalService.price_cents}
    durationMinutes={professionalService.duration_minutes}
    isQuoteRequest={professionalService.pricing_type === "quote"}
    returnTo={returnTo}
    isGuest={!user}
    initialDate={context.get("date") ?? undefined}
    initialTime={context.get("time") ?? undefined}
    prefill={{ fullName: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || undefined, phone: profile?.phone ?? undefined, email: user?.email ?? undefined }}
  />;

  return (
    <div className="bg-secondary/25">
    <div className="container max-w-6xl py-8 sm:py-12">
      <p className="text-sm text-muted-foreground">
        <Link href={`/artisan/${professional.slug}`} className="hover:text-primary">
          ← Retour à {professional.company_name}
        </Link>
      </p>
      <h1 className="mt-5 font-display text-2xl font-bold tracking-tight sm:text-4xl">Votre réservation</h1>
      <p className="mt-2 break-words text-sm text-muted-foreground">{professional.company_name} · {service?.name}</p>
      <div className="mt-5">
        {user || mode === "guest" ? bookingForm : <BookingAccessChoice returnTo={returnTo} />}
      </div>

    </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { todayLocal } from "@/lib/booking/slot-math";

/** Returns the authenticated user's id, redirecting to login if absent. Pages are already
 * protected by middleware, but Server Actions and data loaders check again defensively. */
export async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  return user.id;
}

export async function getOwnProfessional(professionalId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("professionals")
    .select("*")
    .eq("profile_id", professionalId)
    .single();
  return data;
}

export async function getOwnProfessionalServices(professionalId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("professional_services")
    .select("*, services(id, name, slug, default_pricing_type)")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getOwnServiceAreas(professionalId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("professional_service_areas")
    .select("*, cities(id, name, slug)")
    .eq("professional_id", professionalId);
  return data ?? [];
}

export async function getOwnAvailability(professionalId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability")
    .select("*")
    .eq("professional_id", professionalId)
    .order("weekday")
    .order("start_time");
  return data ?? [];
}

export async function getOwnAvailabilityExceptions(professionalId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability_exceptions")
    .select("*")
    .eq("professional_id", professionalId)
    .gte("date", todayLocal())
    .order("date");
  return data ?? [];
}

export async function getOwnDocuments(professionalId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("professional_documents")
    .select("*")
    .eq("professional_id", professionalId)
    .order("uploaded_at", { ascending: false });
  return data ?? [];
}

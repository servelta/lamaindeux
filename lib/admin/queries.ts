import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ProfessionalStatus = Database["public"]["Enums"]["professional_status"];
type BookingStatus = Database["public"]["Enums"]["booking_status"];

const PROFESSIONAL_STATUSES = [
  "PENDING", "UNDER_REVIEW", "APPROVED", "ACTIVE", "SUSPENDED", "REJECTED",
] as const satisfies readonly ProfessionalStatus[];

const BOOKING_STATUSES = [
  "PENDING", "CONFIRMED", "ACCEPTED", "COMPLETED",
  "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_PROFESSIONAL", "NO_SHOW", "DISPUTED",
] as const satisfies readonly BookingStatus[];

/**
 * Both status filters arrive as raw query-string values, so narrow them
 * before they reach the database instead of trusting whatever is in the
 * URL. An unrecognised value drops the filter rather than erroring — the
 * admin sees the unfiltered list, which is the harmless outcome.
 */
function isProfessionalStatus(value: string): value is ProfessionalStatus {
  return (PROFESSIONAL_STATUSES as readonly string[]).includes(value);
}

function isBookingStatus(value: string): value is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(value);
}

/** Redirects away if the current user isn't an admin. Middleware already
 * blocks this at the route level; this is the defense-in-depth check
 * inside data loaders and Server Actions. */
export async function requireAdmin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  return user.id;
}

export type ProfessionalListFilters = {
  status?: string;
  search?: string;
};

export async function listProfessionals(filters: ProfessionalListFilters) {
  const supabase = await createClient();
  let query = supabase
    .from("professionals")
    .select("profile_id, company_name, slug, status, business_city, contract_status, payment_status, created_at, profiles(first_name, last_name)")
    .order("created_at", { ascending: false });

  if (filters.status && isProfessionalStatus(filters.status)) query = query.eq("status", filters.status);
  if (filters.search) query = query.ilike("company_name", `%${filters.search}%`);

  const { data } = await query;
  return data ?? [];
}

export async function getProfessionalDetail(professionalId: string) {
  const supabase = await createClient();

  const [{ data: professional }, { data: documents }, { data: bookings }, { data: reviews }] = await Promise.all([
    supabase.from("professionals").select("*, profiles(first_name, last_name, phone)").eq("profile_id", professionalId).single(),
    supabase.from("professional_documents").select("*").eq("professional_id", professionalId).order("uploaded_at", { ascending: false }),
    supabase
      .from("bookings")
      .select("id, booking_number, status, scheduled_date, professional_services(services(name))")
      .eq("professional_id", professionalId)
      .order("scheduled_date", { ascending: false })
      .limit(20),
    supabase.from("reviews").select("id, rating, comment, created_at").eq("professional_id", professionalId).order("created_at", { ascending: false }),
  ]);

  return { professional, documents: documents ?? [], bookings: bookings ?? [], reviews: reviews ?? [] };
}

export type CustomerListFilters = { search?: string };

export async function listCustomers(filters: CustomerListFilters) {
  const supabase = await createClient();
  let query = supabase
    .from("customers")
    .select("profile_id, suspended_at, created_at, profiles(first_name, last_name)")
    .order("created_at", { ascending: false });

  const { data } = await query;
  let rows = data ?? [];

  if (filters.search) {
    const s = filters.search.toLowerCase();
    rows = rows.filter((r) => {
      const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.toLowerCase();
      return name.includes(s);
    });
  }

  return rows;
}

export async function getCustomerDetail(customerId: string) {
  const supabase = await createClient();
  const [{ data: customer }, { data: bookings }] = await Promise.all([
    supabase.from("customers").select("*, profiles(first_name, last_name, phone)").eq("profile_id", customerId).single(),
    supabase
      .from("bookings")
      .select("id, booking_number, status, scheduled_date, professionals(company_name), professional_services(services(name))")
      .eq("customer_id", customerId)
      .order("scheduled_date", { ascending: false })
      .limit(20),
  ]);
  return { customer, bookings: bookings ?? [] };
}

export type AdminBookingFilters = {
  status?: string;
  bookingNumber?: string;
  city?: string;
};

export async function listAllBookings(filters: AdminBookingFilters) {
  const supabase = await createClient();
  let query = supabase
    .from("bookings")
    .select(
      "id, booking_number, status, scheduled_date, scheduled_time, city, contact_first_name, contact_last_name, professionals(company_name), professional_services(services(name))"
    )
    .order("scheduled_date", { ascending: false })
    .limit(100);

  if (filters.status && isBookingStatus(filters.status)) query = query.eq("status", filters.status);
  if (filters.bookingNumber) query = query.ilike("booking_number", `%${filters.bookingNumber}%`);
  if (filters.city) query = query.ilike("city", `%${filters.city}%`);

  const { data } = await query;
  return data ?? [];
}

export async function getAdminBookingDetail(bookingId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("*, professionals(company_name, slug), professional_services(services(name))")
    .eq("id", bookingId)
    .single();
  return data;
}

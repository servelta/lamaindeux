import { createClient, createAdminClient } from "@/lib/supabase/server";
import { verifyReceiptToken } from "@/lib/booking/receipt-token";

const BOOKING_SELECT = `
  id, booking_number, status, scheduled_date, scheduled_time,
  contact_first_name, contact_last_name, contact_phone, contact_email,
  address_line, postcode, city, description, photo_urls,
  price_cents, is_quote_request, cancelled_reason, created_at,
  professional_id, professional_service_id,
  professional_services(id, price_cents, duration_minutes, services(name))
`;

type ServiceSummary = { id: string; price_cents: number | null; duration_minutes: number | null; services: { name: string } | null };
type PublicProfessional = { profile_id: string | null; company_name: string | null; slug: string | null };
async function attachPublicProfessionals<T extends { professional_id: string; professional_service_id: string; professional_services: ServiceSummary | null }>(rows: T[]): Promise<(Omit<T, "professional_services"> & { professional_services: ServiceSummary | null; professionals: PublicProfessional | null })[]> {
  if (rows.length === 0) return rows.map((row) => ({ ...row, professionals: null }));

  const supabase = await createClient();
  const professionalIds = [...new Set(rows.map((row) => row.professional_id))];
  const { data: professionals } = await supabase
    .from("public_professional_profiles")
    .select("profile_id, company_name, slug")
    .in("profile_id", professionalIds);

  const byId = new Map((professionals ?? []).map((professional) => [professional.profile_id, professional]));
  // These booking rows have already passed owner RLS or a signed guest receipt.
  // Archived offerings are hidden by public service RLS but remain part of the
  // customer's existing reservation; fetch only its referenced service IDs.
  const missingIds = [...new Set(rows.filter(row => !row.professional_services && row.professional_service_id).map(row => row.professional_service_id))];
  const { data: archivedServices } = missingIds.length ? await createAdminClient()
    .from("professional_services").select("id,price_cents,duration_minutes,services(name)").in("id", missingIds) : { data: [] };
  const archivedById = new Map((archivedServices ?? []).map(service => [service.id, service]));
  return rows.map((row) => ({ ...row, professionals: byId.get(row.professional_id) ?? null,
    professional_services: row.professional_services ?? archivedById.get(row.professional_service_id) ?? null }));
}

export async function getCustomerBookings(customerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("customer_id", customerId)
    .order("scheduled_date", { ascending: false })
    .order("scheduled_time", { ascending: false });
  return attachPublicProfessionals(data ?? []);
}

export async function getPlumberBookings(professionalId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("professional_id", professionalId)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true });
  return attachPublicProfessionals(data ?? []);
}

export async function getBookingById(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("bookings").select(BOOKING_SELECT).eq("id", id).single();
  return data ? (await attachPublicProfessionals([data]))[0] : data;
}

export async function getBookingByNumber(bookingNumber: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("booking_number", bookingNumber)
    .single();
  return data ? (await attachPublicProfessionals([data]))[0] : data;
}

/** Public receipts require a valid signed capability for exactly this booking. */
export async function getGuestBookingByNumber(bookingNumber: string, token: string | undefined) {
  const receipt = verifyReceiptToken(token, bookingNumber, process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");
  if (!receipt) return null;
  const { data } = await createAdminClient().from("bookings").select(BOOKING_SELECT)
    .eq("id", receipt.bookingId).eq("booking_number", bookingNumber).single();
  return data ? (await attachPublicProfessionals([data]))[0] : null;
}

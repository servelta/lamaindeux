import { createClient, createAdminClient } from "@/lib/supabase/server";
import { verifyReceiptToken } from "@/lib/booking/receipt-token";

const BOOKING_SELECT = `
  id, booking_number, status, scheduled_date, scheduled_time,
  contact_first_name, contact_last_name, contact_phone, contact_email,
  address_line, postcode, city, description, photo_urls,
  price_cents, is_quote_request, cancelled_reason, created_at,
  professional_id,
  professional_services(id, price_cents, duration_minutes, services(name))
`;

async function attachPublicProfessionals<T extends { professional_id: string }>(rows: T[]) {
  if (rows.length === 0) return rows.map((row) => ({ ...row, professionals: null }));

  const supabase = await createClient();
  const professionalIds = [...new Set(rows.map((row) => row.professional_id))];
  const { data: professionals } = await supabase
    .from("public_professional_profiles")
    .select("profile_id, company_name, slug")
    .in("profile_id", professionalIds);

  const byId = new Map((professionals ?? []).map((professional) => [professional.profile_id, professional]));
  return rows.map((row) => ({ ...row, professionals: byId.get(row.professional_id) ?? null }));
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

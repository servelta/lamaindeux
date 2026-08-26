import { createClient } from "@/lib/supabase/server";

const BOOKING_SELECT = `
  id, booking_number, status, scheduled_date, scheduled_time,
  contact_first_name, contact_last_name, contact_phone, contact_email,
  address_line, postcode, city, description, photo_urls,
  price_cents, is_quote_request, cancelled_reason, created_at,
  professionals(company_name, slug),
  professional_services(id, price_cents, duration_minutes, services(name))
`;

export async function getCustomerBookings(customerId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("customer_id", customerId)
    .order("scheduled_date", { ascending: false })
    .order("scheduled_time", { ascending: false });
  return data ?? [];
}

export async function getPlumberBookings(professionalId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("professional_id", professionalId)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true });
  return data ?? [];
}

export async function getBookingById(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("bookings").select(BOOKING_SELECT).eq("id", id).single();
  return data;
}

export async function getBookingByNumber(bookingNumber: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("booking_number", bookingNumber)
    .single();
  return data;
}

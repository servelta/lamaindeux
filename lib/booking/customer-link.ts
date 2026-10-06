import { createAdminClient } from "@/lib/supabase/server";
import { createReceiptToken } from "@/lib/booking/receipt-token";

/** Contact email never authorizes account access; only server-managed guest metadata does. */
export async function customerBookingLink(booking: { id: string; booking_number: string; customer_id: string }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://lamaindeux.vercel.app";
  const { data } = await createAdminClient().auth.admin.getUserById(booking.customer_id);
  if (data.user?.app_metadata.booking_guest === true) {
    const receipt = createReceiptToken(booking.id, booking.booking_number, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    return `${base}/reservation-confirmee/${booking.booking_number}?receipt=${encodeURIComponent(receipt)}`;
  }
  return `${base}/mes-reservations/${booking.id}`;
}

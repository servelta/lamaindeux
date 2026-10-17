import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { formatAddress } from "@/lib/utils/format";
import type { BookingBillingPrefill } from "./model";

export async function getBookingBillingPrefill(
  bookingId: string,
  professionalId: string,
): Promise<BookingBillingPrefill | null> {
  if (!z.string().uuid().safeParse(bookingId).success) return null;
  const client = await createClient();
  const { data, error } = await client
    .from("bookings")
    .select(
      "id,booking_number,contact_first_name,contact_last_name,contact_phone,contact_email,address_line,postcode,city,scheduled_date,description,professional_services(duration_minutes,services(name))",
    )
    .eq("id", bookingId)
    .eq("professional_id", professionalId)
    .maybeSingle();
  if (error || !data) return null;
  const service = Array.isArray(data.professional_services)
    ? data.professional_services[0]
    : data.professional_services;
  const catalog =
    service &&
    (Array.isArray(service.services) ? service.services[0] : service.services);
  return {
    bookingId: data.id,
    bookingNumber: data.booking_number,
    clientName: `${data.contact_first_name} ${data.contact_last_name}`.trim(),
    clientAddress: formatAddress(
      data.address_line,
      null,
      [data.postcode, data.city].filter(Boolean).join(" "),
    ),
    clientEmail: data.contact_email,
    clientPhone: data.contact_phone,
    serviceOn: data.scheduled_date,
    description: [catalog?.name, data.description]
      .filter(Boolean)
      .join(" — ")
      .slice(0, 500),
    duration: service?.duration_minutes
      ? `${service.duration_minutes} min`
      : "",
  };
}

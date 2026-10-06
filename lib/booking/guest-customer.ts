import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Bookings require a customer/profile FK. Keep a non-login guest record for that
 * relation without attaching to an existing account or storing the contact email
 * as an auth identity. No password, session, welcome email or OTP goes to the guest.
 * app_metadata is server-managed; the identity is banned from authenticating.
 */
export async function createGuestCustomer(admin: SupabaseClient<Database>, firstName: string, lastName: string, phone: string) {
  const { data, error } = await admin.auth.admin.createUser({
    email: `guest-${crypto.randomUUID()}@guest.plan-b.invalid`,
    password: crypto.randomUUID() + crypto.randomUUID(),
    email_confirm: true,
    ban_duration: "876000h",
    app_metadata: { booking_guest: true },
    user_metadata: { role: "customer", first_name: firstName, last_name: lastName, phone },
  });
  if (error || !data.user) throw new Error("Guest customer creation failed.");
  return data.user.id;
}

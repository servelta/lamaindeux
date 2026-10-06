import { createClient } from "@supabase/supabase-js";
import { createProvisioningClient } from "../lib/professional/provision-plumbing-services";
import { createGuestCustomer } from "../lib/booking/guest-customer";

async function main() {
  if (process.env.VERCEL_ENV !== "production") return;
  const admin = createProvisioningClient();
  let guestId: string | undefined;
  try {
    // Probe only an isolated guest identity: no booking, occupied slot, email or SMS.
    guestId = await createGuestCustomer(admin, "Guest booking", "verification", "");
    const { data, error } = await admin.from("customers").select("profile_id").eq("profile_id", guestId).single();
    if (error || data?.profile_id !== guestId) throw new Error("Guest customer relation unavailable.");
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data: publicRows, error: publicError } = await anon.from("bookings").select("id").limit(1);
    if ((publicError && publicError.code !== "42501") || (publicRows && publicRows.length !== 0)) throw new Error("Guest booking privacy check failed.");
    console.log("[guest booking] Customer relation verified; booking rows remain private to anonymous visitors. No notifications sent.");
  } finally {
    if (guestId) {
      const { error } = await admin.auth.admin.deleteUser(guestId);
      if (error) throw new Error("Guest verification record cleanup failed.");
    }
  }
}

main().catch((error: unknown) => {
  console.error(`[guest booking] ${error instanceof Error ? error.message : "Verification failed."}`);
  process.exitCode = 1;
});

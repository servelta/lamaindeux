import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

async function main() {
  if (process.env.VERCEL_ENV !== "production") return;
  const client = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Read-only checks with the visitor key, never the service-role key.
  const checks = await Promise.all([
    client.from("bookings").select("id").limit(1),
    client.from("customers").select("profile_id").limit(1),
    client.from("professional_documents").select("id").limit(1),
    client.from("notifications").select("id").limit(1),
  ]);
  for (const result of checks) {
    if ((result.error && result.error.code !== "42501") || result.data?.length) {
      throw new Error("Anonymous access to private records could not be verified.");
    }
  }
  const { data: profiles, error } = await client.from("public_professional_profiles")
    .select("profile_id,public_email");
  if (error || profiles?.some(profile => profile.public_email)) throw new Error("Public artisan email privacy check failed.");
  const ids = profiles?.flatMap(profile => profile.profile_id ? [profile.profile_id] : []) ?? [];
  if (ids.length) {
    const { data: services, error: servicesError } = await client.from("professional_services")
      .select("professional_id").in("professional_id", ids).eq("active", true);
    if (servicesError || ids.some(id => services?.filter(service => service.professional_id === id).length !== 2)) {
      throw new Error("Public artisan service count check failed.");
    }
  }
  console.log(`[public privacy] Private bookings, customers, documents and notifications inaccessible anonymously. ${ids.length} public artisan profiles hide email and offer exactly two services.`);
}
main().catch((error: unknown) => {
  console.error(`[public privacy] ${error instanceof Error ? error.message : "Verification failed."}`);
  process.exitCode = 1;
});

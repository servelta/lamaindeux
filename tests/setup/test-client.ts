import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

/**
 * Integration tests need a real (local or dedicated test project) Supabase
 * instance — they exercise actual RLS policies and triggers, which a mock
 * can't meaningfully verify. Set these env vars (e.g. via `.env.test.local`
 * pointed at `supabase start`'s local stack) to run them; see README.
 */
export function hasSupabaseTestEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type TestRole = "customer" | "professional" | "admin";

/**
 * Creates a real auth user (email pre-confirmed) with the given role, then
 * signs in as them to get a normal session-bound client — i.e. one that's
 * subject to RLS exactly like a real logged-in user, not the service role.
 * For 'admin', creates as customer first then promotes the profile
 * directly, mirroring how scripts/create-admin.ts works in production
 * (the signup trigger never allows self-assigning admin).
 */
export async function createTestUser(role: TestRole, overrides: Record<string, unknown> = {}) {
  const admin = adminClient();
  const email = `test-${randomUUID()}@example.com`;
  const password = "Test-password-123!";

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: role === "admin" ? "customer" : role,
      first_name: "Test",
      last_name: "User",
      phone: "0612345678",
      ...(role === "professional" ? { company_name: "Test Plomberie" } : {}),
      ...overrides,
    },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create test user: ${error?.message}`);
  }

  if (role === "admin") {
    await admin.from("profiles").update({ role: "admin" }).eq("id", data.user.id);
  }

  const anon = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { error: signInError } = await anon.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(`Failed to sign in test user: ${signInError.message}`);

  return { id: data.user.id, email, client: anon };
}

/** Deletes a test user — cascades to profiles/customers/professionals via FK. */
export async function deleteTestUser(userId: string) {
  const admin = adminClient();
  await admin.auth.admin.deleteUser(userId);
}

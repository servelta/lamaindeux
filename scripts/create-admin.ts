/**
 * One-time script to create the first admin account.
 * Run with: npm run create-admin -- --email=you@example.com --password=... --firstName=... --lastName=...
 *
 * Uses the Supabase service role key (server-only) to create the auth user
 * and then promotes their profile to 'admin' — bypassing the normal sign-up
 * trigger, which deliberately never allows self-assigning the admin role.
 *
 * Requires ADMIN_SETUP_SECRET to be set in the environment and passed via
 * --secret=... as a basic guard against this script being run by accident
 * in a shared environment. This is a convenience check, not a security
 * boundary — access to this script already implies server access.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

function arg(name: string): string | undefined {
  const match = process.argv.find((a) => a.startsWith(`--${name}=`));
  return match?.split("=").slice(1).join("=");
}

async function main() {
  const email = arg("email");
  const password = arg("password");
  const firstName = arg("firstName") ?? "Admin";
  const lastName = arg("lastName") ?? "LaMainDeux";
  const secret = arg("secret");

  if (!email || !password) {
    console.error(
      "Usage: npm run create-admin -- --email=you@example.com --password=... --secret=..."
    );
    process.exit(1);
  }

  if (!process.env.ADMIN_SETUP_SECRET || secret !== process.env.ADMIN_SETUP_SECRET) {
    console.error("Missing or incorrect --secret (must match ADMIN_SETUP_SECRET).");
    process.exit(1);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "customer", // trigger ignores 'admin' at signup by design; we promote below
      first_name: firstName,
      last_name: lastName,
    },
  });

  if (error || !data.user) {
    console.error("Failed to create user:", error?.message);
    process.exit(1);
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", data.user.id);

  if (updateError) {
    console.error("User created but failed to promote to admin:", updateError.message);
    process.exit(1);
  }

  console.log(`✅ Admin account created: ${email}`);
}

main();

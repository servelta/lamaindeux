import { createClient } from "@supabase/supabase-js";
import { createProvisioningClient } from "../lib/professional/provision-plumbing-services";

async function main() {
  if (process.env.VERCEL_ENV !== "production") return;
  const admin = createProvisioningClient();
  const { data: professionals, error } = await admin.from("professionals")
    .select("profile_id,public_email").not("public_email", "is", null);
  if (error) throw new Error("Unable to read legacy contact fields.");
  for (const professional of professionals ?? []) {
    const { data, error: userError } = await admin.auth.admin.getUserById(professional.profile_id);
    if (userError || !data.user) throw new Error("Unable to preserve a private contact.");
    // Preserve contact details before removing the legacy publicly readable field.
    // App metadata is available to the account owner and server, never public views.
    const { error: saveError } = await admin.auth.admin.updateUserById(professional.profile_id, {
      app_metadata: { ...data.user.app_metadata,
        professional_contact_email: data.user.app_metadata.professional_contact_email ?? professional.public_email },
    });
    if (saveError) throw new Error("Unable to save a private contact.");
    const { error: clearError } = await admin.from("professionals")
      .update({ public_email: null }).eq("profile_id", professional.profile_id);
    if (clearError) throw new Error("Unable to remove a public contact.");
  }
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data: exposed, error: publicError } = await anon.from("public_professional_profiles")
    .select("public_email").not("public_email", "is", null).limit(1);
  if (publicError || exposed?.length) throw new Error("Public email privacy verification failed.");
  console.log("[contact privacy] Contacts preserved privately; public profile data contains no email addresses.");
}
main().catch(() => { console.error("[contact privacy] Migration or verification failed; deployment stopped."); process.exitCode = 1; });

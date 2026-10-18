import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function getProfessionalContact(professionalId: string) {
  const supabase = createAdminClient();

  const [{ data: authUser }, { data: profile }, { data: professional }] = await Promise.all([
    supabase.auth.admin.getUserById(professionalId),
    supabase.from("profiles").select("phone, first_name").eq("id", professionalId).single(),
    supabase.from("professionals").select("company_name, public_phone").eq("profile_id", professionalId).single(),
  ]);

  const contactEmail = z.string().trim().email().safeParse(authUser?.user?.app_metadata?.professional_contact_email);

  return {
    email: contactEmail.success ? contactEmail.data : authUser?.user?.email ?? null,
    phone: professional?.public_phone?.trim() || profile?.phone || null,
    firstName: profile?.first_name ?? "",
    companyName: professional?.company_name ?? "",
  };
}

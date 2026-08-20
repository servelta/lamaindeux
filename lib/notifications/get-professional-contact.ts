import { createAdminClient } from "@/lib/supabase/server";

export async function getProfessionalContact(professionalId: string) {
  const supabase = createAdminClient();

  const [{ data: authUser }, { data: profile }, { data: professional }] = await Promise.all([
    supabase.auth.admin.getUserById(professionalId),
    supabase.from("profiles").select("phone, first_name").eq("id", professionalId).single(),
    supabase.from("professionals").select("company_name").eq("profile_id", professionalId).single(),
  ]);

  return {
    email: authUser?.user?.email ?? null,
    phone: profile?.phone ?? null,
    firstName: profile?.first_name ?? "",
    companyName: professional?.company_name ?? "",
  };
}

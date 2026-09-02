import { createClient } from "@/lib/supabase/server";
import { SiteHeader, type CurrentUser } from "@/components/layout/site-header";

export async function AuthAwareHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentUser: CurrentUser = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, avatar_url, role")
      .eq("id", user.id)
      .maybeSingle();

    currentUser = {
      firstName: profile?.first_name ?? "",
      avatarUrl: profile?.avatar_url ?? null,
      role: profile?.role ?? "customer",
    };
  }

  return <SiteHeader currentUser={currentUser} />;
}
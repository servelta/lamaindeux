import { createAdminClient } from "@/lib/supabase/server";

/**
 * Reads the single platform_settings row. Uses the admin client since this
 * is called from background-ish code paths (booking actions) that shouldn't
 * depend on there being a logged-in user's RLS context — though the row is
 * readable by anyone per its RLS policy anyway.
 */
export async function getPlatformSettings() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("platform_settings").select("*").eq("id", true).single();
  return data;
}

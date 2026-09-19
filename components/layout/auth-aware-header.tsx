import { createClient } from "@/lib/supabase/server";
import { SiteHeader, type CurrentUser } from "@/components/layout/site-header";
import { getActiveCities, getAllTrades } from "@/lib/queries/search";

/**
 * @param showTrades - renders the trade bar under the header. On by default
 *   for the public site; the dashboards pass false, since they have their
 *   own side navigation and browsing trades is not what someone is there
 *   to do.
 */
export async function AuthAwareHeader({ showTrades = true }: { showTrades?: boolean } = {}) {
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

  const [trades, cities] = showTrades
    ? await Promise.all([getAllTrades(), getActiveCities()])
    : [[], []];

  return <SiteHeader currentUser={currentUser} trades={trades} cities={cities} />;
}

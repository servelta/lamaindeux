import { createClient } from "@/lib/supabase/server";

export type TradeRow = {
  id: string;
  name: string;
  name_singular: string;
  slug_singular: string;
  slug_plural: string;
  icon: string | null;
  active: boolean;
};

export async function getActiveTrades(): Promise<TradeRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trades")
    .select("id, name, name_singular, slug_singular, slug_plural, icon, active")
    .eq("active", true)
    .order("sort_order");
  return data ?? [];
}

/** Includes inactive trades too — used for the "coming soon" list on the homepage. */
export async function getAllTrades(): Promise<TradeRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trades")
    .select("id, name, name_singular, slug_singular, slug_plural, icon, active")
    .order("sort_order");
  return data ?? [];
}

export async function getTradeBySlugPlural(slugPlural: string): Promise<TradeRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trades")
    .select("id, name, name_singular, slug_singular, slug_plural, icon, active")
    .eq("slug_plural", slugPlural)
    .eq("active", true)
    .single();
  return data ?? null;
}

export type CityRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
};

export async function getActiveCities(): Promise<CityRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name, slug, active")
    .eq("active", true)
    .order("name");
  return data ?? [];
}

export async function getCityBySlug(slug: string): Promise<CityRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cities")
    .select("id, name, slug, active")
    .eq("slug", slug)
    .eq("active", true)
    .single();
  return data ?? null;
}

export type ServiceRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  default_pricing_type: "fixed" | "quote";
  trade_id: string;
};

/** Pass a tradeId to scope to one trade (e.g. the city+service pages always do). */
export async function getActiveServices(tradeId?: string): Promise<ServiceRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("services")
    .select("id, name, slug, description, default_pricing_type, trade_id")
    .eq("active", true);
  if (tradeId) query = query.eq("trade_id", tradeId);
  const { data } = await query.order("sort_order");
  return data ?? [];
}

export async function getServiceBySlug(slug: string, tradeId?: string): Promise<ServiceRow | null> {
  const supabase = await createClient();
  let query = supabase
    .from("services")
    .select("id, name, slug, description, default_pricing_type, trade_id")
    .eq("slug", slug)
    .eq("active", true);
  if (tradeId) query = query.eq("trade_id", tradeId);
  const { data } = await query.single();
  return data ?? null;
}

export type ProfessionalSearchResult = {
  profile_id: string;
  trade_id: string;
  trade_slug_plural: string;
  trade_name_singular: string;
  company_name: string;
  slug: string;
  description: string | null;
  business_city: string | null;
  rating_avg: number;
  rating_count: number;
  completed_jobs_count: number;
  avatar_url: string | null;
  professional_service_id: string;
  service_name: string;
  service_slug: string;
  pricing_type: "fixed" | "quote";
  price_cents: number | null;
  duration_minutes: number | null;
  city_slug: string;
  city_name: string;
};

/**
 * Search the active_professionals view (Phase 1, rebuilt trade-aware in the
 * multi-trade generalization) — the only table/view public search should
 * ever read from, since it already excludes anything not status='ACTIVE'
 * or belonging to a currently-inactive trade.
 */
export async function searchProfessionals(params: {
  tradeSlugPlural?: string;
  citySlug?: string;
  serviceSlug?: string;
  postcode?: string;
}): Promise<ProfessionalSearchResult[]> {
  const supabase = await createClient();
  let query = supabase.from("active_professionals").select("*");

  if (params.tradeSlugPlural) {
    query = query.eq("trade_slug_plural", params.tradeSlugPlural);
  }
  if (params.citySlug) {
    query = query.eq("city_slug", params.citySlug);
  }
  if (params.serviceSlug) {
    query = query.eq("service_slug", params.serviceSlug);
  }

  const { data, error } = await query.order("rating_avg", { ascending: false });

  if (error || !data) return [];

  // De-duplicate: a professional can serve a city via multiple postcode rows,
  // which would otherwise produce repeated cards for the same professional+service.
  const seen = new Set<string>();
  const results: ProfessionalSearchResult[] = [];
  for (const row of data as any[]) {
    const key = `${row.profile_id}-${row.professional_service_id}`;
    if (seen.has(key)) continue;
    if (params.postcode && row.postcodes?.length && !row.postcodes.includes(params.postcode)) {
      continue;
    }
    seen.add(key);
    results.push(row);
  }
  return results;
}

export async function getProfessionalBySlug(slug: string) {
  const supabase = await createClient();

  const { data: professional } = await supabase
    .from("professionals")
    .select(
      "profile_id, company_name, slug, description, business_city, rating_avg, rating_count, completed_jobs_count, status, trade_id, trades(name_singular, slug_singular, slug_plural), profiles(first_name, last_name, avatar_url)"
    )
    .eq("slug", slug)
    .eq("status", "ACTIVE")
    .single();

  if (!professional) return null;

  const { data: services } = await supabase
    .from("professional_services")
    .select("id, price_cents, duration_minutes, pricing_type, description, services(name, slug)")
    .eq("professional_id", professional.profile_id)
    .eq("active", true);

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment, created_at")
    .eq("professional_id", professional.profile_id)
    .eq("hidden_by_admin", false)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: areas } = await supabase
    .from("professional_service_areas")
    .select("cities(name, slug)")
    .eq("professional_id", professional.profile_id);

  return { professional, services: services ?? [], reviews: reviews ?? [], areas: areas ?? [] };
}

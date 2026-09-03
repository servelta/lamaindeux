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
    seen.add(key);
    results.push(row);
  }
  return results;
}

/**
 * The public profile view only contains ACTIVE professionals, so a
 * professional waiting for approval gets a bare 404 on their own page and no
 * way to check how it looks. This reads the raw row for that one case — the
 * viewer being the owner, or an admin — which is exactly the access
 * `professionals_select_own_or_admin` is there to grant, and shapes it like
 * the view so callers do not care which path produced it.
 *
 * Returns null for everyone else, so the row stays private.
 */
async function getPreviewProfileForOwnerOrAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: raw } = await supabase
    .from("professionals")
    .select(
      "profile_id, trade_id, company_name, slug, description, business_address, business_city, business_postcode, public_phone, public_email, rating_avg, rating_count, completed_jobs_count, google_rating, google_review_count, status, trades(name_singular, slug_singular, slug_plural), profiles(first_name, last_name, avatar_url)"
    )
    .eq("slug", slug)
    .single();

  if (!raw) return null;

  if (user.id !== raw.profile_id) {
    const { data: viewer } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (viewer?.role !== "admin") return null;
  }

  const trade = Array.isArray(raw.trades) ? raw.trades[0] : raw.trades;
  const profile = Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles;

  return {
    profile_id: raw.profile_id,
    trade_id: raw.trade_id,
    trade_name_singular: trade?.name_singular ?? null,
    trade_slug_singular: trade?.slug_singular ?? null,
    trade_slug_plural: trade?.slug_plural ?? null,
    company_name: raw.company_name,
    slug: raw.slug,
    description: raw.description,
    business_address: raw.business_address,
    business_city: raw.business_city,
    business_postcode: raw.business_postcode,
    public_phone: raw.public_phone,
    public_email: raw.public_email,
    rating_avg: raw.rating_avg,
    rating_count: raw.rating_count,
    completed_jobs_count: raw.completed_jobs_count,
    google_rating: raw.google_rating,
    google_review_count: raw.google_review_count,
    first_name: profile?.first_name ?? null,
    last_name: profile?.last_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
    status: raw.status as string,
  };
}

export async function getProfessionalBySlug(slug: string) {
  const supabase = await createClient();

  const { data: publicRow } = await supabase
    .from("public_professional_profiles")
    .select("*")
    .eq("slug", slug)
    .single();

  const professional = publicRow ?? (await getPreviewProfileForOwnerOrAdmin(supabase, slug));
  const isPreview = !publicRow && Boolean(professional);

  if (!professional?.profile_id || !professional.company_name || !professional.slug) return null;

  const publicProfessional = {
    ...professional,
    profile_id: professional.profile_id,
    company_name: professional.company_name,
    slug: professional.slug,
    rating_avg: professional.rating_avg ?? 0,
    rating_count: professional.rating_count ?? 0,
    completed_jobs_count: professional.completed_jobs_count ?? 0,
  };

  const { data: services } = await supabase
    .from("professional_services")
    .select("id, price_cents, duration_minutes, pricing_type, description, services(name, slug)")
    .eq("professional_id", publicProfessional.profile_id)
    .eq("active", true);

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment, created_at")
    .eq("professional_id", publicProfessional.profile_id)
    .eq("hidden_by_admin", false)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: areas } = await supabase
    .from("professional_service_areas")
    .select("cities(name, slug)")
    .eq("professional_id", professional.profile_id);

  const { data: gallery } = await supabase
    .from("professional_gallery_photos")
    .select("id, storage_path, sort_order, created_at")
    .eq("professional_id", publicProfessional.profile_id)
    .order("sort_order")
    .order("created_at");

  return {
    professional: publicProfessional,
    services: services ?? [],
    reviews: reviews ?? [],
    areas: areas ?? [],
    gallery: (gallery ?? []).map((photo) => ({
      ...photo,
      url: supabase.storage.from("avatars").getPublicUrl(photo.storage_path).data.publicUrl,
    })),
    isPreview,
  };
}

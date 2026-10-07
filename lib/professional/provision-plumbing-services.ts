// Server-side provisioning only. Never import this module into a client component.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { standardServices } from "./default-plumbing-services";

export function createProvisioningClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key === "[SENSITIVE]")
    throw new Error(
      "Server database configuration is required for plumbing service provisioning.",
    );
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function provisionPlumbingServices(
  client: SupabaseClient<Database>,
  professionalId?: string,
) {
  const { data: trades, error: tradeError } = await client
    .from("trades")
    .select("id,slug_singular").order("id");
  if (tradeError || !trades?.length)
    throw new Error("Unable to read the artisan trades.");

  let total = 0;
  for (const trade of trades) {
  const DEFAULT_PLUMBING_SERVICES = standardServices(trade.slug_singular);
  const slugs = DEFAULT_PLUMBING_SERVICES.map((service) => service.slug);
  const { error: catalogError } = await client.from("services").upsert(
    DEFAULT_PLUMBING_SERVICES.map((service, index) => ({
      ...service,
      trade_id: trade.id,
      default_pricing_type: "quote" as const,
      active: true,
      sort_order: index - 1,
    })),
    { onConflict: "slug", ignoreDuplicates: true },
  );
  if (catalogError)
    throw new Error(
      `Unable to provision the standard catalog: ${catalogError.code}`,
    );

  const { data: catalog, error: readError } = await client
    .from("services")
    .select("id, slug, trade_id")
    .in("slug", slugs);
  if (
    readError ||
    catalog?.length !== slugs.length ||
    catalog.some((service) => service.trade_id !== trade.id)
  )
    throw new Error(
      "The standard catalog is incomplete or belongs to another trade.",
    );
  const serviceIds = catalog.map((service) => service.id);
  for (const [index, standard] of DEFAULT_PLUMBING_SERVICES.entries()) {
    const { error } = await client
      .from("services")
      .update({ active: true, sort_order: index - 1, name: standard.name, description: standard.description })
      .eq("slug", standard.slug)
      .eq("trade_id", trade.id);
    if (error)
      throw new Error(
        `Unable to activate a standard service: ${error.code}`,
      );
  }

  const { error: archiveCatalogError } = await client.from("services").update({ active: false }).eq("trade_id", trade.id).not("id", "in", `(${serviceIds.join(",")})`);
  if (archiveCatalogError) throw new Error("Unable to archive legacy services.");
  for (let offset = 0; ; offset += 100) {
    let query = client
      .from("professionals")
      .select("profile_id")
      .eq("trade_id", trade.id)
      .order("profile_id")
      .range(offset, offset + 99);
    if (professionalId) query = query.eq("profile_id", professionalId);
    const { data: plumbers, error } = await query;
    if (error) throw new Error(`Unable to read artisans: ${error.code}`);
    if (!plumbers?.length) break;
    const professionalIds = plumbers.map((plumber) => plumber.profile_id);
    const assignments = plumbers.flatMap((plumber) =>
      serviceIds.map((serviceId) => ({
        professional_id: plumber.profile_id,
        service_id: serviceId,
        pricing_type: "quote" as const,
        price_cents: null,
        active: true,
      })),
    );
    // Existing row IDs, fixed prices, durations and descriptions remain intact.
    const { error: insertError } = await client
      .from("professional_services")
      .upsert(assignments, {
        onConflict: "professional_id,service_id",
        ignoreDuplicates: true,
      });
    if (insertError)
      throw new Error(
        `Unable to assign standard services: ${insertError.code}`,
      );
    const { error: activeError } = await client
      .from("professional_services")
      .update({ active: true, description: null })
      .in("professional_id", professionalIds)
      .in("service_id", serviceIds);
    if (activeError)
      throw new Error(
        `Unable to activate standard services: ${activeError.code}`,
      );
    // Retain legacy rows for booking history, but only offer the standard set.
    const { error: extraError } = await client
      .from("professional_services")
      .update({ active: false })
      .in("professional_id", professionalIds)
      .not("service_id", "in", `(${serviceIds.join(",")})`);
    if (extraError)
      throw new Error(
        `Unable to archive nonstandard services: ${extraError.code}`,
      );
    const { data: assigned, error: verifyError } = await client
      .from("professional_services")
      .select("professional_id, service_id")
      .in("professional_id", professionalIds)
      .eq("active", true)
      .limit(4000);
    if (
      verifyError ||
      professionalIds.some(
        (id) =>
          assigned?.filter((row) => row.professional_id === id).length !==
          serviceIds.length,
      )
    )
      throw new Error("Standard service verification failed.");
    total += plumbers.length;
    if (professionalId || plumbers.length < 100) break;
  }
  }
  return { professionals: total, servicesPerProfessional: 2 };
}

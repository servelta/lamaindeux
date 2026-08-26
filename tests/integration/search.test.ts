import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { hasSupabaseTestEnv, createTestUser, deleteTestUser, adminClient } from "@/tests/setup/test-client";

describe.skipIf(!hasSupabaseTestEnv())("customer search", () => {
  const createdUserIds: string[] = [];
  let cityId: string;
  let serviceAId: string;
  let serviceBId: string;

  beforeAll(async () => {
    const admin = adminClient();
    const { data: city } = await admin.from("cities").select("id").eq("slug", "paris").single();
    cityId = city!.id;

    const { data: services } = await admin
      .from("services")
      .select("id, slug")
      .in("slug", ["reparation-fuite", "debouchage"]);
    serviceAId = services!.find((s) => s.slug === "reparation-fuite")!.id;
    serviceBId = services!.find((s) => s.slug === "debouchage")!.id;
  });

  afterAll(async () => {
    await Promise.all(createdUserIds.map(deleteTestUser));
  });

  async function makeActivePlumberOffering(serviceId: string) {
    const professional = await createTestUser("professional");
    createdUserIds.push(professional.id);
    const admin = adminClient();

    await admin.from("professionals").update({ status: "ACTIVE", business_city: "Paris" }).eq("profile_id", professional.id);
    await admin.from("professional_service_areas").insert({ professional_id: professional.id, city_id: cityId, postcodes: [] });
    await admin.from("professional_services").insert({
      professional_id: professional.id,
      service_id: serviceId,
      pricing_type: "fixed",
      price_cents: 8900,
      active: true,
    });
    return professional;
  }

  it("only returns professionals with status=ACTIVE (a PENDING professional never appears)", async () => {
    const pendingPlumber = await createTestUser("professional"); // stays PENDING by default
    createdUserIds.push(pendingPlumber.id);
    const admin = adminClient();
    await admin
      .from("professional_service_areas")
      .insert({ professional_id: pendingPlumber.id, city_id: cityId, postcodes: [] });
    await admin.from("professional_services").insert({
      professional_id: pendingPlumber.id,
      service_id: serviceAId,
      pricing_type: "fixed",
      price_cents: 8900,
      active: true,
    });

    const { data } = await admin.from("active_professionals").select("*").eq("profile_id", pendingPlumber.id);
    expect(data).toEqual([]);
  });

  it("filters correctly by service — a professional offering only service A doesn't show up under service B", async () => {
    const professional = await makeActivePlumberOffering(serviceAId);
    const admin = adminClient();

    const { data: underA } = await admin
      .from("active_professionals")
      .select("*")
      .eq("profile_id", professional.id)
      .eq("service_id", serviceAId);
    const { data: underB } = await admin
      .from("active_professionals")
      .select("*")
      .eq("profile_id", professional.id)
      .eq("service_id", serviceBId);

    expect(underA!.length).toBeGreaterThan(0);
    expect(underB).toEqual([]);
  });

  it("filters correctly by city — a professional not serving the given city doesn't show up", async () => {
    const professional = await createTestUser("professional");
    createdUserIds.push(professional.id);
    const admin = adminClient();
    await admin.from("professionals").update({ status: "ACTIVE" }).eq("profile_id", professional.id);
    await admin.from("professional_services").insert({
      professional_id: professional.id,
      service_id: serviceAId,
      pricing_type: "fixed",
      price_cents: 8900,
      active: true,
    });
    // Deliberately no professional_service_areas row for Paris.

    const { data } = await admin
      .from("active_professionals")
      .select("*")
      .eq("profile_id", professional.id)
      .eq("city_id", cityId);
    expect(data).toEqual([]);
  });

  it("excludes an inactive (active=false) professional_service even if the professional is ACTIVE", async () => {
    const professional = await createTestUser("professional");
    createdUserIds.push(professional.id);
    const admin = adminClient();
    await admin.from("professionals").update({ status: "ACTIVE" }).eq("profile_id", professional.id);
    await admin.from("professional_service_areas").insert({ professional_id: professional.id, city_id: cityId, postcodes: [] });
    await admin.from("professional_services").insert({
      professional_id: professional.id,
      service_id: serviceAId,
      pricing_type: "fixed",
      price_cents: 8900,
      active: false, // deactivated by the professional
    });

    const { data } = await admin.from("active_professionals").select("*").eq("profile_id", professional.id);
    expect(data).toEqual([]);
  });
});

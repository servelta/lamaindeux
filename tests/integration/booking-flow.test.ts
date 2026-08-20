import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { hasSupabaseTestEnv, createTestUser, deleteTestUser, adminClient } from "@/tests/setup/test-client";

describe.skipIf(!hasSupabaseTestEnv())("booking flow", () => {
  const createdUserIds: string[] = [];
  let serviceId: string;

  beforeAll(async () => {
    const admin = adminClient();
    const { data } = await admin.from("services").select("id").eq("slug", "reparation-fuite").single();
    serviceId = data!.id;
  });

  afterAll(async () => {
    await Promise.all(createdUserIds.map(deleteTestUser));
  });

  async function setupBookablePlumber() {
    const professional = await createTestUser("professional");
    createdUserIds.push(professional.id);
    const admin = adminClient();
    await admin.from("professionals").update({ status: "ACTIVE" }).eq("profile_id", professional.id);
    const { data: ps } = await admin
      .from("professional_services")
      .insert({
        professional_id: professional.id,
        service_id: serviceId,
        pricing_type: "fixed",
        price_cents: 8900,
        duration_minutes: 60,
        active: true,
      })
      .select("id")
      .single();
    return { professional, professionalServiceId: ps!.id };
  }

  const bookingPayload = (professionalId: string, professionalServiceId: string, time = "10:00") => ({
    professional_id: professionalId,
    professional_service_id: professionalServiceId,
    status: "CONFIRMED" as const,
    scheduled_date: "2027-01-15", // far enough in the future to never collide with "today" checks
    scheduled_time: time,
    contact_first_name: "Jean",
    contact_last_name: "Dupont",
    contact_phone: "0612345678",
    contact_email: "jean@example.com",
    address_line: "15 rue de la Paix",
    postcode: "75015",
    city: "Paris",
    price_cents: 8900,
    is_quote_request: false,
  });

  it("a customer can create a booking for themselves and a booking_number is generated", async () => {
    const customer = await createTestUser("customer");
    createdUserIds.push(customer.id);
    const { professional, professionalServiceId } = await setupBookablePlumber();

    const { data, error } = await customer.client
      .from("bookings")
      .insert({ ...bookingPayload(professional.id, professionalServiceId), customer_id: customer.id })
      .select("booking_number")
      .single();

    expect(error).toBeNull();
    expect(data?.booking_number).toMatch(/^PLB-\d{4}-\d{6}$/);
  });

  it("a customer cannot create a booking on another customer's behalf (RLS insert check)", async () => {
    const customerA = await createTestUser("customer");
    const customerB = await createTestUser("customer");
    createdUserIds.push(customerA.id, customerB.id);
    const { professional, professionalServiceId } = await setupBookablePlumber();

    const { error } = await customerA.client
      .from("bookings")
      .insert({ ...bookingPayload(professional.id, professionalServiceId), customer_id: customerB.id });

    expect(error).not.toBeNull();
  });

  it("prevents double-booking: two bookings for the same professional/date/time fail on the second insert", async () => {
    const customerA = await createTestUser("customer");
    const customerB = await createTestUser("customer");
    createdUserIds.push(customerA.id, customerB.id);
    const { professional, professionalServiceId } = await setupBookablePlumber();

    const { error: firstError } = await customerA.client
      .from("bookings")
      .insert({ ...bookingPayload(professional.id, professionalServiceId, "11:00"), customer_id: customerA.id });
    expect(firstError).toBeNull();

    const { error: secondError } = await customerB.client
      .from("bookings")
      .insert({ ...bookingPayload(professional.id, professionalServiceId, "11:00"), customer_id: customerB.id });

    expect(secondError).not.toBeNull();
    expect(secondError?.code).toBe("23505"); // unique_violation on the partial unique index
  });

  it("allows a new booking in the same slot once the first one is cancelled", async () => {
    const customerA = await createTestUser("customer");
    const customerB = await createTestUser("customer");
    createdUserIds.push(customerA.id, customerB.id);
    const { professional, professionalServiceId } = await setupBookablePlumber();

    const { data: first } = await customerA.client
      .from("bookings")
      .insert({ ...bookingPayload(professional.id, professionalServiceId, "12:00"), customer_id: customerA.id })
      .select("id")
      .single();

    await customerA.client
      .from("bookings")
      .update({ status: "CANCELLED_BY_CUSTOMER" })
      .eq("id", first!.id);

    const { error } = await customerB.client
      .from("bookings")
      .insert({ ...bookingPayload(professional.id, professionalServiceId, "12:00"), customer_id: customerB.id });

    expect(error).toBeNull();
  });

  it("a customer cannot read a booking belonging to a different customer", async () => {
    const customerA = await createTestUser("customer");
    const customerB = await createTestUser("customer");
    createdUserIds.push(customerA.id, customerB.id);
    const { professional, professionalServiceId } = await setupBookablePlumber();

    const { data: booking } = await customerA.client
      .from("bookings")
      .insert({ ...bookingPayload(professional.id, professionalServiceId, "13:00"), customer_id: customerA.id })
      .select("id")
      .single();

    const { data } = await customerB.client.from("bookings").select("*").eq("id", booking!.id);
    expect(data).toEqual([]);
  });
});

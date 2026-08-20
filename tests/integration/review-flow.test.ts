import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { hasSupabaseTestEnv, createTestUser, deleteTestUser, adminClient } from "@/tests/setup/test-client";

describe.skipIf(!hasSupabaseTestEnv())("review flow", () => {
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

  async function makeBooking(status: string, time: string) {
    const customer = await createTestUser("customer");
    const professional = await createTestUser("professional");
    createdUserIds.push(customer.id, professional.id);
    const admin = adminClient();

    await admin.from("professionals").update({ status: "ACTIVE" }).eq("profile_id", professional.id);
    const { data: ps } = await admin
      .from("professional_services")
      .insert({ professional_id: professional.id, service_id: serviceId, pricing_type: "fixed", price_cents: 8900, active: true })
      .select("id")
      .single();

    const { data: booking } = await admin
      .from("bookings")
      .insert({
        customer_id: customer.id,
        professional_id: professional.id,
        professional_service_id: ps!.id,
        status,
        scheduled_date: "2027-01-15",
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
      })
      .select("id")
      .single();

    return { customer, professional, bookingId: booking!.id };
  }

  it("a customer can review a COMPLETED booking", async () => {
    const { customer, professional, bookingId } = await makeBooking("COMPLETED", "09:00");

    const { error } = await customer.client.from("reviews").insert({
      booking_id: bookingId,
      customer_id: customer.id,
      professional_id: professional.id,
      rating: 5,
      comment: "Très professionnel.",
    });

    expect(error).toBeNull();
  });

  it("a customer cannot review a booking that is not COMPLETED", async () => {
    const { customer, professional, bookingId } = await makeBooking("CONFIRMED", "09:30");

    const { error } = await customer.client.from("reviews").insert({
      booking_id: bookingId,
      customer_id: customer.id,
      professional_id: professional.id,
      rating: 5,
    });

    expect(error).not.toBeNull();
  });

  it("only one review per booking is allowed", async () => {
    const { customer, professional, bookingId } = await makeBooking("COMPLETED", "10:00");

    const { error: firstError } = await customer.client.from("reviews").insert({
      booking_id: bookingId,
      customer_id: customer.id,
      professional_id: professional.id,
      rating: 4,
    });
    expect(firstError).toBeNull();

    const { error: secondError } = await customer.client.from("reviews").insert({
      booking_id: bookingId,
      customer_id: customer.id,
      professional_id: professional.id,
      rating: 2,
    });
    expect(secondError).not.toBeNull();
    expect(secondError?.code).toBe("23505");
  });

  it("submitting a review recalculates the professional's rating_avg/rating_count", async () => {
    const { customer, professional, bookingId } = await makeBooking("COMPLETED", "10:30");

    await customer.client.from("reviews").insert({
      booking_id: bookingId,
      customer_id: customer.id,
      professional_id: professional.id,
      rating: 4,
    });

    const admin = adminClient();
    const { data } = await admin
      .from("professionals")
      .select("rating_avg, rating_count")
      .eq("profile_id", professional.id)
      .single();

    expect(data?.rating_count).toBe(1);
    expect(Number(data?.rating_avg)).toBe(4.0);
  });
});

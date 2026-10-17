import { beforeEach, describe, expect, it, vi } from "vitest";
const id = "00000000-0000-4000-8000-000000000010";
const mocks = vi.hoisted(() => ({
  filters: [] as [string, unknown][],
  from: vi.fn(),
  error: false,
  data: null as null | Record<string, unknown>,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      mocks.from(table);
      const q = {
        select: () => q,
        eq: (key: string, value: unknown) => {
          mocks.filters.push([key, value]);
          return q;
        },
        maybeSingle: async () => ({
          data: mocks.filters.some(
            ([key, value]) => key === "professional_id" && value !== "owner",
          )
            ? null
            : mocks.data,
          error: mocks.error ? {} : null,
        }),
      };
      return q;
    },
  }),
}));
import { getBookingBillingPrefill } from "./booking-prefill";
describe("private booking document prefill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.filters = [];
    mocks.error = false;
    mocks.data = {
      id,
      booking_number: "LM2-001",
      contact_first_name: "Camille",
      contact_last_name: "Martin",
      contact_phone: "0612345678",
      contact_email: "camille@example.invalid",
      address_line: "15 rue de la Paix",
      postcode: "75002",
      city: "Paris",
      scheduled_date: "2030-12-12",
      description: "Fuite sous évier",
      professional_services: {
        duration_minutes: 90,
        services: { name: "Réparation de fuite" },
      },
    };
  });
  it("loads the booking with both booking and owner predicates and maps the client fields", async () => {
    const result = await getBookingBillingPrefill(id, "owner");
    expect(mocks.filters).toEqual([
      ["id", id],
      ["professional_id", "owner"],
    ]);
    expect(result).toMatchObject({
      bookingId: id,
      bookingNumber: "LM2-001",
      clientName: "Camille Martin",
      clientAddress: "15 rue de la Paix, 75002 Paris",
      clientPhone: "0612345678",
      clientEmail: "camille@example.invalid",
      serviceOn: "2030-12-12",
      description: "Réparation de fuite — Fuite sous évier",
      duration: "90 min",
    });
    expect(result).not.toHaveProperty("priceCents");
  });
  it("returns no customer information for a foreign, missing or invalid booking", async () => {
    expect(await getBookingBillingPrefill(id, "different-owner")).toBeNull();
    mocks.from.mockClear();
    expect(
      await getBookingBillingPrefill("not-a-booking-id", "owner"),
    ).toBeNull();
    expect(mocks.from).not.toHaveBeenCalled();
    mocks.filters = [];
    mocks.data = null;
    expect(await getBookingBillingPrefill(id, "owner")).toBeNull();
  });
  it("fails closed on database errors", async () => {
    mocks.error = true;
    expect(await getBookingBillingPrefill(id, "owner")).toBeNull();
  });
  it("handles array relations, limits long descriptions and avoids duplicated address components", async () => {
    mocks.data!.professional_services = [
      { duration_minutes: null, services: [{ name: "Intervention" }] },
    ];
    mocks.data!.description = "Détail ".repeat(150);
    mocks.data!.address_line = "15 rue de la Paix, 75002 Paris";
    const value = await getBookingBillingPrefill(id, "owner");
    expect(value?.clientAddress).toBe("15 rue de la Paix, 75002 Paris");
    expect(value?.duration).toBe("");
    expect(value?.description.length).toBe(500);
  });
});

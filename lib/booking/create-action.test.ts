import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: null as { id: string } | null,
  role: "customer",
  suspended: false,
  pricing: "quote",
  insertError: null as { code: string } | null,
  insert: vi.fn(), upload: vi.fn(), remove: vi.fn(), deleteUser: vi.fn(), guest: vi.fn(), notify: vi.fn(), rate: vi.fn(), slots: vi.fn(), cookie: vi.fn(),
}));
const guestId = "00000000-0000-4000-8000-000000000001";
const serviceId = "00000000-0000-4000-8000-000000000002";
const proId = "00000000-0000-4000-8000-000000000003";
const bookingId = "00000000-0000-4000-8000-000000000004";
const booking = { id: bookingId, booking_number: "PB-123", customer_id: guestId, professional_id: proId };

vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: mocks.cookie }) }));
vi.mock("@/lib/security/get-client-ip", () => ({ getClientIp: async () => "192.0.2.1" }));
vi.mock("@/lib/security/rate-limit", () => ({ checkRateLimit: mocks.rate }));
vi.mock("@/lib/booking/guest-customer", () => ({ createGuestCustomer: mocks.guest }));
vi.mock("@/lib/booking/availability", () => ({ getAvailableSlots: mocks.slots }));
vi.mock("@/lib/notifications/booking-notifications", () => ({ notifyBookingCreated: mocks.notify }));
vi.mock("@/lib/supabase/server", () => {
  function from(table: string) {
    const query = {
      select: () => query, eq: () => query,
      insert: (values: unknown) => { mocks.insert(values); return query; },
      single: async () => {
        if (table === "profiles") return { data: { role: mocks.role } };
        if (table === "customers") return { data: { suspended_at: mocks.suspended ? "2026-01-01" : null } };
        if (table === "professional_services") return { data: { id: serviceId, professional_id: proId, pricing_type: mocks.pricing, price_cents: 9000, duration_minutes: 60, services: [{ name: "Fuite" }] } };
        if (table === "public_professional_profiles") return { data: { profile_id: proId } };
        if (table === "bookings") return { data: mocks.insertError ? null : booking, error: mocks.insertError };
        throw new Error(`Unexpected table ${table}`);
      },
    };
    return query;
  }
  const client = { from, storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove }) }, auth: { getUser: async () => ({ data: { user: mocks.user } }), admin: { deleteUser: mocks.deleteUser } } };
  return { createClient: async () => client, createAdminClient: () => client };
});

import { createBookingAction } from "./create-action";
import { verifyReceiptToken } from "./receipt-token";
const oldSecret = process.env.SUPABASE_SERVICE_ROLE_KEY;
afterAll(() => { if (oldSecret === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = oldSecret; });

function form(mode = "guest") {
  const data = new FormData();
  for (const [key, value] of Object.entries({ bookingMode: mode, professionalServiceId: serviceId, date: "2030-12-12", time: "09:00", fullName: "Jean Dupont", phone: "06 12 34 56 78", email: "guest@example.com", address: "15 rue de Paris, 75015 Paris", description: "Fuite sous évier" })) data.set(key, value);
  return data;
}

describe("account and guest booking submission", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.user = null; mocks.role = "customer"; mocks.suspended = false; mocks.pricing = "quote"; mocks.insertError = null;
    mocks.guest.mockResolvedValue(guestId); mocks.rate.mockResolvedValue(true); mocks.upload.mockResolvedValue({ error: null }); mocks.slots.mockResolvedValue(["09:00"]);
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-secret";
  });
  it("creates a guest booking, preserves entered details, and issues only a private receipt", async () => {
    await expect(createBookingAction(undefined, form())).rejects.toThrow("redirect:/reservation-confirmee/PB-123");
    expect(mocks.guest).toHaveBeenCalledWith(expect.anything(), "Jean", "Dupont", "0612345678");
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ customer_id: guestId, contact_email: "guest@example.com", contact_phone: "0612345678", description: "Fuite sous évier", address_line: "15 rue de Paris", price_cents: null }));
    const [name, token, options] = mocks.cookie.mock.calls[0];
    expect(name).toBe("plan-b-receipt-PB-123");
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/reservation-confirmee/PB-123" });
    expect(verifyReceiptToken(token, "PB-123", "test-only-secret")?.bookingId).toBe(bookingId);
    expect(mocks.notify).toHaveBeenCalledWith(booking, "Fuite", expect.objectContaining({ isGuest: true, customerBookingUrl: expect.stringContaining("?receipt=") }));
    expect(mocks.rate).toHaveBeenCalledWith("booking:ip:192.0.2.1", 5, 3600, false);
  });
  it("requires an explicit guest choice for logged-out submissions", async () => {
    expect(await createBookingAction(undefined, form("account"))).toHaveProperty("error");
    expect(mocks.guest).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("keeps signed-in bookings on the existing customer identity", async () => {
    mocks.user = { id: "signed-in-client" };
    await expect(createBookingAction(undefined, form("account"))).rejects.toThrow("redirect:");
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ customer_id: "signed-in-client" }));
    expect(mocks.guest).not.toHaveBeenCalled();
    expect(mocks.cookie).not.toHaveBeenCalled();
  });
  it("blocks spam, invalid dates, suspended customers and non-customer accounts before creating records", async () => {
    const honey = form(); honey.set("website", "spam");
    expect(await createBookingAction(undefined, honey)).toHaveProperty("error");
    const past = form(); past.set("date", "2000-01-01");
    expect(await createBookingAction(undefined, past)).toHaveProperty("error");
    mocks.rate.mockResolvedValue(false);
    expect(await createBookingAction(undefined, form())).toHaveProperty("error");
    mocks.rate.mockResolvedValue(true); mocks.user = { id: "client" }; mocks.suspended = true;
    expect(await createBookingAction(undefined, form())).toHaveProperty("error");
    mocks.suspended = false; mocks.role = "professional";
    expect(await createBookingAction(undefined, form())).toHaveProperty("error");
    expect(mocks.insert).not.toHaveBeenCalled(); expect(mocks.guest).not.toHaveBeenCalled();
  });
  it("rechecks fixed-price availability before creating a guest identity", async () => {
    mocks.pricing = "fixed"; mocks.slots.mockResolvedValue([]);
    expect(await createBookingAction(undefined, form())).toHaveProperty("error");
    expect(mocks.guest).not.toHaveBeenCalled(); expect(mocks.notify).not.toHaveBeenCalled();
  });
  it("removes uploaded attachments and the unused guest record when insertion fails", async () => {
    mocks.insertError = { code: "23505" };
    const data = form(); data.append("photos", new File(["fixture"], "photo.jpg", { type: "image/jpeg" }));
    expect(await createBookingAction(undefined, data)).toHaveProperty("error");
    expect(mocks.remove).toHaveBeenCalledWith([expect.stringContaining(guestId)]);
    expect(mocks.deleteUser).toHaveBeenCalledWith(guestId);
    expect(mocks.cookie).not.toHaveBeenCalled(); expect(mocks.notify).not.toHaveBeenCalled();
  });
});

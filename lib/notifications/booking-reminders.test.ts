import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ email: vi.fn(), mark: vi.fn(), sms: vi.fn(), notice: vi.fn(), contact: vi.fn(), rows: [] as Record<string, unknown>[], notices: new Set<string>() }));
vi.mock("@/lib/email/send", () => ({ sendEmail: mocks.email }));
vi.mock("@/lib/sms/send", () => ({ sendSms: mocks.sms, toE164France: (phone: string) => phone }));
vi.mock("@/lib/notifications/create", () => ({ createNotification: mocks.notice }));
vi.mock("@/lib/notifications/get-professional-contact", () => ({ getProfessionalContact: mocks.contact }));
vi.mock("@/lib/professional/provision-default-hours", () => ({ provisionDefaultHours: async () => {} }));
vi.mock("@/lib/professional/provision-plumbing-services", () => ({ provisionPlumbingServices: async () => {} }));
vi.mock("@/lib/booking/customer-link", () => ({ customerBookingLink: async () => "https://example.invalid/private-receipt" }));
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: () => ({ from: (table: string) => {
  if (table === "bookings") return { select: () => ({ eq: () => ({ in: () => ({ is: async () => ({ data: mocks.rows, error: null }) }) }) }), update: (values: unknown) => ({ eq: async (_key: string, id: string) => { mocks.mark(values, id); return { error: null }; } }) };
  const filters: Record<string, string> = {};
  const query = { select: () => query, eq: (key: string, value: string) => { filters[key] = value; return query; }, limit: async () => ({ data: mocks.notices.has(filters.user_id + "/" + filters.related_booking_id) ? [{ id: "notice" }] : [], error: null }) };
  return query;
} }) }));
import { GET } from "@/app/api/cron/booking-reminders/route";
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv("CRON_SECRET", "controlled-cron-secret"); mocks.notices.clear();
  mocks.rows = [{ id: "booking-1", booking_number: "TEST-REMINDER", customer_id: "client", professional_id: "artisan", scheduled_date: "2030-12-12", scheduled_time: "10:00:00", booking_period: "morning", contact_email: "client@example.invalid", contact_phone: "0612345678", address_line: "15 rue de la Paix", postcode: "75002", city: "Paris", professional_services: { services: { name: "Intervention" } } }];
  mocks.email.mockResolvedValue({ status: "accepted", providerId: "controlled-provider-id" }); mocks.contact.mockResolvedValue({ email: "artisan@example.invalid" });
  mocks.notice.mockImplementation(async ({ userId, relatedBookingId }: { userId: string; relatedBookingId: string }) => { mocks.notices.add(userId + "/" + relatedBookingId); });
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
const request = () => new Request("https://example.invalid/api/cron/booking-reminders", { headers: { authorization: "Bearer controlled-cron-secret" } });
describe("truthful reminder email outcomes", () => {
  it("preserves both recipients and marks only provider-accepted reminders", async () => {
    const response = await GET(request()); const body = await response.json();
    expect(body).toMatchObject({ ok: true, remindersAccepted: 1, emailRequestsAccepted: 2, emailRequestsFailed: 0 });
    expect(body).not.toHaveProperty("remindersSent"); expect(mocks.mark).toHaveBeenCalledOnce();
    expect(mocks.email.mock.calls.map(c => c[0])).toEqual(["client@example.invalid", "artisan@example.invalid"]);
    expect(mocks.email.mock.calls[0][3].idempotencyKey).toContain("/customer");
    expect(mocks.email.mock.calls[1][3].idempotencyKey).toContain("/professional");
  });
  it("does not mark rejected reminders as sent and retries without duplicating in-app notices/SMS", async () => {
    mocks.email.mockResolvedValueOnce({ status: "accepted", providerId: "email-1" }).mockResolvedValueOnce({ status: "failed", reason: "provider_rejected" });
    const first = await GET(request()); expect(first.status).toBe(502); expect(await first.json()).toMatchObject({ ok: false, remindersAccepted: 0, remindersFailed: 1, emailRequestsFailed: 1 });
    expect(mocks.mark).not.toHaveBeenCalled(); const key = mocks.email.mock.calls[0][3].idempotencyKey;
    await GET(request()); expect(mocks.email.mock.calls[2][3].idempotencyKey).toBe(key);
    expect(mocks.notice).toHaveBeenCalledTimes(2); expect(mocks.sms).toHaveBeenCalledOnce(); expect(mocks.mark).toHaveBeenCalledOnce();
  });
  it("reports a missing artisan contact instead of claiming all reminders succeeded", async () => {
    mocks.contact.mockResolvedValue({ email: null });
    const response = await GET(request()); expect(response.status).toBe(502); expect(mocks.mark).not.toHaveBeenCalled();
  });
  it("rejects unauthenticated cron requests before reading or sending", async () => {
    expect((await GET(new Request("https://example.invalid/api/cron/booking-reminders"))).status).toBe(401);
    expect(mocks.email).not.toHaveBeenCalled(); expect(mocks.mark).not.toHaveBeenCalled();
  });
});

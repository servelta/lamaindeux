import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ guard: vi.fn(), create: vi.fn(), getUser: vi.fn() }));
vi.mock("@/lib/admin/queries", () => ({ requireAdmin: mocks.guard }));
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: mocks.create }));
import { getAdminAccountDetails } from "./account-details";

const id = "00000000-0000-4000-8000-000000000001";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.guard.mockResolvedValue("admin");
  mocks.create.mockReturnValue({ auth: { admin: { getUserById: mocks.getUser } } });
  mocks.getUser.mockResolvedValue({ data: { user: {
    email: "artisan@example.invalid", created_at: "2026-10-17T12:00:00Z",
    last_sign_in_at: "2026-10-17T13:00:00Z", email_confirmed_at: "2026-10-17T12:00:00Z",
    app_metadata: { professional_contact_email: "contact@example.invalid", secret: "never-return" },
    user_metadata: { password: "never-return" }, identities: [{ secret: "never-return" }],
  } }, error: null });
});

describe("admin account details", () => {
  it.each(["anonymous", "customer", "professional"])("rejects %s before creating a privileged client", async () => {
    mocks.guard.mockRejectedValue(new Error("redirect"));
    await expect(getAdminAccountDetails(id)).rejects.toThrow("redirect");
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it("returns only display fields after authorization", async () => {
    const result = await getAdminAccountDetails(id);
    expect(result).toEqual({ email: "artisan@example.invalid", contactEmail: "contact@example.invalid", createdAt: "2026-10-17T12:00:00Z", lastSignInAt: "2026-10-17T13:00:00Z", emailConfirmed: true, isGuest: false });
    expect(mocks.guard.mock.invocationCallOrder[0]).toBeLessThan(mocks.create.mock.invocationCallOrder[0]);
    expect(JSON.stringify(result)).not.toContain("never-return");
    expect(mocks.getUser).toHaveBeenCalledWith(id);
  });
  it("does not present a technical guest identity as a login email", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { email: "guest@example.invalid", created_at: "2026-10-17", app_metadata: { booking_guest: true } } }, error: null });
    expect(await getAdminAccountDetails(id)).toMatchObject({ email: null, lastSignInAt: null, isGuest: true, emailConfirmed: false });
  });
  it("handles deleted users and auth service errors without exposing raw responses", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: "private details" } });
    expect(await getAdminAccountDetails(id)).toBeNull();
  });
  it("does not send malformed identifiers to the privileged API", async () => {
    expect(await getAdminAccountDetails("invalid")).toBeNull();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});

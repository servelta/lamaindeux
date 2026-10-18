import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  admin: vi.fn(), owner: vi.fn(), from: vi.fn(), update: vi.fn(), insert: vi.fn(), upload: vi.fn(), remove: vi.fn(), filters: [] as unknown[][],
  record: null as Record<string, unknown> | null, error: null as unknown, authRead: vi.fn(), authUpdate: vi.fn(), privileged: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/admin/queries", () => ({ requireAdmin: mocks.admin }));
vi.mock("@/lib/professional/queries", () => ({ requireUserId: mocks.owner, getOwnProfessional: vi.fn() }));
vi.mock("@/lib/booking/day-availability", () => ({ getDayPeriods: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: mocks.from, storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove, getPublicUrl: (path: string) => ({ data: { publicUrl: `https://fixture.supabase.co/${path}` } }) }) } }),
  createAdminClient: mocks.privileged,
}));
import { requireProfessionalEditor } from "./artisan-edit-context";
import { saveArtisanEmailAction, saveArtisanIdentityAction, saveArtisanImageAction, saveArtisanProfileAction, adminToggleService } from "./artisan-edit-actions";
const id = "00000000-0000-4000-8000-000000000001";
const form = (data: Record<string, string>) => { const f = new FormData(); for (const [k,v] of Object.entries(data)) f.set(k,v); return f; };
describe("admin artisan editing authorization and writes", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.filters = []; mocks.record = { profile_id: id, id, slug: "artisan-test" }; mocks.error = null;
    mocks.admin.mockResolvedValue("admin"); mocks.owner.mockResolvedValue("self");
    mocks.from.mockImplementation(() => { const q = {
      select: () => q, eq: (...args: unknown[]) => { mocks.filters.push(args); return q; },
      update: (data: unknown) => { mocks.update(data); return q; }, insert: (data: unknown) => { mocks.insert(data); return q; },
      single: async () => ({ data: mocks.record, error: mocks.error }),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: mocks.record, error: mocks.error }).then(resolve),
    }; return q; });
    mocks.authRead.mockResolvedValue({ data: { user: { app_metadata: { provider: "email", retained_flag: true } } } });
    mocks.authUpdate.mockResolvedValue({ error: null }); mocks.upload.mockResolvedValue({ error: null });
    mocks.privileged.mockReturnValue({ auth: { admin: { getUserById: mocks.authRead, updateUserById: mocks.authUpdate } } });
  });
  it("keeps the artisan self-editing path without requiring admin", async () => {
    expect(await requireProfessionalEditor()).toBe("self"); expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("requires a fresh admin check before accessing a supplied artisan", async () => {
    mocks.admin.mockRejectedValue(new Error("Denied"));
    await expect(requireProfessionalEditor(id)).rejects.toThrow("Denied");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("rejects malformed and nonexistent targets", async () => {
    await expect(requireProfessionalEditor("bad-id")).rejects.toThrow("invalide");
    mocks.record = null;
    await expect(requireProfessionalEditor(id)).rejects.toThrow("introuvable");
  });
  it.each(["contact", "login"] as const)("prevents non-admin %s email updates before privileged access", async kind => {
    mocks.admin.mockRejectedValue(new Error("Denied"));
    await expect(saveArtisanEmailAction(id, kind, undefined, form({ email: "controlled@example.invalid" }))).rejects.toThrow("Denied");
    expect(mocks.privileged).not.toHaveBeenCalled();
  });
  it("stores private contact email only in app metadata and preserves other claims", async () => {
    expect(await saveArtisanEmailAction(id, "contact", undefined, form({ email: "controlled@example.invalid" }))).toHaveProperty("success");
    expect(mocks.authUpdate).toHaveBeenCalledWith(id, { app_metadata: { provider: "email", retained_flag: true, professional_contact_email: "controlled@example.invalid" } });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("does not treat a missing admin action target as the artisan self-editing path", async () => {
    await expect(saveArtisanEmailAction(undefined as unknown as string, "contact", undefined, form({ email: "controlled@example.invalid" }))).rejects.toThrow("invalide");
    expect(mocks.privileged).not.toHaveBeenCalled(); expect(mocks.owner).not.toHaveBeenCalled();
  });
  it("reports auth provider errors instead of claiming an email was saved", async () => {
    mocks.authUpdate.mockResolvedValue({ error: { message: "provider failure" } });
    expect(await saveArtisanEmailAction(id, "login", undefined, form({ email: "controlled@example.invalid" }))).toHaveProperty("error");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("does not forward role or account id fields from the identity form", async () => {
    expect(await saveArtisanIdentityAction(id, undefined, form({ firstName: "Camille", lastName: "Test", phone: "+33600000000", role: "admin", id: "foreign" }))).toHaveProperty("success");
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith({ first_name: "Camille", last_name: "Test", phone: "+33600000000" });
    expect(mocks.filters).toContainEqual(["id", id]);
  });
  it("does not log a successful identity update when RLS returns no row", async () => {
    mocks.from.mockImplementationOnce(() => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { profile_id: id } }) }) }) }));
    mocks.record = null;
    expect(await saveArtisanIdentityAction(id, undefined, form({ firstName: "Camille", lastName: "Test", phone: "" }))).toHaveProperty("error");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("rejects SVG even if the browser reports an image MIME type", async () => {
    const f = new FormData(); f.set("image", new File(["<svg></svg>"], "logo.png", { type: "image/png" }));
    expect(await saveArtisanImageAction(id, "avatar", undefined, f)).toHaveProperty("error"); expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("rejects oversized images before upload", async () => {
    const f = new FormData(); f.set("image", new File([new Uint8Array(2 * 1024 * 1024 + 1)], "logo.png", { type: "image/png" }));
    expect(await saveArtisanImageAction(id, "avatar", undefined, f)).toHaveProperty("error"); expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("rejects invalid public profile fields before writing", async () => {
    expect(await saveArtisanProfileAction(id, undefined, form({ companyName: "", businessPostcode: "bad" }))).toHaveProperty("error");
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("blocks a forged target in service actions as well as profile actions", async () => {
    mocks.admin.mockRejectedValue(new Error("Denied"));
    await expect(adminToggleService(id, "00000000-0000-4000-8000-000000000005", true)).rejects.toThrow("Denied"); expect(mocks.update).not.toHaveBeenCalled();
  });
});

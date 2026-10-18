import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), profile: {} as Record<string, unknown>, professional: {} as Record<string, unknown> }));
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: () => ({
  auth: { admin: { getUserById: mocks.auth } },
  from: (table: string) => ({ select: () => ({ eq: () => ({ single: async () => ({ data: table === "profiles" ? mocks.profile : mocks.professional }) }) }) }),
}) }));
import { getProfessionalContact } from "./get-professional-contact";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ data: { user: { email: "account@example.invalid", app_metadata: { professional_contact_email: "contact@example.invalid" } } } });
  mocks.profile = { first_name: "Jean", phone: "+33612345678" };
  mocks.professional = { company_name: "Artisan", public_phone: "+442079460958" };
});
describe("artisan notification contacts", () => {
  it("uses the saved private contact email and updated professional phone", async () => {
    expect(await getProfessionalContact("artisan-id")).toEqual({ email: "contact@example.invalid", phone: "+442079460958", firstName: "Jean", companyName: "Artisan" });
    expect(mocks.auth).toHaveBeenCalledWith("artisan-id");
  });
  it("falls back to account email and registration phone", async () => {
    mocks.auth.mockResolvedValue({ data: { user: { email: "account@example.invalid", app_metadata: {} } } });
    mocks.professional.public_phone = " ";
    expect(await getProfessionalContact("artisan-id")).toMatchObject({ email: "account@example.invalid", phone: "+33612345678" });
  });
  it("does not send to malformed metadata or user-editable authorization metadata", async () => {
    mocks.auth.mockResolvedValue({ data: { user: { email: "account@example.invalid", app_metadata: { professional_contact_email: "invalid" }, user_metadata: { professional_contact_email: "other@example.invalid" } } } });
    expect((await getProfessionalContact("artisan-id")).email).toBe("account@example.invalid");
  });
});

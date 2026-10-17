import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  professional: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  filters: [] as [string, unknown][],
  catalog: true,
  existing: null as { id: string; active: boolean } | null,
  readError: false,
  writeError: false,
  foreign: false,
}));
vi.mock("@/lib/professional/queries", () => ({
  requireUserId: async () => "owner",
  getOwnProfessional: mocks.professional,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      let updating = false;
      const q = {
        select: () => q,
        eq: (key: string, value: unknown) => {
          mocks.filters.push([key, value]);
          return q;
        },
        update: (value: unknown) => {
          updating = true;
          mocks.update(value);
          return q;
        },
        upsert: mocks.upsert,
        maybeSingle: async () =>
          table === "services"
            ? { data: mocks.catalog ? { id: catalogId } : null }
            : updating
              ? {
                  data: mocks.foreign ? null : { id: assignmentId },
                  error: mocks.writeError ? {} : null,
                }
              : { data: mocks.existing, error: mocks.readError ? {} : null },
      };
      return q;
    },
  }),
}));
import {
  addProfessionalServiceAction,
  updateProfessionalServiceAction,
  toggleProfessionalServiceAction,
} from "./service-actions";
import { revalidatePath } from "next/cache";
const catalogId = "00000000-0000-4000-8000-000000000025",
  assignmentId = "00000000-0000-4000-8000-000000000005";
function form() {
  const f = new FormData();
  f.set("serviceId", catalogId);
  f.set("pricingType", "fixed");
  f.set("price", "89,95");
  f.set("durationMinutes", "90");
  return f;
}
describe("artisan service controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.filters = [];
    mocks.professional.mockResolvedValue({ trade_id: "plumbing" });
    mocks.upsert.mockResolvedValue({ error: null });
    mocks.catalog = true;
    mocks.existing = null;
    mocks.readError = false;
    mocks.writeError = false;
    mocks.foreign = false;
  });
  it("adds a same-trade service with a euro price, duration and the authenticated owner", async () => {
    expect(await addProfessionalServiceAction(undefined, form())).toEqual({
      success: "Service ajouté.",
    });
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        professional_id: "owner",
        service_id: catalogId,
        price_cents: 8995,
        pricing_type: "fixed",
        duration_minutes: 90,
        active: true,
      }),
      { onConflict: "professional_id,service_id" },
    );
    expect(mocks.filters).toContainEqual(["trade_id", "plumbing"]);
    expect(revalidatePath).toHaveBeenCalledWith("/artisan/[slug]", "page");
  });
  it("clears fixed pricing for a quote and requires a duration", async () => {
    const f = form();
    f.set("pricingType", "quote");
    f.delete("price");
    expect(await addProfessionalServiceAction(undefined, f)).toHaveProperty(
      "success",
    );
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        pricing_type: "quote",
        price_cents: null,
        duration_minutes: 90,
      }),
      expect.anything(),
    );
    f.delete("durationMinutes");
    expect(await addProfessionalServiceAction(undefined, f)).toHaveProperty(
      "error",
    );
  });
  it("rejects invalid prices and durations before writing", async () => {
    for (const [key, value] of [
      ["price", "0"],
      ["price", "-10"],
      ["price", "12.345"],
      ["price", "abc"],
      ["durationMinutes", "0"],
      ["durationMinutes", "601"],
      ["durationMinutes", "NaN"],
    ]) {
      const f = form();
      f.set(key, value);
      expect(await addProfessionalServiceAction(undefined, f)).toHaveProperty(
        "error",
      );
    }
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("rejects inactive or foreign-trade catalog entries and existing active services", async () => {
    mocks.catalog = false;
    expect(
      await addProfessionalServiceAction(undefined, form()),
    ).toHaveProperty("error");
    mocks.catalog = true;
    mocks.existing = { id: assignmentId, active: true };
    expect(
      await addProfessionalServiceAction(undefined, form()),
    ).toHaveProperty("error");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("reuses an inactive assignment through an upsert instead of replacing its booking reference", async () => {
    mocks.existing = { id: assignmentId, active: false };
    expect(
      await addProfessionalServiceAction(undefined, form()),
    ).toHaveProperty("success");
    expect(mocks.upsert.mock.calls[0][0]).not.toHaveProperty("id");
  });
  it("edits only an owned assignment and preserves activation state", async () => {
    expect(
      await updateProfessionalServiceAction(assignmentId, undefined, form()),
    ).toHaveProperty("success");
    expect(mocks.filters).toContainEqual(["professional_id", "owner"]);
    expect(mocks.filters).toContainEqual(["id", assignmentId]);
    expect(mocks.filters).toContainEqual(["service_id", catalogId]);
    expect(mocks.update.mock.calls[0][0]).not.toHaveProperty("active");
  });
  it("deactivates without deleting or altering booked pricing and duration", async () => {
    expect(await toggleProfessionalServiceAction(assignmentId, false)).toEqual({
      success: "Service désactivé.",
    });
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith({ active: false });
    expect(mocks.filters).toContainEqual(["professional_id", "owner"]);
  });
  it("reports foreign assignment and database failures without success or invalidation", async () => {
    mocks.foreign = true;
    expect(
      await toggleProfessionalServiceAction(assignmentId, true),
    ).toHaveProperty("error");
    expect(
      await updateProfessionalServiceAction(assignmentId, undefined, form()),
    ).toHaveProperty("error");
    mocks.upsert.mockResolvedValue({ error: {} });
    expect(
      await addProfessionalServiceAction(undefined, form()),
    ).toHaveProperty("error");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
  it("rejects non-artisan accounts and malformed toggle requests", async () => {
    mocks.professional.mockResolvedValue(null);
    expect(
      await addProfessionalServiceAction(undefined, form()),
    ).toHaveProperty("error");
    expect(
      await toggleProfessionalServiceAction(assignmentId, true),
    ).toHaveProperty("error");
    mocks.professional.mockResolvedValue({ trade_id: "plumbing" });
    expect(
      await toggleProfessionalServiceAction("bad-id", true),
    ).toHaveProperty("error");
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});

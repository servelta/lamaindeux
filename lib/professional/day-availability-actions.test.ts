import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  upsert: vi.fn(),
  professional: vi.fn(),
  owner: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: () => ({ upsert: mocks.upsert }) }),
}));
vi.mock("@/lib/professional/queries", () => ({
  requireUserId: mocks.owner,
  getOwnProfessional: mocks.professional,
}));
vi.mock("@/lib/booking/day-availability", () => ({ getDayPeriods: vi.fn() }));
import { blockDayRangeAction } from "./day-availability-actions";
import { revalidatePath } from "next/cache";

describe("blocking a date range", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-17T08:00:00Z"));
    mocks.owner.mockResolvedValue("signed-in-artisan");
    mocks.professional.mockResolvedValue({ profile_id: "signed-in-artisan" });
    mocks.upsert.mockResolvedValue({ error: null });
  });
  afterEach(() => vi.useRealTimers());

  it("closes all three periods, including both endpoints, in one owner-scoped write", async () => {
    expect(await blockDayRangeAction("2026-10-24", "2026-10-26")).toEqual({
      success: "3 jours bloqués.",
    });
    expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith(
      ["2026-10-24", "2026-10-25", "2026-10-26"].map((date) => ({
        professional_id: "signed-in-artisan",
        date,
        morning: false,
        afternoon: false,
        evening: false,
      })),
      { onConflict: "professional_id,date" },
    );
    expect(revalidatePath).toHaveBeenCalledWith("/calendrier");
    expect(revalidatePath).toHaveBeenCalledWith(
      "/artisan/[slug]/reserver",
      "page",
    );
  });
  it("supports a single day and leap day", async () => {
    expect(await blockDayRangeAction("2026-10-17", "2026-10-17")).toEqual({
      success: "1 jour bloqué.",
    });
    await blockDayRangeAction("2028-02-28", "2028-03-01");
    expect(
      mocks.upsert.mock.calls[1][0].map((row: { date: string }) => row.date),
    ).toEqual(["2028-02-28", "2028-02-29", "2028-03-01"]);
  });
  it("rejects reversed, past, malformed and oversized ranges without writing", async () => {
    for (const [from, to] of [
      ["2026-10-20", "2026-10-19"],
      ["2026-10-16", "2026-10-18"],
      ["2027-02-29", "2027-03-01"],
      ["", "2026-10-20"],
      ["2026-10-17", "2028-10-17"],
    ]) {
      expect(await blockDayRangeAction(from, to)).toHaveProperty("error");
    }
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("rejects non-artisan accounts", async () => {
    mocks.professional.mockResolvedValue(null);
    expect(
      await blockDayRangeAction("2026-10-17", "2026-10-18"),
    ).toHaveProperty("error");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("reports persistence failure without announcing success", async () => {
    mocks.upsert.mockResolvedValue({ error: { message: "write rejected" } });
    expect(
      await blockDayRangeAction("2026-10-17", "2026-10-18"),
    ).toHaveProperty("error");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

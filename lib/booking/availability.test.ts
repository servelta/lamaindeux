import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ admin: vi.fn(), error: false, taken: ["09:00:00"] as string[] }));
vi.mock("@/lib/supabase/server", () => {
  const query = (data: unknown, error: unknown = null) => {
    const chain = { select: () => chain, eq: () => chain, not: () => chain, then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error }).then(resolve) };
    return chain;
  };
  return {
    createClient: async () => ({ from: (table: string) => {
      if (table === "availability_exceptions") return query([]);
      if (table === "availability") return query([{ start_time: "09:00:00", end_time: "11:00:00" }]);
      throw new Error("Public clients must not query booking records for availability.");
    } }),
    createAdminClient: () => ({ from: (table: string) => { mocks.admin(table); return query(mocks.taken.map((scheduled_time) => ({ scheduled_time })), mocks.error ? { code: "db-unavailable" } : null); } }),
  };
});
import { getAvailableSlots } from "./availability";

describe("guest availability", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.taken = ["09:00:00"]; mocks.error = false; });
  afterEach(() => vi.useRealTimers());
  it("excludes booked times even when the visitor cannot read private bookings", async () => {
    expect(await getAvailableSlots("professional", "2030-12-12", 60)).toEqual(["09:30", "10:00"]);
    expect(mocks.admin).toHaveBeenCalledWith("bookings");
  });
  it("checks same-day slots using France's time zone", async () => {
    mocks.taken = [];
    vi.useFakeTimers(); vi.setSystemTime(new Date("2030-12-12T08:15:00Z"));
    expect(await getAvailableSlots("professional", "2030-12-12", 60)).toEqual(["09:30", "10:00"]);
  });
  it("does not advertise apparently free slots when the bookings query fails", async () => {
    mocks.error = true;
    await expect(getAvailableSlots("professional", "2030-12-12", 60)).rejects.toThrow("unavailable");
  });
});

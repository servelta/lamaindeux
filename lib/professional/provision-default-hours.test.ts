import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { defaultWorkingHours, provisionDefaultHours } from "./provision-default-hours";

function fixture(failInsert = false) {
  const state = {
    metadata: { role: "professional" } as Record<string, unknown>,
    slots: [{ weekday: 1, start_time: "08:00", end_time: "12:00" }],
    failInsert,
  };
  const client = {
    auth: { admin: {
      getUserById: async () => ({ data: { user: { app_metadata: state.metadata } }, error: null }),
      updateUserById: async (_id: string, attrs: { app_metadata: Record<string, unknown> }) => {
        state.metadata = attrs.app_metadata; return { error: null };
      },
    } },
    from: (table: string) => {
      let operation = "select";
      const query = {
        select: () => query, order: () => query, range: () => query, eq: () => query,
        delete: () => { operation = "delete"; return query; },
        insert: async (slots: typeof state.slots) => {
          if (state.failInsert) { state.failInsert = false; return { error: { code: "failure" } }; }
          state.slots.push(...slots); return { error: null };
        },
        then: (resolve: (result: unknown) => unknown) => {
          if (operation === "delete") state.slots = [];
          return Promise.resolve(resolve({ data: table === "professionals" ? [{ profile_id: "artisan" }] : [...state.slots], error: null }));
        },
      }; return query;
    },
  } as unknown as SupabaseClient<Database>;
  return { client, state };
}

describe("default working hours", () => {
  it("sets all seven days and preserves private metadata and original hours", async () => {
    const { client, state } = fixture();
    expect(await provisionDefaultHours(client)).toEqual({ initialized: 1, skipped: 0 });
    expect(state.slots.map(({ weekday, start_time, end_time }) => ({ weekday, start_time, end_time }))).toEqual(defaultWorkingHours);
    expect(state.metadata.role).toBe("professional");
    expect(state.metadata.le_plan_b_previous_hours_v1).toEqual([{ weekday: 1, start_time: "08:00", end_time: "12:00" }]);
  });
  it("preserves later account edits, including a completely closed calendar", async () => {
    const { client, state } = fixture();
    await provisionDefaultHours(client);
    state.slots = [{ weekday: 3, start_time: "11:00", end_time: "15:00" }];
    expect(await provisionDefaultHours(client)).toEqual({ initialized: 0, skipped: 1 });
    expect(state.slots[0].start_time).toBe("11:00");
    state.slots = [];
    await provisionDefaultHours(client);
    expect(state.slots).toEqual([]);
  });
  it("restores existing hours after an insert failure and allows a safe retry", async () => {
    const { client, state } = fixture(true);
    await expect(provisionDefaultHours(client)).rejects.toThrow("previous hours restored");
    expect(state.slots).toEqual([{ professional_id: "artisan", weekday: 1, start_time: "08:00", end_time: "12:00" }]);
    expect(state.metadata.le_plan_b_default_hours_v1).toBeUndefined();
    await provisionDefaultHours(client);
    expect(state.slots).toHaveLength(7);
  });
});

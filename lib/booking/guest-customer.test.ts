import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createGuestCustomer } from "./guest-customer";

describe("non-login guest customer record", () => {
  it("uses a synthetic identity and prohibits authentication without linking an existing customer's email", async () => {
    const createUser = vi.fn().mockResolvedValue({ data: { user: { id: "guest-id" } }, error: null });
    const client = { auth: { admin: { createUser } } } as unknown as SupabaseClient<Database>;
    expect(await createGuestCustomer(client, "Jean", "Dupont", "0612345678")).toBe("guest-id");
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ email: expect.stringMatching(/^guest-[0-9a-f-]+@guest\.plan-b\.invalid$/), ban_duration: "876000h", app_metadata: { booking_guest: true }, user_metadata: expect.objectContaining({ role: "customer" }) }));
    expect(createUser.mock.calls[0][0].password.length).toBeGreaterThan(50);
  });
});

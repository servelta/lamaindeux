import { describe, it, expect, afterEach } from "vitest";
import { hasSupabaseTestEnv, createTestUser, deleteTestUser, adminClient } from "@/tests/setup/test-client";

describe.skipIf(!hasSupabaseTestEnv())("registration", () => {
  const createdUserIds: string[] = [];

  afterEach(async () => {
    await Promise.all(createdUserIds.splice(0).map(deleteTestUser));
  });

  it("customer registration creates a profiles row with role=customer and a matching customers row", async () => {
    const { id } = await createTestUser("customer");
    createdUserIds.push(id);

    const admin = adminClient();
    const { data: profile } = await admin.from("profiles").select("role").eq("id", id).single();
    const { data: customer } = await admin.from("customers").select("profile_id").eq("profile_id", id).single();

    expect(profile?.role).toBe("customer");
    expect(customer?.profile_id).toBe(id);
  });

  it("professional registration creates a profiles row with role=professional, status=PENDING, and a matching professionals row", async () => {
    const { id } = await createTestUser("professional");
    createdUserIds.push(id);

    const admin = adminClient();
    const { data: profile } = await admin.from("profiles").select("role").eq("id", id).single();
    const { data: professional } = await admin
      .from("professionals")
      .select("status, company_name")
      .eq("profile_id", id)
      .single();

    expect(profile?.role).toBe("professional");
    expect(professional?.status).toBe("PENDING");
    expect(professional?.company_name).toBe("Test Plomberie");
  });

  it("cannot self-assign the admin role at sign-up — the trigger silently downgrades it to customer", async () => {
    const admin = adminClient();
    const email = `test-admin-attempt-${Date.now()}@example.com`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: "Test-password-123!",
      email_confirm: true,
      user_metadata: { role: "admin", first_name: "Attempted", last_name: "Admin" },
    });
    expect(error).toBeNull();
    if (data.user) createdUserIds.push(data.user.id);

    const { data: profile } = await admin.from("profiles").select("role").eq("id", data.user!.id).single();
    expect(profile?.role).toBe("customer");
  });
});

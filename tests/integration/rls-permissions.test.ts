import { describe, it, expect, afterAll } from "vitest";
import { hasSupabaseTestEnv, createTestUser, deleteTestUser, adminClient } from "@/tests/setup/test-client";

describe.skipIf(!hasSupabaseTestEnv())("role permissions and unauthorized access", () => {
  const createdUserIds: string[] = [];
  afterAll(async () => {
    await Promise.all(createdUserIds.map(deleteTestUser));
  });

  it("a customer cannot read another customer's row directly", async () => {
    const customerA = await createTestUser("customer");
    const customerB = await createTestUser("customer");
    createdUserIds.push(customerA.id, customerB.id);

    // customer A tries to read customer B's row
    const { data, error } = await customerA.client
      .from("customers")
      .select("*")
      .eq("profile_id", customerB.id);

    // RLS should return an empty result, not the other customer's data —
    // and must not error out with a stack-trace-leaking failure either.
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("a professional cannot read a customer's private profile row", async () => {
    const professional = await createTestUser("professional");
    const customer = await createTestUser("customer");
    createdUserIds.push(professional.id, customer.id);

    const { data } = await professional.client.from("customers").select("*").eq("profile_id", customer.id);
    expect(data).toEqual([]);
  });

  it("an unauthenticated (anon, no session) client cannot read professional_documents at all", async () => {
    const professional = await createTestUser("professional");
    createdUserIds.push(professional.id);

    const admin = adminClient();
    await admin.from("professional_documents").insert({
      professional_id: professional.id,
      doc_type: "identity",
      storage_path: `${professional.id}/identity-test.pdf`,
    });

    // A brand-new anon client — never signed in as anyone.
    const { createClient } = await import("@supabase/supabase-js");
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await anon.from("professional_documents").select("*").eq("professional_id", professional.id);
    expect(data).toEqual([]);
  });

  it("a non-admin cannot write to another professional's protected status column", async () => {
    const professionalA = await createTestUser("professional");
    const professionalB = await createTestUser("professional");
    createdUserIds.push(professionalA.id, professionalB.id);

    const { error } = await professionalA.client
      .from("professionals")
      .update({ status: "ACTIVE" })
      .eq("profile_id", professionalB.id);

    // Blocked by RLS (professionalA doesn't own professionalB's row) before the
    // guard trigger even gets a chance to fire — either way, must fail.
    expect(error).not.toBeNull();
  });

  it("a professional cannot set their own status to ACTIVE (guard trigger blocks it even on their own row)", async () => {
    const professional = await createTestUser("professional");
    createdUserIds.push(professional.id);

    const { error } = await professional.client
      .from("professionals")
      .update({ status: "ACTIVE" })
      .eq("profile_id", professional.id);

    expect(error).not.toBeNull();
  });

  it("an admin can read any customer's row", async () => {
    const admin = await createTestUser("admin");
    const customer = await createTestUser("customer");
    createdUserIds.push(admin.id, customer.id);

    const { data, error } = await admin.client.from("customers").select("*").eq("profile_id", customer.id);
    expect(error).toBeNull();
    expect(data).toHaveLength(1);
  });
});

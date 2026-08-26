import { describe, it, expect, afterAll } from "vitest";
import { hasSupabaseTestEnv, createTestUser, deleteTestUser, adminClient } from "@/tests/setup/test-client";

describe.skipIf(!hasSupabaseTestEnv())("admin professional workflow", () => {
  const createdUserIds: string[] = [];
  afterAll(async () => {
    await Promise.all(createdUserIds.map(deleteTestUser));
  });

  it("only an admin session (not a professional's own) can approve a professional", async () => {
    const professional = await createTestUser("professional");
    createdUserIds.push(professional.id);

    // Professional tries to approve themselves
    const { error } = await professional.client
      .from("professionals")
      .update({ status: "APPROVED" })
      .eq("profile_id", professional.id);
    expect(error).not.toBeNull();

    // Admin can
    const admin = await createTestUser("admin");
    createdUserIds.push(admin.id);
    const { error: adminError } = await admin.client
      .from("professionals")
      .update({ status: "APPROVED" })
      .eq("profile_id", professional.id);
    expect(adminError).toBeNull();
  });

  it("a professional never appears in active_professionals until status=ACTIVE, even after approval", async () => {
    const professional = await createTestUser("professional");
    const admin = await createTestUser("admin");
    createdUserIds.push(professional.id, admin.id);

    await admin.client.from("professionals").update({ status: "APPROVED" }).eq("profile_id", professional.id);

    const adminDb = adminClient();
    const { data } = await adminDb.from("active_professionals").select("*").eq("profile_id", professional.id);
    expect(data).toEqual([]);
  });

  it("marking contract signed and payment received does not, by itself, flip status to ACTIVE — activation is a distinct, explicit admin action, not an automatic side effect", async () => {
    const professional = await createTestUser("professional");
    const admin = await createTestUser("admin");
    createdUserIds.push(professional.id, admin.id);

    await admin.client.from("professionals").update({ status: "APPROVED" }).eq("profile_id", professional.id);
    await admin.client
      .from("professionals")
      .update({
        contract_status: "signed",
        contract_signed_at: new Date().toISOString(),
        payment_status: "received",
        payment_date: new Date().toISOString(),
      })
      .eq("profile_id", professional.id);

    const { data } = await admin.client.from("professionals").select("status").eq("profile_id", professional.id).single();

    // Status must still be APPROVED here — activateProfessionalAction (the
    // Server Action, exercised via the running app rather than this
    // integration test since it needs a Next.js request context for
    // cookies()) is what performs the actual APPROVED → ACTIVE
    // transition, gated on exactly these two fields already being set.
    expect(data?.status).toBe("APPROVED");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ professional: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/professional/queries", () => ({
  requireUserId: async () => "owner",
  getOwnProfessional: mocks.professional,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc: mocks.rpc }),
}));
import { allocateBillingNumberAction } from "./number-action";
const requestId = "00000000-0000-4000-8000-000000000010";
const document = {
  kind: "quote",
  number: "IGNORED",
  issuedOn: "2026-10-17",
  serviceOn: "2026-10-17",
  deadline: "2026-11-17",
  issuerName: "Artisan",
  issuerAddress: "15 rue de Paris",
  issuerId: "123456789",
  issuerEmail: "artisan@example.invalid",
  issuerPhone: "0600000000",
  vatNumber: "",
  clientName: "Camille Martin",
  clientAddress: "Paris",
  clientEmail: "client@example.invalid",
  clientType: "individual",
  clientId: "",
  clientVat: "",
  taxMode: "exempt",
  lateTerms: "Conditions",
  notes: "",
  quoteFeeCents: 0,
  lines: [
    {
      description: "Intervention",
      priceCents: 9000,
      vatRate: 0,
      duration: "60 min",
    },
  ],
};
describe("server document numbering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.professional.mockResolvedValue({ status: "ACTIVE" });
    mocks.rpc.mockResolvedValue({
      data: { number: "DEV-2026-0127" },
      error: null,
    });
  });
  it("sends only numbering metadata and a hash to the owner-scoped RPC", async () => {
    expect(await allocateBillingNumberAction(requestId, document)).toEqual({
      number: "DEV-2026-0127",
    });
    expect(mocks.rpc).toHaveBeenCalledWith("allocate_billing_number", {
      p_request_id: requestId,
      p_kind: "quote",
      p_year: 2026,
      p_payload_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain("Camille");
  });
  it("ignores supplied reference text and hashes identical content identically", async () => {
    await allocateBillingNumberAction(requestId, document);
    await allocateBillingNumberAction(requestId, {
      ...document,
      number: "CLIENT-SUPPLIED",
    });
    expect(mocks.rpc.mock.calls[0][1].p_payload_hash).toBe(
      mocks.rpc.mock.calls[1][1].p_payload_hash,
    );
  });
  it("changes the fingerprint when document contents change", async () => {
    await allocateBillingNumberAction(requestId, document);
    await allocateBillingNumberAction(requestId, {
      ...document,
      notes: "Updated",
    });
    expect(mocks.rpc.mock.calls[0][1].p_payload_hash).not.toBe(
      mocks.rpc.mock.calls[1][1].p_payload_hash,
    );
  });
  it("rejects an invalid document, transfer details, date or request before reserving a number", async () => {
    for (const [id, doc] of [
      [requestId, { ...document, clientName: "" }],
      [requestId, { ...document, kind: "invoice", paymentMethod: "transfer" }],
      [requestId, { ...document, issuedOn: "1999-01-01" }],
      ["invalid", document],
    ] as const) {
      expect(await allocateBillingNumberAction(id, doc)).toHaveProperty(
        "error",
      );
    }
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("rejects non-artisans and suspended accounts", async () => {
    for (const professional of [null, { status: "SUSPENDED" }]) {
      mocks.professional.mockResolvedValue(professional);
      expect(
        await allocateBillingNumberAction(requestId, document),
      ).toHaveProperty("error");
    }
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("does not invent a number when the RPC fails or returns invalid data", async () => {
    for (const result of [
      { data: null, error: {} },
      { data: {}, error: null },
    ]) {
      mocks.rpc.mockResolvedValue(result);
      expect(
        await allocateBillingNumberAction(requestId, document),
      ).toHaveProperty("error");
    }
  });
});

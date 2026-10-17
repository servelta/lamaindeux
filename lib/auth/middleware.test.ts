import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
const mocks = vi.hoisted(() => ({ session: vi.fn(), role: "professional" }));
vi.mock("@/lib/supabase/middleware", () => ({ updateSession: mocks.session }));
import { middleware } from "@/middleware";
let response: NextResponse;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.role = "professional";
  response = NextResponse.next();
  mocks.session.mockResolvedValue({
    user: null,
    supabaseResponse: response,
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({ single: async () => ({ data: { role: mocks.role } }) }),
        }),
      }),
    },
  });
});
describe("protected page return context", () => {
  it("preserves the reservation and invoice choice through login", async () => {
    const path =
      "/devis-factures?booking=00000000-0000-4000-8000-000000000050&kind=invoice";
    const result = await middleware(
      new NextRequest("https://lamain2.example" + path),
    );
    const redirect = new URL(result.headers.get("location")!);
    expect(redirect.origin).toBe("https://lamain2.example");
    expect(redirect.pathname).toBe("/connexion");
    expect(redirect.searchParams.get("next")).toBe(path);
  });
  it("keeps query parameters on other protected pages too", async () => {
    const path = "/mes-reservations?statut=terminees";
    const result = await middleware(
      new NextRequest("https://lamain2.example" + path),
    );
    expect(
      new URL(result.headers.get("location")!).searchParams.get("next"),
    ).toBe(path);
  });
  it("leaves public pages unchanged", async () => {
    expect(
      await middleware(
        new NextRequest("https://lamain2.example/recherche?ville=paris"),
      ),
    ).toBe(response);
  });
  it("still rejects authenticated visitors with the wrong role", async () => {
    mocks.role = "customer";
    const session = await mocks.session();
    mocks.session.mockResolvedValue({ ...session, user: { id: "customer" } });
    const result = await middleware(
      new NextRequest("https://lamain2.example/devis-factures?kind=invoice"),
    );
    expect(result.headers.get("location")).toBe("https://lamain2.example/");
  });
  it("leaves authenticated artisan access unchanged", async () => {
    const session = await mocks.session();
    mocks.session.mockResolvedValue({ ...session, user: { id: "artisan" } });
    expect(
      await middleware(
        new NextRequest("https://lamain2.example/devis-factures?kind=quote"),
      ),
    ).toBe(response);
  });
});

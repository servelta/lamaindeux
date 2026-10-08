import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ signUp: vi.fn(), login: vi.fn(), exchange: vi.fn(), email: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("@/lib/security/rate-limit", () => ({ checkRateLimit: async () => true }));
vi.mock("@/lib/security/get-client-ip", () => ({ getClientIp: async () => "192.0.2.1" }));
vi.mock("@/lib/email/send", () => ({ sendEmail: mocks.email }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { signUp: mocks.signUp, signInWithPassword: mocks.login, exchangeCodeForSession: mocks.exchange }, from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { role: "customer" } }) }) }) }) }) }));
import { customerSignUpAction, loginAction } from "./actions";
import { GET } from "@/app/auth/callback/route";
const context = "/artisan/test/reserver?service=00000000-0000-4000-8000-000000000001&date=2030-12-12&time=11%3A00";
function form() { const f = new FormData(); for (const [key,value] of Object.entries({ firstName:"Client", lastName:"Test", email:"client@example.invalid", phone:"", password:"Fixture-password-42", consentTerms:"on", returnTo:context })) f.set(key,value); return f; }
beforeEach(() => { vi.clearAllMocks(); mocks.signUp.mockResolvedValue({ data: { user: { id:"customer" }, session:null }, error:null }); mocks.login.mockResolvedValue({ data: { user: { id:"customer" } }, error:null }); mocks.exchange.mockResolvedValue({ error:null }); });
describe("booking context through customer authentication", () => {
 it("returns a successful login to the selected service, date and time", async () => { await expect(loginAction(undefined,form())).rejects.toThrow(`redirect:${context}`); });
 it("preserves context in the confirmation email and subsequent login", async () => { await expect(customerSignUpAction(undefined,form())).rejects.toThrow(`redirect:/connexion?message=verifiez-votre-email&next=${encodeURIComponent(context)}`); const options=mocks.signUp.mock.calls[0][0].options; expect(new URL(options.emailRedirectTo).searchParams.get("next")).toBe(context); });
 it("goes directly to booking when signup creates a session", async () => { mocks.signUp.mockResolvedValue({ data:{user:{id:"customer"},session:{access_token:"fixture"}},error:null }); await expect(customerSignUpAction(undefined,form())).rejects.toThrow(`redirect:${context}`); });
 it("rejects an external signup return destination", async () => { const f=form();f.set("returnTo","//example.invalid");await expect(customerSignUpAction(undefined,f)).rejects.toThrow("redirect:/connexion?message=verifiez-votre-email");expect(new URL(mocks.signUp.mock.calls[0][0].options.emailRedirectTo).searchParams.get("next")).toBe("/mon-compte"); });
 it("does not redirect or send a welcome email when signup fails", async () => { mocks.signUp.mockResolvedValue({data:{user:null,session:null},error:{message:"failed"}});expect(await customerSignUpAction(undefined,form())).toEqual({error:"Impossible de créer le compte. Veuillez réessayer."});expect(mocks.email).not.toHaveBeenCalled(); });
 it("resumes booking after a successful confirmation callback",async()=>{const r=await GET(new Request(`https://lamain2.example/auth/callback?code=fixture&next=${encodeURIComponent(context)}`));expect(r.headers.get("location")).toBe(`https://lamain2.example${context}`);});
 it("retains context when the confirmation code expires",async()=>{mocks.exchange.mockResolvedValue({error:{message:"expired"}});const r=await GET(new Request(`https://lamain2.example/auth/callback?code=fixture&next=${encodeURIComponent(context)}`));const url=new URL(r.headers.get("location")!);expect(url.pathname).toBe("/connexion");expect(url.searchParams.get("next")).toBe(context);expect(url.searchParams.get("error")).toBeTruthy();});
 it("never follows an external or backslash callback destination",async()=>{for(const next of ["//example.invalid","/\\example.invalid"]){const r=await GET(new Request(`https://lamain2.example/auth/callback?code=fixture&next=${encodeURIComponent(next)}`));expect(r.headers.get("location")).toBe("https://lamain2.example/reinitialiser-mot-de-passe");}});
 it("preserves the password recovery callback default",async()=>{const r=await GET(new Request("https://lamain2.example/auth/callback?code=fixture"));expect(r.headers.get("location")).toBe("https://lamain2.example/reinitialiser-mot-de-passe");});
});

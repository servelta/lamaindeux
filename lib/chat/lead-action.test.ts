import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({send:vi.fn(),rate:vi.fn(),settings:vi.fn()}));
vi.mock("@/lib/email/send",()=>({sendRequiredEmail:mocks.send}));
vi.mock("@/lib/security/rate-limit",()=>({checkRateLimit:mocks.rate}));
vi.mock("@/lib/security/get-client-ip",()=>({getClientIp:async()=>"test-ip"}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({from:()=>({select:()=>({eq:()=>({single:mocks.settings})})})})}));
import { submitChatLeadAction } from "./lead-action";
function form(){const data=new FormData();for(const [key,value] of Object.entries({name:"Claire <script>",email:"claire@example.com",phone:"0612345678",message:"Question <img src=x>",transcript:"Visiteur : ma question",consent:"on"}))data.set(key,value);return data;}
beforeEach(()=>{vi.clearAllMocks();mocks.send.mockResolvedValue(true);mocks.rate.mockResolvedValue(true);mocks.settings.mockResolvedValue({data:{support_email:"support@example.com"}});vi.stubEnv("SUPPORT_EMAIL","");});
describe("chat personal follow-up",()=>{
 it("requires consent before forwarding personal details",async()=>{const data=form();data.delete("consent");expect((await submitChatLeadAction(undefined,data))?.error).toBeTruthy();expect(mocks.send).not.toHaveBeenCalled();});
 it("includes phone and conversation and escapes HTML",async()=>{expect((await submitChatLeadAction(undefined,form()))?.success).toBeTruthy();const [to,,html,replyTo]=mocks.send.mock.calls[0];expect(to).toBe("support@example.com");expect(replyTo).toBe("claire@example.com");expect(html).toContain("0612345678");expect(html).toContain("Visiteur : ma question");expect(html).toContain("&lt;script&gt;");expect(html).not.toContain("<img src=x>");});
 it("does not falsely confirm a failed delivery",async()=>{mocks.send.mockResolvedValue(false);const result=await submitChatLeadAction(undefined,form());expect(result?.success).toBeUndefined();expect(result?.error).toBeTruthy();});
 it("blocks notification floods when the limiter rejects",async()=>{mocks.rate.mockResolvedValue(false);expect((await submitChatLeadAction(undefined,form()))?.error).toBeTruthy();expect(mocks.send).not.toHaveBeenCalled();});
 it("rejects oversized conversations and bot submissions",async()=>{for(const [key,value] of [["transcript","a".repeat(16001)],["website","spam"]]){const data=form();data.set(key,value);expect((await submitChatLeadAction(undefined,data))?.error).toBeTruthy();}expect(mocks.send).not.toHaveBeenCalled();});
});

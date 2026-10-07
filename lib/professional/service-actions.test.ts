import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/professional/queries",()=>({requireUserId:async()=>"professional-id"}));
import { addProfessionalServiceAction, toggleProfessionalServiceAction, deleteProfessionalServiceAction } from "./service-actions";
describe("fixed professional services",()=>{
 it("rejects additions, changes and removals through artisan account actions",async()=>{
  for(const result of [await addProfessionalServiceAction(undefined,new FormData()),await toggleProfessionalServiceAction("service-id",false),await deleteProfessionalServiceAction("service-id")])expect(result?.error).toContain("automatiquement");
 });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({rows:[] as unknown[],admin:vi.fn(),ids:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({
 createClient:async()=>({from:(table:string)=>{const query={select:()=>query,eq:()=>query,order:()=>query,in:async()=>({data:[]}),then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({data:table==="bookings"?mocks.rows:[]}).then(resolve)};return query;}}),
 createAdminClient:()=>{mocks.admin();return {from:(table:string)=>({select:()=>({in:async(key:string,ids:string[])=>{mocks.ids(table,key,ids);return {data:[{id:"booked-service",price_cents:9900,duration_minutes:60,services:{name:"Réparation de fuite"}}]};}})})};},
}));
import { getCustomerBookings } from "./queries";
beforeEach(()=>{vi.clearAllMocks();mocks.rows=[];});
describe("archived booking service details",()=>{
 it("loads only the service referenced by an already authorized booking",async()=>{mocks.rows=[{id:"own-booking",professional_id:"artisan",professional_service_id:"booked-service",professional_services:null}];const rows=await getCustomerBookings("customer");expect(rows[0].professional_services?.services?.name).toBe("Réparation de fuite");expect(mocks.ids).toHaveBeenCalledWith("professional_services","id",["booked-service"]);});
 it("does not perform privileged reads when the caller has no bookings",async()=>{expect(await getCustomerBookings("customer")).toEqual([]);expect(mocks.admin).not.toHaveBeenCalled();});
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { billingSchema, calculateTotals, eurosToCents, parisToday, type BillingDocument } from "./model";
import { generateBillingPdf } from "./pdf";
import { findRouteRule } from "@/lib/auth/roles";
export const sample: BillingDocument = {
  kind:"quote", number:"DEV-2026-001", issuedOn:"2026-10-07", serviceOn:"2026-10-10", deadline:"2026-11-07",
  issuerName:"Électricité Martin",issuerAddress:"12 rue de l’Église, 75001 Paris",issuerId:"12345678900012",issuerEmail:"artisan@example.com",issuerPhone:"0600000000",vatNumber:"FR00123456789",clientName:"Élodie Dupont",clientAddress:"8 rue des Écoles, 75001 Paris",clientEmail:"",clientType:"individual",clientId:"",clientVat:"",taxMode:"vat",paymentMethod:"transfer",lateTerms:"Trois fois le taux d’intérêt légal.",notes:"",quoteFeeCents:0,
  lines:[{description:"Pose et fournitures",priceCents:18518,vatRate:20,duration:"1 h 30"},{description:"Pièces",priceCents:1998,vatRate:5.5,duration:""}],
};
describe("billing amounts and validation",()=>{
  it.each(["Facture 2026 001", "DEV.2026.001", "Devis n° 12 / été", "#FAC-2026-001", "FAC–2026–001"])("accepts common document reference %s",number=>expect(billingSchema.parse({...sample,number}).number).toBe(number));
  it("rejects multiline references with a specific error",()=>{expect(billingSchema.safeParse({...sample,number:"FAC\n001"}).success).toBe(false);});
  it("accepts comma prices and converts them to exact integer cents",()=>{expect(eurosToCents("12,34")).toBe(1234);expect(eurosToCents("0.10")).toBe(10);expect(eurosToCents("120")).toBe(12000);});
  it.each(["-1","1.999","1e3","NaN",""])("rejects invalid price %s",value=>expect(Number.isNaN(eurosToCents(value))).toBe(true));
  it("rounds VAT per line and sums mixed VAT rates",()=>{const totals=calculateTotals(sample);expect(totals.lines[0]).toEqual({net:18518,tax:3704,rate:20,gross:22222});expect(totals.lines[1]).toEqual({net:1998,tax:110,rate:5.5,gross:2108});expect(totals.gross).toBe(24330);});
  it("uses zero tax for a VAT-exempt issuer",()=>{expect(calculateTotals({...sample,taxMode:"exempt"}).tax).toBe(0);});
  it("rejects VAT lines under franchise en base",()=>{expect(billingSchema.safeParse({...sample,taxMode:"exempt"}).success).toBe(false);});
  it("requires identity and VAT number where applicable",()=>{for(const key of ["issuerName","issuerId","vatNumber"]){expect(billingSchema.safeParse({...sample,[key]:""}).success).toBe(false);}});
  it("rejects impossible dates and deadline before document",()=>{expect(billingSchema.safeParse({...sample,issuedOn:"2026-02-30"}).success).toBe(false);expect(billingSchema.safeParse({...sample,deadline:"2026-10-01"}).success).toBe(false);});
  it("requires business client identification",()=>{expect(billingSchema.safeParse({...sample,clientType:"business"}).success).toBe(false);});
  it("rejects fractional, infinite and negative prices",()=>{for(const priceCents of [0.5,-1,Infinity,NaN])expect(billingSchema.safeParse({...sample,lines:[{...sample.lines[0],priceCents}]}).success).toBe(false);});
  it("uses Paris date at a UTC day boundary",()=>{expect(parisToday(new Date("2026-10-06T23:30:00Z"))).toBe("2026-10-07");});
  it("protects the account tab for professionals only",()=>{expect(findRouteRule("/devis-factures")?.roles).toEqual(["professional"]);});
});
it.each(["card", "transfer", "cash", "cheque"])("accepts payment method %s",paymentMethod=>expect(billingSchema.safeParse({...sample,paymentMethod}).success).toBe(true));
it("requires a valid payment choice",()=>expect(billingSchema.safeParse({...sample,paymentMethod:""}).success).toBe(false));
describe("generated PDFs",()=>{
  const font=readFileSync("public/fonts/NotoSans-Regular.ttf");
  it("produces a real French quote PDF with issuer metadata",async()=>{const bytes=await generateBillingPdf(sample,font);expect(Buffer.from(bytes).subarray(0,5).toString()).toBe("%PDF-");const parsed=await PDFDocument.load(bytes);expect(parsed.getTitle()).toBe("Devis DEV-2026-001");expect(parsed.getAuthor()).toBe(sample.issuerName);expect(parsed.getPageCount()).toBeGreaterThan(0);});
  it("paginates fifty long invoice items without losing pages",async()=>{const doc={...sample,kind:"invoice" as const,number:"FAC-2026-001",lines:Array.from({length:50},(_,i)=>({...sample.lines[0],description:`Prestation ${i+1} : `+"Description détaillée des travaux. ".repeat(12)}))};const parsed=await PDFDocument.load(await generateBillingPdf(doc,font));expect(parsed.getPageCount()).toBeGreaterThan(5);expect(parsed.getTitle()).toBe("Facture FAC-2026-001");});
  it("reports unsupported characters instead of silently dropping client text",async()=>{await expect(generateBillingPdf({...sample,clientName:"Client 😀"},font)).rejects.toThrow("caractère");});
});

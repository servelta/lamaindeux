import { z } from "zod";
const text = (max = 200) => z.string().trim().max(max);
const required = (max = 200) => text(max).min(1, "Ce champ est obligatoire.");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.").refine(value => {
  const parsed = new Date(value + "T12:00:00Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Date invalide.");
export const billingSchema = z.object({
  kind: z.enum(["quote", "invoice"]),
  number: required(50).refine(value => !/[\u0000-\u001f\u007f]/.test(value), "La référence du document doit tenir sur une seule ligne.").transform(value => value.normalize("NFC")),
  issuedOn: date, serviceOn: date, deadline: date,
  issuerName: required(), issuerAddress: required(400), issuerId: required(14).regex(/^\d{9}(\d{5})?$/, "SIREN (9 chiffres) ou SIRET (14 chiffres)."),
  issuerEmail: z.string().trim().email("Email professionnel invalide."), issuerPhone: required(40),
  vatNumber: text(40),
  clientName: required(), clientAddress: required(400), clientEmail: z.union([z.literal(""), z.string().trim().email()]),
  clientType: z.enum(["individual", "business"]), clientId: text(14), clientVat: text(40),
  taxMode: z.enum(["vat", "exempt"]), paymentMethod: z.enum(["card", "transfer", "cash", "cheque"]), lateTerms: required(400), notes: text(1500),
  quoteFeeCents: z.number().int().min(0).max(10000000),
  lines: z.array(z.object({ description: required(500), priceCents: z.number().int().min(0).max(100000000), vatRate: z.union([z.literal(0), z.literal(5.5), z.literal(10), z.literal(20)]), duration: text(100) })).min(1).max(50),
}).superRefine((data, ctx) => {
  if (data.deadline < data.issuedOn) ctx.addIssue({ code: "custom", path: ["deadline"], message: "La date limite doit être postérieure ou égale à la date du document." });
  if (data.taxMode === "vat" && !data.vatNumber) ctx.addIssue({ code: "custom", path: ["vatNumber"], message: "Renseignez votre numéro de TVA." });
  if (data.clientType === "business" && !/^\d{9}(\d{5})?$/.test(data.clientId)) ctx.addIssue({ code: "custom", path: ["clientId"], message: "Renseignez le SIREN ou SIRET du client professionnel." });
  if (data.taxMode === "exempt" && data.lines.some(line => line.vatRate !== 0)) ctx.addIssue({ code: "custom", path: ["lines"], message: "Aucune TVA ne peut être facturée sous franchise en base." });
});
export type BillingDocument = z.infer<typeof billingSchema>;
export type BillingIssuer = { name: string; address: string; id: string; email: string; phone: string };
export function eurosToCents(value: string): number {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return NaN;
  const [whole, decimals = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
}
export function calculateTotals(document: Pick<BillingDocument, "lines" | "taxMode">) {
  const lines = document.lines.map(line => {
    const net = line.priceCents;
    const rate = document.taxMode === "exempt" ? 0 : line.vatRate;
    const tax = Math.round(net * rate / 100);
    return { net, tax, rate, gross: net + tax };
  });
  return { lines, net: lines.reduce((sum, line) => sum + line.net, 0), tax: lines.reduce((sum, line) => sum + line.tax, 0), gross: lines.reduce((sum, line) => sum + line.gross, 0) };
}
export function parisToday(now = new Date()) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(now); }

export const PAYMENT_METHODS = { card: "Carte bancaire", transfer: "Virement bancaire", cash: "Espèces", cheque: "Chèque" } as const;

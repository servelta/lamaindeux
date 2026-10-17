import { z } from "zod";

export const statuses = ["PENDING", "CONFIRMED", "ACCEPTED", "COMPLETED", "CANCELLED_BY_CUSTOMER", "CANCELLED_BY_PROFESSIONAL", "NO_SHOW", "DISPUTED"] as const;
export const statusLabels: Record<typeof statuses[number], string> = {
  PENDING: "En attente", CONFIRMED: "Confirmés", ACCEPTED: "Acceptés", COMPLETED: "Terminés", CANCELLED_BY_CUSTOMER: "Annulés par le client", CANCELLED_BY_PROFESSIONAL: "Annulés par l’artisan", NO_SHOW: "Absences", DISPUTED: "Litiges",
};
export const sortKeys = ["name", "trade", "city", "clicks", "appointments", ...statuses] as const;
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => { const d = new Date(s + "T12:00:00Z"); return Number(s.slice(0,4)) >= 1 && !Number.isNaN(+d) && d.toISOString().slice(0, 10) === s; }, "Date invalide");
const empty = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(v => v === "" || v === undefined ? undefined : v, schema.optional());
const schema = z.object({ period: z.enum(["today", "7", "30", "all", "custom"]).default("30"), from: empty(date), to: empty(date), artisan: empty(z.string().uuid()), trade: empty(z.string().uuid()), city: empty(z.string().trim().max(150)), q: z.string().trim().max(100).default(""), sort: z.enum(sortKeys).default("name"), direction: z.enum(["asc", "desc"]).default("asc") });
export function parisDate(now = new Date()) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(now); }
function shiftDate(day: string, by: number) { const d = new Date(day + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + by); return d.toISOString().slice(0, 10); }
export function parseReportFilters(raw: Record<string, string | undefined>, now = new Date()) {
  const f = schema.parse(raw); const today = parisDate(now);
  let from: string | null = null, to: string | null = null;
  if (f.period === "custom") {
    if (!f.from || !f.to || f.from > f.to || (+new Date(f.to) - +new Date(f.from)) / 86400000 > 3660) throw new Error("Choisissez une période valide, de 10 ans maximum.");
    from = f.from; to = f.to;
  } else if (f.period !== "all") { to = today; from = shiftDate(today, f.period === "today" ? 0 : f.period === "7" ? -6 : -29); }
  return { ...f, from, to };
}
export type ReportFilters = ReturnType<typeof parseReportFilters>;
export function filterParams(f: ReportFilters) { const p = new URLSearchParams(); for (const [key, value] of Object.entries(f)) if (value !== null && value !== undefined && value !== "") p.set(key, value); return p; }

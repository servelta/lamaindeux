import { z } from "zod";
import { requireAdmin } from "@/lib/admin/queries";
import { createClient } from "@/lib/supabase/server";
import { parseReportFilters, statuses, statusLabels, type ReportFilters } from "./report-filters";

const counts = z.record(z.number().nonnegative());
const activity = { clicks: z.number().nonnegative(), appointments: z.number().nonnegative(), statuses: counts };
const reportSchema = z.object({
  rows: z.array(z.object({ id: z.string().uuid(), name: z.string(), trade_id: z.string().uuid(), trade: z.string(), city: z.string().nullable(), ...activity })),
  daily: z.array(z.object({ day: z.string(), ...activity })),
  totals: z.object({ artisans: z.number().nonnegative(), ...activity }),
  startedAt: z.string(), artisans: z.array(z.object({ id: z.string(), name: z.string() })), trades: z.array(z.object({ id: z.string(), name: z.string() })), cities: z.array(z.string()),
});
export type PerformanceReport = z.infer<typeof reportSchema>;
export async function getPerformanceReport(raw: Record<string, string | undefined>, daily = false) {
  await requireAdmin();
  const filters = parseReportFilters(raw);
  if (daily && !filters.artisan) throw new Error("Choisissez un artisan.");
  const client = await createClient();
  const { data, error } = await client.rpc("admin_artisan_performance", { p_from: filters.from ?? undefined, p_to: filters.to ?? undefined, p_professional_id: filters.artisan, p_trade_id: filters.trade, p_city: filters.city, p_search: filters.q, p_daily: daily });
  if (error) throw new Error("Impossible de charger la performance des artisans.");
  const report = reportSchema.parse(data);
  const multiplier = filters.direction === "desc" ? -1 : 1;
  report.rows.sort((a, b) => {
    const key = filters.sort;
    const value = key === "name" || key === "trade" || key === "city" ? (a[key] ?? "").localeCompare(b[key] ?? "", "fr") : (key === "clicks" || key === "appointments" ? a[key] - b[key] : (a.statuses[key] ?? 0) - (b.statuses[key] ?? 0));
    return value * multiplier || a.id.localeCompare(b.id);
  });
  return { report, filters };
}
function csvCell(value: string | number) {
  const text = String(value); const safe = /^[\s]*[=+\-@]/.test(text) ? "'" + text : text;
  return '"' + safe.replace(/"/g, '""') + '"';
}
export function performanceCsv(report: PerformanceReport, filters: ReportFilters, daily = false) {
  const head = [daily ? "Date (Europe/Paris)" : "Artisan", ...(daily ? ["Artisan"] : ["Métier", "Ville"]), "Clics sur Appeler", "Rendez-vous réservés", ...statuses.map(s => statusLabels[s]), "Du (Europe/Paris)", "Au (Europe/Paris)", "Suivi des clics depuis (Europe/Paris)"];
  const rows = daily ? report.daily.map(row => [row.day, report.artisans.find(a => a.id === filters.artisan)?.name ?? "", row.clicks, row.appointments, ...statuses.map(s => row.statuses[s] ?? 0)]) : report.rows.map(row => [row.name, row.trade, row.city ?? "", row.clicks, row.appointments, ...statuses.map(s => row.statuses[s] ?? 0)]);
  const total = ["TOTAL", ...(daily ? [""] : ["", ""]), report.totals.clicks, report.totals.appointments, ...statuses.map(s => report.totals.statuses[s] ?? 0)];
  const startedAt = new Date(report.startedAt).toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  return "\uFEFF" + [head, ...[...rows, total].map(row => [...row, filters.from ?? "Toutes dates", filters.to ?? "Toutes dates", startedAt])].map(row => row.map(csvCell).join(";")).join("\r\n") + "\r\n";
}

import { getPerformanceReport, performanceCsv } from "@/lib/analytics/report";
import { parseReportFilters } from "@/lib/analytics/report-filters";
import { requireAdmin } from "@/lib/admin/queries";

export async function GET(request: Request) {
  await requireAdmin();
  const params = new URL(request.url).searchParams;
  const raw = Object.fromEntries(params);
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  try { parseReportFilters(raw); } catch { return new Response("Filtres invalides.", { status: 400, headers }); }
  if (params.get("mode") === "daily" && !raw.artisan) return new Response("Artisan requis.", { status: 400, headers });
  try {
    const daily = params.get("mode") === "daily";
    const { report, filters } = await getPerformanceReport(raw, daily);
    return new Response(performanceCsv(report, filters, daily), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="lamain2-performance${daily ? '-quotidienne' : ''}.csv"` } });
  } catch { return new Response("Export indisponible. Réessayez.", { status: 503, headers }); }
}

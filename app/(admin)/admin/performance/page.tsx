import Link from "next/link";
import { requireAdmin } from "@/lib/admin/queries";
import { getPerformanceReport } from "@/lib/analytics/report";
import { parseReportFilters } from "@/lib/analytics/report-filters";
import { PerformanceView } from "@/components/admin/performance-report";
export const metadata = { title: "Performance des artisans" };
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin(); const raw = await searchParams;
  try { parseReportFilters(raw); } catch { return <div className="p-6"><h1 className="font-display text-2xl">Performance des artisans</h1><p role="alert" className="mt-4">Filtres invalides. Vérifiez les dates (10 ans maximum pour une période personnalisée) et les valeurs sélectionnées.</p><Link href="/admin/performance" className="mt-4 inline-flex min-h-11 items-center text-primary underline">Réinitialiser les filtres</Link></div>; }
  const { report, filters } = await getPerformanceReport(raw);
  return <PerformanceView report={report} filters={filters} />;
}

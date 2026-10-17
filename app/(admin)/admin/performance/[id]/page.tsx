import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/queries";
import { getPerformanceReport } from "@/lib/analytics/report";
import { PerformanceView } from "@/components/admin/performance-report";
export const metadata = { title: "Détail des performances" };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin(); const { id } = await params; if (!z.string().uuid().safeParse(id).success) notFound();
  const { report, filters } = await getPerformanceReport({ ...await searchParams, artisan: id }, true);
  if (!report.artisans.some(a => a.id === id)) notFound();
  return <PerformanceView report={report} filters={filters} daily />;
}

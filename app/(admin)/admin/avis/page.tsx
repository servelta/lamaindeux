import { requireAdmin } from "@/lib/admin/queries";
import { createClient } from "@/lib/supabase/server";
import { ReviewsModerationList } from "@/components/admin/reviews-moderation-list";

export const metadata = { title: "Avis" };

export default async function AdminReviewsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, hidden_by_admin, created_at, professionals(company_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Avis</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Modérez les avis clients. Un avis masqué n'apparaît plus sur le profil public du professionnel.
      </p>

      <div className="mt-6">
        <ReviewsModerationList reviews={(reviews ?? []) as any} />
      </div>
    </div>
  );
}

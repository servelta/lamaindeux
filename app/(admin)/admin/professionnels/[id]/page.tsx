import { AccountDetails } from "@/components/admin/account-details";
import { getAdminAccountDetails } from "@/lib/admin/account-details";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin, getProfessionalDetail } from "@/lib/admin/queries";
import { createClient } from "@/lib/supabase/server";
import { ProfessionalActionsPanel } from "@/components/admin/professional-actions-panel";
import { Badge } from "@/components/ui/badge";
import { BookingStatusBadge } from "@/components/booking/status-badge";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Détail du professionnel" };

const DOC_TYPE_LABELS: Record<string, string> = {
  identity: "Pièce d'identité",
  qualification: "Qualification professionnelle",
  insurance: "Attestation d'assurance",
  other: "Autre document",
};

export default async function AdminProfessionalDetailPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  const { professional, documents, bookings, reviews } = await getProfessionalDetail(id);
  if (!professional) notFound();
  const account = await getAdminAccountDetails(id);

  const profile = Array.isArray(professional.profiles) ? professional.profiles[0] : professional.profiles;

  // Signed URLs for private verification documents (admin-only access per storage RLS).
  const supabase = await createClient();
  const signedDocs = await Promise.all(
    documents.map(async (doc) => {
      const { data } = await supabase.storage.from("professional-documents").createSignedUrl(doc.storage_path, 60 * 15);
      return { ...doc, url: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin/professionnels" className="text-sm text-muted-foreground hover:text-primary">
        ← Professionnels
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{professional.company_name}</h1>
        <Badge variant={professional.status === "ACTIVE" ? "verified" : "outline"}>{professional.status}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {profile?.first_name} {profile?.last_name} · {profile?.phone ?? "—"} · {professional.business_city ?? "—"} {professional.business_postcode ?? ""}
      </p>
      {professional.siret && <p className="mt-1 text-xs font-mono-data text-muted-foreground">SIRET : {professional.siret}</p>}
      <dl className="mt-4 grid gap-3 rounded-xl border border-border p-4 text-sm sm:grid-cols-2">
        <div className="min-w-0"><dt className="text-xs text-muted-foreground">Adresse de l’entreprise</dt><dd className="mt-1 break-words">{[professional.business_address, professional.business_postcode, professional.business_city].filter(Boolean).join(", ") || "—"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Téléphone professionnel</dt><dd className="mt-1">{professional.public_phone || "—"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">SIRET / SIREN</dt><dd className="mt-1">{professional.siret || professional.siren || "—"}</dd></div>
        <div className="min-w-0"><dt className="text-xs text-muted-foreground">Site web</dt><dd className="mt-1 break-words [overflow-wrap:anywhere]">{professional.website || "—"}</dd></div>
      </dl>
      {professional.status_reason && (
        <p className="mt-2 rounded-md bg-secondary p-3 text-sm">Motif : {professional.status_reason}</p>
      )}

      <AccountDetails account={account} accountId={id} name={[profile?.first_name, profile?.last_name].filter(Boolean).join(" ")} phone={profile?.phone ?? null} />

      <div className="mt-6">
        <ProfessionalActionsPanel professional={professional} />
      </div>

      {signedDocs.length > 0 && <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Documents antérieurs</h2>
        <div className="mt-3 space-y-2">
          {signedDocs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm">
              <span>{DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}</span>
              {doc.url ? (
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Voir le document
                </a>
              ) : (
                <span className="text-muted-foreground">Indisponible</span>
              )}
            </div>
          ))}
        </div>
      </section>}

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Réservations récentes</h2>
        <div className="mt-3 space-y-2">
          {bookings.length === 0 && <p className="text-sm text-muted-foreground">Aucune réservation.</p>}
          {bookings.map((b) => {
            const ps = Array.isArray(b.professional_services) ? b.professional_services[0] : b.professional_services;
            const service = ps ? (Array.isArray(ps.services) ? ps.services[0] : ps.services) : null;
            return (
              <div key={b.id} className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm">
                <span className="font-mono-data">{b.booking_number} — {service?.name}</span>
                <BookingStatusBadge status={b.status} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Avis</h2>
        <div className="mt-3 space-y-2">
          {reviews.length === 0 && <p className="text-sm text-muted-foreground">Aucun avis.</p>}
          {reviews.map((r) => (
            <div key={r.id} className="rounded-md border border-border px-4 py-3 text-sm">
              <span className="font-mono-data">{r.rating}/5</span> — {r.comment}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

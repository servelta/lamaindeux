import { requireUserId, getOwnDocuments } from "@/lib/professional/queries";
import { DocumentUploadForm } from "@/components/professional/document-upload-form";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Documents" };

const DOC_TYPE_LABELS: Record<string, string> = {
  identity: "Pièce d'identité",
  qualification: "Qualification professionnelle",
  insurance: "Attestation d'assurance",
  other: "Autre document",
};

export default async function DocumentsPage() {
  const professionalId = await requireUserId();
  const documents = await getOwnDocuments(professionalId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold">Documents</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ces documents sont strictement privés — visibles uniquement par vous
        et par notre équipe de vérification. Ils ne sont jamais publiés sur
        votre profil.
      </p>

      <div className="mt-8">
        <DocumentUploadForm />
      </div>

      <h2 className="mt-10 font-display text-lg font-semibold">Documents envoyés</h2>
      <div className="mt-4 space-y-2">
        {documents.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun document envoyé pour le moment.</p>
        )}
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between rounded-md border border-border px-4 py-3 text-sm">
            <span>{DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}</span>
            <Badge variant={doc.verified_at ? "verified" : "outline"}>
              {doc.verified_at ? "Vérifié" : "En attente de vérification"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

export const metadata = { title: "Politique de confidentialité" };

// TODO (Phase 9): replace with reviewed GDPR-compliant copy, including data
// retention periods, the legal basis for each type of processing, and the
// process for exercising access/deletion rights.
export default function PrivacyPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="font-display text-2xl font-bold">Politique de confidentialité</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Ce texte est un espace réservé, à finaliser avec une revue juridique
        avant le lancement (Phase 9). LaMainDeux collecte uniquement les
        données nécessaires à la mise en relation entre clients et professionnels
        (nom, coordonnées, adresse d'intervention). Les documents de
        vérification des professionnels restent strictement privés et ne sont
        accessibles qu'aux administrateurs autorisés.
      </p>
    </div>
  );
}

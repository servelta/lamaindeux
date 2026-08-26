export const metadata = { title: "Conditions d'utilisation" };

// TODO (Phase 9): replace with reviewed legal copy. This placeholder exists
// only so links from sign-up/footer aren't dead during earlier phases.
export default function TermsPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="font-display text-2xl font-bold">Conditions d'utilisation</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Ce texte est un espace réservé. Les conditions d'utilisation
        définitives seront rédigées avec l'aide d'un professionnel du droit
        avant le lancement public de la plateforme (voir Phase 9 de la feuille
        de route). Elles préciseront notamment : la gratuité du service pour
        les clients, l'absence de commission sur les interventions, et le fait
        que le paiement du service de plomberie se règle directement entre le
        client et le professionnel.
      </p>
    </div>
  );
}

export const metadata = { title: "Politique de cookies" };

// TODO (legal review): confirm this stays accurate as analytics or marketing
// tools are ever added — at that point a consent banner becomes legally
// required (these are currently all strictly-necessary cookies, which are
// exempt from consent under French/EU rules).
export default function CookiesPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="font-display text-2xl font-bold">Politique de cookies</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        LaMainDeux n'utilise, à ce stade, que des cookies strictement
        nécessaires au fonctionnement du site : le cookie de session
        d'authentification (géré par notre prestataire technique Supabase)
        qui vous permet de rester connecté à votre compte. Ces cookies ne
        servent ni à la publicité, ni au suivi, ni à des statistiques, et ne
        nécessitent donc pas de recueil de consentement au titre de la
        réglementation applicable aux cookies strictement nécessaires.
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Si des cookies de mesure d'audience ou publicitaires venaient à être
        ajoutés à l'avenir, cette page sera mise à jour et un bandeau de
        consentement sera mis en place avant leur dépôt.
      </p>
    </div>
  );
}

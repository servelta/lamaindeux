import Link from "next/link";
import { getActiveTrades } from "@/lib/queries/search";

const popularCities = [
  { name: "Paris", slug: "paris" },
  { name: "Lyon", slug: "lyon" },
  { name: "Marseille", slug: "marseille" },
  { name: "Toulouse", slug: "toulouse" },
  { name: "Bordeaux", slug: "bordeaux" },
];

export async function SiteFooter() {
  const trades = await getActiveTrades();
  const primaryTrade = trades[0];

  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="container grid gap-10 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="font-display text-lg font-bold text-primary">LaMainDeux</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Trouvez un artisan vérifié près de chez vous. Réservation
            gratuite, sans commission sur les interventions.
          </p>
        </div>

        {primaryTrade && (
          <div>
            <p className="text-sm font-semibold">Villes</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {popularCities.map((city) => (
                <li key={city.slug}>
                  <Link href={`/${primaryTrade.slug_plural}/${city.slug}`} className="hover:text-primary">
                    {primaryTrade.name_singular} {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold">Artisans</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/inscription/professionnel" className="hover:text-primary">
                Devenir artisan partenaire
              </Link>
            </li>
            <li>
              <Link href="/connexion" className="hover:text-primary">
                Connexion professionnel
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold">Légal</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/conditions-utilisation" className="hover:text-primary">
                Conditions d'utilisation
              </Link>
            </li>
            <li>
              <Link href="/confidentialite" className="hover:text-primary">
                Politique de confidentialité
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="hover:text-primary">
                Politique de cookies
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60 py-6">
        <p className="container text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} LaMainDeux. Le paiement de
          l'intervention se règle directement avec l'artisan.
        </p>
      </div>
    </footer>
  );
}

import Link from "next/link";
import { Mail } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from "@/lib/contact/config";
import { BrandLogo } from "@/components/layout/brand-logo";
import { FooterSocialLinks } from "@/components/layout/footer-social-links";
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
          <BrandLogo imageClassName="h-20 w-auto" />
          <p className="mt-3 text-sm text-muted-foreground">
            Trouvez un artisan vérifié près de chez vous. Réservation
            gratuite, sans commission sur les interventions.
          </p>
          <a href={CONTACT_EMAIL_HREF} className="mt-3 inline-flex min-h-11 max-w-full items-center gap-2 rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Mail aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="break-all">{CONTACT_EMAIL}</span>
          </a>
          <FooterSocialLinks />
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
          © 2026 LaMain2. Tous droits réservés. Le paiement de
          l'intervention se règle directement avec l'artisan.
        </p>
      </div>
    </footer>
  );
}

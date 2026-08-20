import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-lg font-bold tracking-tight text-primary">
          LaMainDeux
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/#recherche" className="hover:text-primary">
            Trouver un artisan
          </Link>
          <Link href="/inscription/professionnel" className="hover:text-primary">
            Devenir artisan
          </Link>
          <Link href="/connexion" className="hover:text-primary">
            Connexion
          </Link>
        </nav>

        <Button asChild size="sm">
          <Link href="/#recherche">Trouver un artisan</Link>
        </Button>
      </div>
    </header>
  );
}

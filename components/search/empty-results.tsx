import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptySearchResults({
  cityName,
  serviceName,
}: {
  cityName: string;
  serviceName?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center">
      <p className="font-medium">
        Nous n'avons pas encore trouvé de professionnel disponible
        {serviceName ? ` pour "${serviceName}"` : ""} à {cityName}.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Essayez une autre ville ou un autre service.
      </p>
      <Button asChild variant="outline" className="mt-4">
        <Link href="/#recherche">Nouvelle recherche</Link>
      </Button>
    </div>
  );
}

import Link from "next/link";
import { Wrench } from "lucide-react";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Wrench className="h-4 w-4" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-primary">
        LaMainDeux
      </span>
    </Link>
  );
}
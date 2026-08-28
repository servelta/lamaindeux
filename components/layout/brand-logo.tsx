import Link from "next/link";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`font-display text-lg font-bold tracking-tight text-primary ${className}`}>
      LaMainDeux
    </Link>
  );
}
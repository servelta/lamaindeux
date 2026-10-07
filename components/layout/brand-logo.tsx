import Link from "next/link";
import Image from "next/image";
export function BrandLogo({ className = "", imageClassName = "h-12 w-auto" }: { className?: string; imageClassName?: string; }) {
  return <Link href="/" className={`inline-flex shrink-0 items-center gap-2 ${className}`} aria-label="Le Plan B — accueil">
    <Image src="/apple-touch-icon.png" alt="" width={56} height={56} priority className={imageClassName} />
    <span className="whitespace-nowrap font-display text-2xl font-bold tracking-tight text-primary sm:text-3xl">Le Plan B</span>
  </Link>;
}

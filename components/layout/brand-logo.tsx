import Link from "next/link";
import Image from "next/image";

export function BrandLogo({ className = "", imageClassName = "h-12 w-auto" }: {
  className?: string;
  imageClassName?: string;
}) {
  const frameHeight = imageClassName.replace(/\bw-auto\b/g, "");
  return (
    <Link href="/" className={`inline-flex shrink-0 items-center ${className}`} aria-label="LaMain2 — accueil">
      <span className={`relative block w-[196px] overflow-hidden sm:w-[224px] ${frameHeight}`}>
        <Image
          src="/images/LaMain2.png"
          alt="LaMain2"
          width={2172}
          height={724}
          priority
          sizes="(min-width: 640px) 224px, 196px"
          className="absolute left-0 top-1/2 h-auto w-full -translate-y-1/2"
        />
      </span>
    </Link>
  );
}

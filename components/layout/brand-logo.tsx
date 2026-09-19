import Link from "next/link";
import Image from "next/image";

// Intrinsic ratio of public/images/logo.png (6250x3085). Passed to
// next/image at display size so it generates a sensible srcset; the
// rendered height is set in CSS below.
const LOGO_W = 162;
const LOGO_H = 80;

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center ${className}`} aria-label="LaMainDeux — accueil">
      <Image
        src="/images/logo.png"
        alt="LaMainDeux"
        width={LOGO_W}
        height={LOGO_H}
        priority
        className="h-10 w-auto"
      />
    </Link>
  );
}

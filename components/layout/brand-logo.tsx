import Link from "next/link";
import Image from "next/image";

// Intrinsic ratio of public/images/logo.png (6250x3085). Passed to
// next/image at roughly display size so it generates a sensible srcset;
// the rendered height comes from imageClassName.
const LOGO_W = 228;
const LOGO_H = 112;

export function BrandLogo({
  className = "",
  /** The wordmark is ~2:1 and the lettering sits inside it, so it needs
   *  real height to stay legible. Callers with more room than the header
   *  (the footer) pass a larger one. */
  imageClassName = "h-14 w-auto",
}: {
  className?: string;
  imageClassName?: string;
}) {
  return (
    <Link href="/" className={`inline-flex items-center ${className}`} aria-label="LaMainDeux — accueil">
      <Image
        src="/images/logo.png"
        alt="LaMainDeux"
        width={LOGO_W}
        height={LOGO_H}
        priority
        className={imageClassName}
      />
    </Link>
  );
}

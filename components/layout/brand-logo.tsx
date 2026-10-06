import Link from "next/link";
import Image from "next/image";

// Intrinsic ratio of public/images/Plan B logo.png (2172x724). Passed to
// next/image at roughly display size so it generates a sensible srcset;
// the rendered height comes from imageClassName.
const LOGO_W = 228;
const LOGO_H = 76;

export function BrandLogo({
  className = "",
  /** The wordmark is 3:1 and the lettering sits inside it, so it needs
   *  real height to stay legible. Callers with more room than the header
   *  (the footer) pass a larger one. */
  imageClassName = "h-14 w-auto",
}: {
  className?: string;
  imageClassName?: string;
}) {
  return (
    <Link href="/" className={`inline-flex items-center ${className}`} aria-label="Plan b — accueil">
      <Image
        src="/images/Plan B logo.png"
        alt="Plan b"
        width={LOGO_W}
        height={LOGO_H}
        priority
        className={imageClassName}
      />
    </Link>
  );
}

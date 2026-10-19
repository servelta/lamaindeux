import { Facebook, Instagram, Linkedin } from "lucide-react";
import type { ComponentType } from "react";

const socials: { name: string; href: string; icon: ComponentType<{ className?: string }> }[] = [
  { name: "Instagram", href: "https://www.instagram.com/la.main.2/", icon: Instagram },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/lamain2/", icon: Linkedin },
  { name: "Facebook", href: "https://www.facebook.com/lamain2", icon: Facebook },
  { name: "TikTok", href: "https://www.tiktok.com/@lamaindeux", icon: TikTokIcon },
];

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 2h-3.3v13.7a2.9 2.9 0 1 1-2.5-2.9V9.4a6.3 6.3 0 1 0 5.8 6.3V8.8a8.4 8.4 0 0 0 4.9 1.6V7.1A5 5 0 0 1 16.6 2Z" />
    </svg>
  );
}

export function FooterSocialLinks() {
  return (
    <nav aria-labelledby="footer-social-title" className="mt-5">
      <p id="footer-social-title" className="text-sm font-semibold">Suivez-nous</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {socials.map(({ name, href, icon: Icon }) => (
          <li key={name}>
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`LaMain2 sur ${name} (nouvel onglet)`} title={`LaMain2 sur ${name}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
              <span aria-hidden="true"><Icon className="h-5 w-5" /></span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

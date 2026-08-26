import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { cn } from "@/lib/utils/cn";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationSchema, websiteSchema } from "@/lib/seo/schema";
import { ChatWidget } from "@/components/chat/chat-widget";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "LaMainDeux — Trouvez un artisan près de chez vous",
    template: "%s | LaMainDeux",
  },
  description:
    "Recherchez un artisan vérifié près de chez vous, comparez les prix et réservez en ligne. Sans commission, sans frais pour le client.",
  openGraph: {
    siteName: "LaMainDeux",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={cn(inter.variable, spaceGrotesk.variable, plexMono.variable)}>
      <body className="min-h-screen antialiased">
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}

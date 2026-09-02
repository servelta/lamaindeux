import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Contact" };

const choices = [
  {
    href: "/contact/client",
    title: "Je suis client",
    description: "Une question sur une réservation, un devis ou un service à domicile ?",
  },
  {
    href: "/contact/artisan",
    title: "Je suis artisan",
    description: "Une question sur votre profil, vos interventions ou votre abonnement ?",
  },
];

export default function ContactPage() {
  return (
    <div className="container max-w-5xl py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="overflow-hidden rounded-lg">
          <Image
            src="/images/contact-banner.png"
            alt="Une conseillère LaMainDeux prête à vous aider"
            width={1600}
            height={800}
            priority
            className="h-48 w-full object-cover sm:h-56 md:h-64"
          />
        </div>
        <p className="mt-8 text-sm font-medium uppercase tracking-[0.2em] text-primary">Contact</p>
        <h1 className="mt-4 font-display text-4xl font-bold">Contactez-nous</h1>
        <p className="mt-4 text-muted-foreground">
          Sélectionnez votre profil pour nous transmettre votre demande. Nous vous répondrons rapidement.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {choices.map((choice) => (
          <Link
            key={choice.href}
            href={choice.href}
            className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-primary hover:bg-secondary/20"
          >
            <div className="flex h-full flex-col justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold text-primary">{choice.title}</h2>
                <p className="mt-3 text-sm text-muted-foreground">{choice.description}</p>
              </div>

              <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
                Accéder au formulaire
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

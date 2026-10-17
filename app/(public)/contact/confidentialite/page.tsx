import { ContactForm } from "@/components/contact/contact-form";

export const metadata = { title: "Données personnelles et RGPD", description: "Exercez vos droits sur vos données auprès de LaMain2, avec ou sans compte." };

export default function PrivacyContactPage() {
  return (
    <div className="container max-w-3xl py-10 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Confidentialité · RGPD</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-primary">Vos données personnelles</h1>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">Accès, rectification, effacement, opposition ou question sur vos données : adressez votre demande à LaMain2. Aucun compte ni numéro de téléphone n’est nécessaire. Indiquez l’email concerné et une référence de réservation si cela aide à retrouver votre dossier.</p>
      <div className="mt-8 rounded-xl border border-border bg-card p-4 sm:p-6"><ContactForm role="client" privacyRequest /></div>
    </div>
  );
}

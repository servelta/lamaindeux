import { ContactForm } from "@/components/contact/contact-form";

export const metadata = { title: "Contact client" };

export default function ClientContactPage() {
  return (
    <div className="container max-w-3xl py-16">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Client</p>
        <h1 className="mt-3 font-display text-3xl font-bold">Contactez LaMainDeux</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <ContactForm role="client" />
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { LegalDocument } from "@/lib/legal/content";

const pages = [
  { href: "/conditions-utilisation", label: "Conditions d’utilisation" },
  { href: "/confidentialite", label: "Confidentialité et RGPD" },
  { href: "/cookies", label: "Cookies" },
];

export function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <article className="container max-w-5xl py-10 sm:py-16">
      <header className="max-w-3xl">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary"><ShieldCheck aria-hidden="true" className="h-4 w-4" />Informations légales · 2026</p>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">{document.title}</h1>
        <p className="mt-4 leading-7 text-muted-foreground">{document.description}</p>
        <p className="mt-4 text-xs text-muted-foreground">Dernière mise à jour : <time dateTime="2026-10-17">17 octobre 2026</time></p>
      </header>
      <ul aria-label="Les points essentiels" className="mt-8 grid gap-3 sm:grid-cols-3">
        {document.highlights.map(text => <li key={text} className="rounded-xl border border-primary/10 bg-secondary/40 p-4 text-sm font-medium leading-6 text-primary">{text}</li>)}
      </ul>
      <nav aria-label="Sommaire" className="mt-8 rounded-xl border border-border p-4 sm:p-6">
        <h2 className="text-sm font-semibold">Sur cette page</h2>
        <ol className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">{document.sections.map(section => <li key={section.id}><a href={`#${section.id}`} className="inline-flex min-h-11 items-center py-1 text-sm leading-6 text-muted-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{section.title}</a></li>)}</ol>
      </nav>
      <div className="mt-10 max-w-3xl space-y-10">
        {document.sections.map(section => <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-28">
          <h2 id={`${section.id}-title`} className="font-display text-xl font-semibold text-primary">{section.title}</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground [overflow-wrap:anywhere]">
            {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            {section.items && <ul className="list-disc space-y-3 pl-5">{section.items.map(item => <li key={item}>{item}</li>)}</ul>}
            {section.links && <ul className="flex flex-wrap gap-x-5 gap-y-1">{section.links.map(link => <li key={link.href}><Link href={link.href} className="inline-flex min-h-11 items-center gap-2 py-1 font-medium text-primary underline underline-offset-4">{link.label}<ArrowRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /></Link></li>)}</ul>}
          </div>
        </section>)}
      </div>
      <nav aria-label="Autres informations légales" className="mt-12 flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-5">{pages.map(page => <Link key={page.href} href={page.href} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline">{page.label}</Link>)}</nav>
      <p className="mt-6 text-xs text-muted-foreground">© 2026 LaMain2. Tous droits réservés.</p>
    </article>
  );
}

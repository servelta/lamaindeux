"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormState as useActionState } from "react-dom";
import { MessageCircle, X } from "lucide-react";
import { submitChatLeadAction, type ChatLeadResult } from "@/lib/chat/lead-action";
import { cn } from "@/lib/utils/cn";

const FAQS = [
  {
    question: "Comment réserver un artisan ?",
    answer:
      "Recherchez votre ville et le service souhaité sur la page d'accueil, comparez les artisans vérifiés, puis réservez directement en ligne.",
    href: "/",
    label: "Rechercher un artisan",
  },
  {
    question: "Combien ça coûte ?",
    answer:
      "La recherche et la réservation sont entièrement gratuites pour vous. Vous payez uniquement l'artisan, directement, pour l'intervention réalisée. Aucune commission n'est prélevée.",
  },
  {
    question: "Comment devenir artisan partenaire ?",
    answer:
      "Inscrivez-vous gratuitement, notre équipe vérifie votre dossier, puis vous signez un contrat et réglez un abonnement mensuel avant d'être activé.",
    href: "/inscription/professionnel",
    label: "Devenir artisan partenaire",
  },
  {
    question: "Comment annuler ou modifier ma réservation ?",
    answer:
      "Connectez-vous à votre espace client, ouvrez la réservation concernée, et utilisez le bouton d'annulation. Pour toute autre modification, contactez directement l'artisan.",
    href: "/mes-reservations",
    label: "Voir mes réservations",
  },
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [state, formAction] = useActionState<ChatLeadResult, FormData>(
    submitChatLeadAction,
    undefined
  );
  const selectedFaq = FAQS.find((faq) => faq.question === selectedQuestion);

  function showOtherQuestion() {
    setSelectedQuestion(null);
    setContactOpen(true);
  }

  function showQuestions() {
    setSelectedQuestion(null);
    setContactOpen(false);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <span className="font-display text-sm font-semibold">Assistant LaMainDeux</span>
            <button onClick={() => setOpen(false)} aria-label="Fermer le chat">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {!selectedFaq && !contactOpen && (
              <>
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">
                  Bonjour ! Comment pouvons-nous vous aider ?
                </p>
                {FAQS.map((faq) => (
                  <button
                    key={faq.question}
                    type="button"
                    onClick={() => setSelectedQuestion(faq.question)}
                    className="block w-full rounded-md border border-border px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-secondary"
                  >
                    {faq.question}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={showOtherQuestion}
                  className="block w-full rounded-md border border-border px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-secondary"
                >
                  J&apos;ai une autre question
                </button>
              </>
            )}

            {selectedFaq && (
              <>
                <p className="ml-auto max-w-[90%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
                  {selectedFaq.question}
                </p>
                <p className="max-w-[90%] rounded-lg bg-secondary px-3 py-2 text-sm">
                  {selectedFaq.answer}
                </p>
                {selectedFaq.href && (
                  <Link
                    href={selectedFaq.href}
                    className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    {selectedFaq.label}
                  </Link>
                )}
                <button type="button" onClick={showQuestions} className="text-sm text-primary hover:underline">
                  ← Retour aux questions
                </button>
                <button type="button" onClick={showOtherQuestion} className="block text-sm text-primary hover:underline">
                  J&apos;ai une autre question
                </button>
              </>
            )}

            {contactOpen && (
              <form action={formAction} className="space-y-3">
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm">
                  Laissez-nous vos coordonnées et votre message.
                </p>
                <input name="name" placeholder="Nom" required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
                <input name="email" type="email" placeholder="E-mail" required className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" />
                <textarea name="message" placeholder="Message" required rows={4} className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm" />
                {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
                {state?.success && <p role="status" className="text-sm text-verified">{state.success}</p>}
                {!state?.success && (
                  <button type="submit" className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                    Envoyer
                  </button>
                )}
                <button type="button" onClick={showQuestions} className="text-sm text-primary hover:underline">
                  ← Retour aux questions
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
        aria-label={open ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}

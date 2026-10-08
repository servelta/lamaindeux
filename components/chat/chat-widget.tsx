"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CheckCheck, ChevronDown, LoaderCircle, MessageCircle, Send, X } from "lucide-react";
import { submitChatLeadAction, type ChatLeadResult } from "@/lib/chat/lead-action";
import type { ChatAnswer } from "@/lib/chat/knowledge";
import { SubmitButton } from "@/components/auth/submit-button";

type Message = ChatAnswer & { id: number; role: "assistant" | "visitor" };
const WELCOME: Message = { id: 0, role: "assistant", text: "Bonjour et bienvenue sur LaMain2 👋 Je vous accompagne sur toute la plateforme : artisans, réservations, comptes, horaires, devis et factures. Comment puis-je vous aider ?" };
const SUGGESTIONS = ["Trouver un artisan", "Réserver sans compte", "Quels sont les prix ?", "Devenir artisan", "Créer une facture PDF", "Modifier mes horaires"];
const FIELD = "mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

function Avatar({ size = 40 }: { size?: number }) {
  return <Image src="/images/chat-assistant.webp" alt="Portrait illustratif de l’assistant LaMain2" width={size} height={size} className="shrink-0 rounded-full object-cover" />;
}
function PersonalReplyForm({ messages, question, onClose }: { messages: Message[]; question: string; onClose: () => void }) {
  const [state, action] = useActionState<ChatLeadResult, FormData>(submitChatLeadAction, undefined);
  return <div className="rounded-2xl border border-primary/10 bg-white p-4 shadow-sm">
    <h3 className="font-display text-base font-semibold text-primary">Une réponse personnelle</h3>
    <p className="mt-1 text-xs leading-5 text-muted-foreground">L’équipe LaMain2 prendra le relais. Vos coordonnées et cette conversation lui seront envoyées.</p>
    {state?.success ? <p role="status" className="mt-4 rounded-xl bg-teal-50 p-3 text-sm leading-6 text-primary"><CheckCheck aria-hidden="true" className="mb-1 h-5 w-5" />{state.success}</p> : <form action={action} className="mt-4 space-y-3">
      <input type="hidden" name="transcript" value={messages.slice(-12).map(m => (m.role === "visitor" ? "Visiteur : " : "Assistant : ") + m.text.slice(0, 1000)).join("\n\n")} />
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div><label htmlFor="chat-name" className="text-xs font-semibold">Votre nom</label><input id="chat-name" name="name" autoComplete="name" required maxLength={100} className={FIELD} /></div>
      <div><label htmlFor="chat-email" className="text-xs font-semibold">Votre email</label><input id="chat-email" name="email" type="email" autoComplete="email" required maxLength={254} className={FIELD} /></div>
      <div><label htmlFor="chat-phone" className="text-xs font-semibold">Téléphone <span className="font-normal text-muted-foreground">(optionnel)</span></label><input id="chat-phone" name="phone" type="tel" autoComplete="tel" maxLength={32} className={FIELD} /></div>
      <div><label htmlFor="chat-question" className="text-xs font-semibold">Votre question</label><textarea id="chat-question" name="message" required maxLength={2000} rows={3} defaultValue={question} className={FIELD + " resize-y"} /></div>
      <label className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><input type="checkbox" name="consent" required className="mt-1 shrink-0 accent-primary" /><span>J’accepte que LaMain2 me contacte au sujet de cette demande. <Link href="/confidentialite" className="underline">Confidentialité</Link></span></label>
      {state?.error ? <p role="alert" className="text-xs leading-5 text-destructive">{state.error} <Link href="/contact" className="underline">Contact</Link></p> : null}
      <SubmitButton className="w-full rounded-xl" pendingText="Envoi en cours…">Demander une réponse <ArrowUpRight aria-hidden="true" className="ml-2 h-4 w-4" /></SubmitButton>
    </form>}
    <button type="button" onClick={onClose} className="mt-3 text-xs font-medium text-primary underline underline-offset-4">Revenir à la conversation</button>
  </div>;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");
  const [topic, setTopic] = useState<string>();
  const counter = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => { if (open && !contactOpen) inputRef.current?.focus(); }, [open, contactOpen]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy, contactOpen, open]);
  useEffect(() => {
    if (!open) return;
    function onEscape(event: KeyboardEvent) { if (event.key === "Escape") { setOpen(false); launcherRef.current?.focus(); } }
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);
  async function sendQuestion(text: string) {
    const question = text.trim();
    if (!question || busy || question.length > 600) return;
    setMessages(previous => [...previous.slice(-39), { id: counter.current++, role: "visitor", text: question }]);
    setDraft(""); setLastQuestion(question); setBusy(true); setContactOpen(false);
    const controller = new AbortController(); requestRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, topic }), signal: controller.signal });
      if (!response.ok) throw new Error("Chat unavailable");
      const answer: ChatAnswer = await response.json();
      if (typeof answer.text !== "string") throw new Error("Invalid answer");
      setMessages(previous => [...previous, { ...answer, id: counter.current++, role: "assistant" }]);
      setTopic(answer.topic); setContactOpen(Boolean(answer.handoff));
    } catch {
      setMessages(previous => [...previous, { id: counter.current++, role: "assistant", text: "Je ne peux pas répondre pour le moment. Laissez vos coordonnées pour recevoir une réponse personnelle de l’équipe LaMain2.", handoff: true }]);
      setContactOpen(true);
    } finally { clearTimeout(timeout); setBusy(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); void sendQuestion(draft); }
  return <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
    {open ? <section id="plan-b-chat" role="dialog" aria-label="Conversation avec l’assistant LaMain2" className="mb-3 flex h-[min(620px,calc(100dvh-108px))] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-[1.75rem] border border-primary/10 bg-[#f6f8f7] shadow-[0_20px_70px_-15px_rgba(24,73,85,0.4)]">
      <div className="flex shrink-0 items-center gap-3 bg-primary px-5 py-4 text-primary-foreground">
        <div className="rounded-full border-2 border-white/30"><Avatar size={44} /></div>
        <div className="min-w-0 flex-1"><h2 className="font-display text-base font-semibold">Votre assistant LaMain2</h2><p className="mt-0.5 text-xs text-white/75">Assistant automatique · relais humain</p></div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Réduire le chat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><ChevronDown aria-hidden="true" className="h-5 w-5" /></button>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5">
        <p className="text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Un coup de main pour vos travaux</p>
        <div role="log" aria-label="Messages de la conversation" aria-live="polite" aria-relevant="additions" className="space-y-4">
          {messages.map(message => <div key={message.id} className={message.role === "visitor" ? "flex justify-end" : "flex items-end gap-2"}>
            {message.role === "assistant" ? <Avatar size={28} /> : null}
            <div className={"max-w-[85%] break-words rounded-2xl px-3.5 py-3 text-sm leading-6 " + (message.role === "visitor" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-primary/5 bg-white text-foreground shadow-sm")}>
              <p className="whitespace-pre-line">{message.text}</p>
              {message.href && message.label ? <Link href={message.href} onClick={() => setOpen(false)} className="mt-3 inline-flex items-center gap-1 rounded-lg bg-secondary/60 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-secondary">{message.label}<ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link> : null}
            </div>
          </div>)}
        </div>
        {messages.length === 1 ? <div className="ml-9 flex flex-wrap gap-2">{SUGGESTIONS.map(question => <button key={question} type="button" disabled={busy} onClick={() => void sendQuestion(question)} className="rounded-full border border-primary/20 bg-white px-3 py-2 text-xs font-medium text-primary transition hover:border-primary hover:bg-secondary/30 disabled:opacity-50">{question}</button>)}</div> : null}
        {busy ? <div role="status" className="ml-9 flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />Je prépare votre réponse…</div> : null}
        {contactOpen ? <PersonalReplyForm messages={messages} question={lastQuestion} onClose={() => setContactOpen(false)} /> : null}
      </div>
      <div className="shrink-0 border-t border-primary/10 bg-white px-4 pb-3 pt-3">
        <form onSubmit={submit} className="flex items-center gap-2 rounded-2xl border border-primary/15 bg-muted/30 p-1.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
          <label htmlFor="chat-input" className="sr-only">Votre message</label><input ref={inputRef} id="chat-input" value={draft} onChange={event => setDraft(event.target.value)} maxLength={600} disabled={busy || contactOpen} placeholder="Écrivez votre question…" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none disabled:opacity-50" />
          <button type="submit" disabled={!draft.trim() || busy || contactOpen} aria-label="Envoyer le message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary/90 disabled:opacity-40"><Send aria-hidden="true" className="h-4 w-4" /></button>
        </form>
        <button type="button" onClick={() => setContactOpen(true)} className="mt-2 w-full py-1 text-center text-[11px] font-medium text-muted-foreground hover:text-primary">Demander une réponse personnelle</button>
      </div>
    </section> : null}
    <div className="flex justify-end"><button ref={launcherRef} type="button" onClick={() => setOpen(value => !value)} aria-label={open ? "Fermer le chat" : "Ouvrir le chat"} aria-expanded={open} aria-controls="plan-b-chat" className="group flex items-center gap-2 rounded-full border-2 border-white bg-primary p-1.5 text-white shadow-lg transition hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
      {open ? <span className="flex h-10 w-10 items-center justify-center"><X aria-hidden="true" className="h-5 w-5" /></span> : <><Avatar size={40} /><span className="hidden pr-2 text-xs font-semibold sm:block">Besoin d’aide ?</span><MessageCircle aria-hidden="true" className="mr-1 h-4 w-4" /></>}
    </button></div>
  </div>;
}

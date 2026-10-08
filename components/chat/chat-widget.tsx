"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CheckCheck, ChevronDown, LoaderCircle, MessageCircle, Send, X } from "lucide-react";
import { submitChatLeadAction, type ChatLeadResult } from "@/lib/chat/lead-action";
import type { ChatAnswer } from "@/lib/chat/knowledge";
import { SubmitButton } from "@/components/auth/submit-button";

type Message = ChatAnswer & { id: number; role: "assistant" | "visitor" };
const WELCOME: Message = { id: 0, role: "assistant", text: "Bonjour et bienvenue sur LaMain2 👋 Artisans, réservations, comptes, devis : comment puis-je vous aider ?" };
const SUGGESTIONS = ["Trouver un artisan", "Réserver sans compte", "Quels sont les prix ?", "Devenir artisan", "Créer une facture PDF", "Modifier mes horaires"];
const FIELD = "mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-base sm:text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";
const MOBILE_CHAT_QUERY = "(max-width: 639px), (max-width: 1023px) and (pointer: coarse)";

function Avatar({ size = 40 }: { size?: number }) {
  return <Image src="/images/chat-assistant.webp" alt="Portrait illustratif de l’assistant LaMain2" width={size} height={size} className="shrink-0 rounded-full object-cover" />;
}
function PersonalReplyForm({ messages, question, onClose }: { messages: Message[]; question: string; onClose: () => void }) {
  const [state, action] = useActionState<ChatLeadResult, FormData>(submitChatLeadAction, undefined);
  return <div data-chat-reply className="rounded-2xl border border-primary/10 bg-white p-4 shadow-sm">
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
    <button type="button" onClick={onClose} className="mt-3 min-h-11 text-xs font-medium text-primary underline underline-offset-4">Revenir à la conversation</button>
  </div>;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [mobileDialog, setMobileDialog] = useState(false);
  const [editingPage, setEditingPage] = useState(false);
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
  const panelRef = useRef<HTMLElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    const update = () => {
      const field = document.activeElement;
      setEditingPage(Boolean(field instanceof HTMLElement && field.matches('input:not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea, select') && !panelRef.current?.contains(field)));
    };
    const afterBlur = () => queueMicrotask(update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", afterBlur);
    return () => { document.removeEventListener("focusin", update); document.removeEventListener("focusout", afterBlur); };
  }, []);
  useEffect(() => () => requestRef.current?.abort(), []);
  const closeChat = useCallback(() => {
    inputRef.current?.blur();
    setOpen(false);
  }, []);
  useEffect(() => {
    if (!open) {
      if (wasOpen.current) launcherRef.current?.focus({ preventScroll: true });
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    // Desktop retains its quick typing behaviour. Mobile focuses only the dialog,
    // never an editable field, including after suggestions or a handoff response.
    if (!window.matchMedia(MOBILE_CHAT_QUERY).matches) inputRef.current?.focus({ preventScroll: true });
    else panelRef.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const mobile = window.matchMedia(MOBILE_CHAT_QUERY);
    const viewport = window.visualViewport;
    let restorePage: (() => void) | undefined;
    const lockPage = () => {
      if (restorePage) return;
      const pageY = window.scrollY;
      const body = document.body;
      const original = { position: body.style.position, top: body.style.top, width: body.style.width, overflow: body.style.overflow };
      body.style.position = "fixed"; body.style.top = "-" + pageY + "px"; body.style.width = "100%"; body.style.overflow = "hidden";
      const root = panelRef.current?.closest("[data-chat-root]");
      const siblings = Array.from(body.children).filter((node): node is HTMLElement => node instanceof HTMLElement && node !== root && !node.contains(root ?? null));
      const inertBefore = siblings.map(node => node.inert);
      siblings.forEach(node => { node.inert = true; });
      restorePage = () => {
        Object.assign(body.style, original);
        siblings.forEach((node, index) => { node.inert = inertBefore[index]; });
        const html = document.documentElement; const behaviour = html.style.scrollBehavior;
        html.style.scrollBehavior = "auto"; window.scrollTo({ top: pageY, behavior: "instant" }); html.style.scrollBehavior = behaviour;
      };
    };
    const update = () => {
      const panel = panelRef.current;
      if (!panel) return;
      setMobileDialog(mobile.matches);
      if (!mobile.matches) { restorePage?.(); restorePage = undefined; return; }
      lockPage();
      // A keyboard shrinks the visual viewport without changing its scale.
      // Ignore pinch zoom updates so intentional zoom is not counteracted.
      if (viewport && Math.abs(viewport.scale - 1) > 0.01) return;
      panel.style.setProperty("--chat-height", String(viewport?.height ?? window.innerHeight) + "px");
      panel.style.setProperty("--chat-top", String(viewport?.offsetTop ?? 0) + "px");
      panel.style.setProperty("--chat-left", String(viewport?.offsetLeft ?? 0) + "px");
      panel.style.setProperty("--chat-width", String(viewport?.width ?? window.innerWidth) + "px");
    };
    const trapFocus = (event: KeyboardEvent) => {
      if (!mobile.matches || event.key !== "Tab") return;
      const panel = panelRef.current;
      const controls = Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), [tabindex="0"]') ?? []).filter(el => el.getClientRects().length > 0 && el.getAttribute("aria-hidden") !== "true");
      const first = controls[0], last = controls.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last.focus({ preventScroll: true }); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel)) { event.preventDefault(); first.focus({ preventScroll: true }); }
    };
    update();
    viewport?.addEventListener("resize", update); viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update); mobile.addEventListener("change", update); document.addEventListener("keydown", trapFocus);
    return () => {
      viewport?.removeEventListener("resize", update); viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update); mobile.removeEventListener("change", update); document.removeEventListener("keydown", trapFocus); restorePage?.();
    };
  }, [open]);
  useEffect(() => {
    const area = scrollRef.current;
    if (!area) return;
    const reply = contactOpen ? area.querySelector<HTMLElement>("[data-chat-reply]") : null;
    if (reply) area.scrollTop += reply.getBoundingClientRect().top - area.getBoundingClientRect().top;
    else area.scrollTop = messages.length === 1 ? 0 : area.scrollHeight;
  }, [messages, busy, contactOpen, open]);
  useEffect(() => {
    if (!open) return;
    function onEscape(event: KeyboardEvent) { if (event.key === "Escape") { closeChat(); } }
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open, closeChat]);
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
  return <div data-chat-root className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-50 sm:bottom-6 sm:right-6">
    {open ? <section ref={panelRef} tabIndex={-1} id="plan-b-chat" role="dialog" aria-modal={mobileDialog || undefined} aria-label="Conversation avec l’assistant LaMain2" className="chat-panel mb-3 flex h-[min(620px,calc(100dvh-108px))] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-[1.75rem] border border-primary/10 bg-[#f6f8f7] shadow-[0_20px_70px_-15px_rgba(24,73,85,0.4)]">
      <div className="chat-header flex shrink-0 items-center gap-3 bg-primary px-5 py-3 sm:py-4 text-primary-foreground">
        <div className="rounded-full border-2 border-white/30"><Avatar size={44} /></div>
        <div className="min-w-0 flex-1"><h2 className="font-display text-base font-semibold">Votre assistant LaMain2</h2><p className="mt-0.5 text-xs text-white/75">Assistant automatique · relais humain</p></div>
        <button type="button" onClick={closeChat} aria-label="Réduire le chat" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><ChevronDown aria-hidden="true" className="h-5 w-5" /></button>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5">
        <p className="text-center text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Un coup de main pour vos travaux</p>
        <div role="log" aria-label="Messages de la conversation" aria-live="polite" aria-relevant="additions" className="space-y-4">
          {messages.map(message => <div key={message.id} className={message.role === "visitor" ? "flex justify-end" : "flex items-end gap-2"}>
            {message.role === "assistant" ? <Avatar size={28} /> : null}
            <div className={"max-w-[85%] break-words rounded-2xl px-3.5 py-3 text-sm leading-6 " + (message.role === "visitor" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-primary/5 bg-white text-foreground shadow-sm")}>
              <p className="whitespace-pre-line">{message.text}</p>
              {message.href && message.label ? <Link href={message.href} onClick={closeChat} className="mt-3 inline-flex items-center gap-1 rounded-lg bg-secondary/60 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-secondary">{message.label}<ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link> : null}
            </div>
          </div>)}
        </div>
        {messages.length === 1 ? <div className="ml-9 flex flex-wrap gap-2">{SUGGESTIONS.map(question => <button key={question} type="button" disabled={busy} onClick={() => void sendQuestion(question)} className="min-h-11 rounded-full border border-primary/20 bg-white px-3 py-2 text-xs font-medium text-primary transition hover:border-primary hover:bg-secondary/30 disabled:opacity-50">{question}</button>)}</div> : null}
        {busy ? <div role="status" className="ml-9 flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />Je prépare votre réponse…</div> : null}
        {contactOpen ? <PersonalReplyForm messages={messages} question={lastQuestion} onClose={() => setContactOpen(false)} /> : null}
      </div>
      <div className="chat-composer shrink-0 border-t border-primary/10 bg-white px-4 pb-3 pt-3">
        <form onSubmit={submit} className="flex items-center gap-2 rounded-2xl border border-primary/15 bg-muted/30 p-1.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
          <label htmlFor="chat-input" className="sr-only">Votre message</label><input ref={inputRef} id="chat-input" value={draft} onChange={event => setDraft(event.target.value)} maxLength={600} readOnly={busy} disabled={contactOpen} placeholder="Écrivez votre question…" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-base sm:text-sm outline-none disabled:opacity-50" />
          <button type="submit" disabled={!draft.trim() || busy || contactOpen} aria-label="Envoyer le message" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary/90 disabled:opacity-40"><Send aria-hidden="true" className="h-4 w-4" /></button>
        </form>
        <button type="button" onClick={() => setContactOpen(true)} className="mt-1 min-h-11 w-full py-2 sm:mt-2 sm:min-h-0 sm:py-1 text-center text-[11px] font-medium text-muted-foreground hover:text-primary">Demander une réponse personnelle</button>
      </div>
    </section> : null}
    <div className={open ? "chat-launcher-open hidden justify-end sm:flex" : `flex justify-end ${editingPage ? "chat-launcher-editing" : ""}`}><button ref={launcherRef} type="button" onClick={() => { if (open) closeChat(); else setOpen(true); }} aria-label={open ? "Fermer le chat" : "Ouvrir le chat"} aria-expanded={open} aria-controls="plan-b-chat" className="group flex items-center gap-2 rounded-full border-2 border-white bg-primary p-1.5 text-white shadow-lg transition hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
      {open ? <span className="flex h-10 w-10 items-center justify-center"><X aria-hidden="true" className="h-5 w-5" /></span> : <><Avatar size={40} /><span className="hidden pr-2 text-xs font-semibold sm:block">Besoin d’aide ?</span><MessageCircle aria-hidden="true" className="mr-1 h-4 w-4" /></>}
    </button></div>
  </div>;
}

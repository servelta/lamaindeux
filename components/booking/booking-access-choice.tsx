"use client";

import Link from "next/link";
import { useTransition, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { UserRound, LogIn, LoaderCircle } from "lucide-react";

/** A dedicated choice screen; neither action focuses a text field. */
export function BookingAccessChoice({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function navigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!pending) startTransition(() => router.push(href));
  }
  const guestUrl = new URL(returnTo, "https://lamain2.invalid");
  guestUrl.searchParams.set("mode", "guest");
  const actionClass = "flex min-h-16 min-w-0 items-center gap-3 rounded-2xl border border-primary/20 bg-white p-5 text-base font-semibold text-primary transition hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const guestHref = guestUrl.pathname + guestUrl.search;
  const loginHref = `/connexion?next=${encodeURIComponent(returnTo)}`;
  return <section aria-label="Comment souhaitez-vous réserver ?" aria-busy={pending} className="grid gap-3 sm:grid-cols-2">
    <Link href={guestHref} onClick={event => navigate(event, guestHref)} aria-disabled={pending} className={actionClass}><UserRound aria-hidden="true" className="h-6 w-6 shrink-0" /><span>Réserver sans compte</span></Link>
    <Link href={loginHref} onClick={event => navigate(event, loginHref)} aria-disabled={pending} className={actionClass}><LogIn aria-hidden="true" className="h-6 w-6 shrink-0" /><span>Se connecter et réserver</span></Link>
    {pending ? <p role="status" className="flex items-center gap-2 text-sm text-primary sm:col-span-2"><LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />Ouverture…</p> : null}
  </section>;
}

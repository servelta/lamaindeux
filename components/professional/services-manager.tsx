import { BadgeCheck, LockKeyhole } from "lucide-react";
import type { getOwnProfessionalServices } from "@/lib/professional/queries";
export function ServiceList({services}:{services:Awaited<ReturnType<typeof getOwnProfessionalServices>>}) {
 return <div className="space-y-4">{services.map(item=>{const service=Array.isArray(item.services)?item.services[0]:item.services;return <article key={item.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold">{service?.name}</h2><BadgeCheck aria-hidden="true" className="h-5 w-5 text-primary" /></div><p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole aria-hidden="true" className="h-3.5 w-3.5" />Service attribué automatiquement par Le Plan B</p></article>})}</div>;
}

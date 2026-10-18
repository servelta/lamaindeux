import { ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

// WhatsApp glyph from Simple Icons (CC0); rendered locally without a remote image.
function WhatsAppLogo({ className }: { className: string }) {
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>;
}

export function WhatsAppHandoff({ href, recipientName }: { href: string; recipientName?: string | null }) {
  return (
    <section aria-labelledby="whatsapp-handoff-title" className="mt-7 overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-5 text-left shadow-[0_12px_36px_-24px_rgba(5,150,105,0.5)] sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-sm">
          <WhatsAppLogo className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">Contact direct avec votre artisan</p>
          <h2 id="whatsapp-handoff-title" className="mt-1 font-display text-xl font-bold leading-tight text-slate-900">Pour une réponse plus rapide</h2>
        </div>
      </div>
      <p className="mt-4 break-words text-sm leading-6 text-slate-600">Envoyez votre demande sur WhatsApp à <strong className="font-semibold text-slate-900">{recipientName || "votre artisan"}</strong> pour échanger directement.</p>
      <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-800"><Check aria-hidden="true" className="h-4 w-4 shrink-0" />Votre message est déjà prêt.</p>
      <Button asChild className="mt-4 h-14 w-full gap-2 whitespace-normal rounded-2xl bg-[#0B7A3D] px-3 text-base font-semibold text-white shadow-[0_6px_16px_-8px_rgba(18,140,74,0.65)] transition hover:bg-[#086432] hover:shadow-lg motion-safe:hover:-translate-y-0.5">
        <a href={href} target="_blank" rel="noopener noreferrer">
          <WhatsAppLogo className="h-5 w-5 shrink-0" />Envoyer sur WhatsApp<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" />
        </a>
      </Button>
      <p className="mt-3 text-center text-xs leading-5 text-slate-500">Dans WhatsApp, appuyez sur Envoyer pour transmettre votre message. Votre demande est déjà enregistrée sur LaMain2.</p>
    </section>
  );
}

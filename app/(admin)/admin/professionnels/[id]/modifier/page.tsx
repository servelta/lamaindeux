import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin/queries";
import { getAdminAccountDetails } from "@/lib/admin/account-details";
import { createClient } from "@/lib/supabase/server";
import { ArtisanEditForm, ArtisanRemoveButton } from "@/components/admin/artisan-edit-form";
import { ServiceList } from "@/components/professional/services-manager";
import { ServiceAreasManager } from "@/components/professional/service-areas-manager";
import { WeeklyAvailabilityManager } from "@/components/professional/calendar-manager";
import { DailyAvailabilityManager } from "@/components/professional/daily-availability-manager";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import * as actions from "@/lib/admin/artisan-edit-actions";

export const metadata = { title: "Modifier l’artisan" };
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block min-w-0 space-y-2"><span className="block text-sm font-medium">{label}</span>{children}</label>;
}
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section id={id} className="scroll-mt-28 min-w-0 space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-6"><h2 className="font-display text-xl font-semibold text-primary">{title}</h2>{children}</section>;
}
export default async function AdminArtisanEditor({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const client = await createClient();
  const [professionalResult, profileResult, citiesResult, tradesResult, servicesResult, areasResult, slotsResult, galleryResult, exceptionsResult, account] = await Promise.all([
    client.from("professionals").select("*").eq("profile_id", id).maybeSingle(),
    client.from("profiles").select("first_name,last_name,phone,avatar_url").eq("id", id).maybeSingle(),
    client.from("cities").select("id,name,slug").eq("active", true).order("name"),
    client.from("trades").select("id,name_singular").order("name_singular"),
    client.from("professional_services").select("*, services(id,name,slug,default_pricing_type)").eq("professional_id", id).order("created_at"),
    client.from("professional_service_areas").select("*, cities(id,name,slug)").eq("professional_id", id),
    client.from("availability").select("*").eq("professional_id", id).order("weekday").order("start_time"),
    client.from("professional_gallery_photos").select("id,storage_path").eq("professional_id", id).order("sort_order").order("created_at"),
    client.from("availability_exceptions").select("id,date,reason").eq("professional_id", id).order("date"),
    getAdminAccountDetails(id),
  ]);
  if ([professionalResult, profileResult, citiesResult, tradesResult, servicesResult, areasResult, slotsResult, galleryResult, exceptionsResult].some(result => result.error)) throw new Error("Impossible de charger l’éditeur de l’artisan. Réessayez.");
  const p = professionalResult.data, profile = profileResult.data;
  if (!p || !profile) notFound();
  const { data: catalog, error: catalogError } = await client.from("services").select("id,name").eq("trade_id", p.trade_id).eq("active", true).order("sort_order");
  if (catalogError) throw new Error("Impossible de charger les services.");
  const sections = [["profil", "Profil public"], ["images", "Logo et photos"], ["compte", "Compte et emails"], ["services", "Services et tarifs"], ["zones", "Zones d’intervention"], ["horaires", "Horaires et calendrier"]];
  const fields = [
    { name: "yearsExperience", label: "Années d’expérience", value: p.years_experience, type: "number", min: 0, max: 60 },
    { name: "publicPhone", label: "Téléphone public", value: p.public_phone, type: "tel" },
    { name: "website", label: "Site web", value: p.website, type: "url" },
    { name: "businessPostcode", label: "Code postal", value: p.business_postcode, pattern: "[0-9]{5}", required: true },
    { name: "siret", label: "SIRET", value: p.siret, pattern: "[0-9]{14}" },
    { name: "siren", label: "SIREN", value: p.siren, pattern: "[0-9]{9}" },
    { name: "googleRating", label: "Note Google", value: p.google_rating, type: "number", min: 0, max: 5, step: "0.1" },
    { name: "googleReviewCount", label: "Nombre d’avis Google", value: p.google_review_count, type: "number", min: 0, step: "1" },
  ];
  return <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
    <Link href={`/admin/professionnels/${id}`} className="inline-flex min-h-11 items-center text-sm text-primary underline">← Retour à la fiche artisan</Link>
    <h1 className="mt-3 break-words font-display text-2xl font-bold">Modifier {p.company_name}</h1>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">Chaque section s’enregistre séparément. Les modifications sont appliquées au compte et à la page publique de cet artisan.</p>
    <a href={`/artisan/${p.slug}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-primary underline">Voir le profil public ↗</a>
    <nav aria-label="Sections de l’éditeur" className="my-6 flex flex-wrap gap-2">{sections.map(([href, label]) => <a key={href} href={`#${href}`} className="inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium hover:bg-secondary">{label}</a>)}</nav>
    <div className="space-y-6">
      <Section id="profil" title="Profil public et entreprise">
        <ArtisanEditForm action={actions.saveArtisanProfileAction.bind(null, id)}>
          <Field label="Nom de l’entreprise"><Input name="companyName" defaultValue={p.company_name} required maxLength={200} /></Field>
          <Field label="Description"><Textarea name="description" defaultValue={p.description ?? ""} rows={5} maxLength={2000} /></Field>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <Field label="Métier"><select name="tradeId" defaultValue={p.trade_id} required className="h-11 w-full min-w-0 rounded-md border bg-background px-3 text-base">{tradesResult.data?.map(t => <option key={t.id} value={t.id}>{t.name_singular}</option>)}</select></Field>
            {fields.map(({ label, value, ...field }) => <Field key={field.name} label={label}><Input {...field} defaultValue={value ?? ""} /></Field>)}
          </div>
          <Field label="Adresse de l’entreprise"><Input name="businessAddress" defaultValue={p.business_address ?? ""} /></Field>
          <Field label="Ville"><Input name="businessCity" defaultValue={p.business_city ?? ""} list="admin-editor-cities" required /><datalist id="admin-editor-cities">{citiesResult.data?.map(c => <option key={c.id} value={c.name} />)}</datalist></Field>
          <Field label="Adresse du profil (après /artisan/)"><Input name="slug" defaultValue={p.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></Field>
          <p className="text-xs leading-6 text-muted-foreground">Changer l’adresse rend l’ancien lien indisponible. Changer de métier désactive les services de l’ancien métier ; les réservations existantes sont conservées.</p>
        </ArtisanEditForm>
      </Section>
      <Section id="images" title="Logo / photo de profil et galerie">
        {profile.avatar_url && <div className="flex flex-wrap items-center gap-4"><Image unoptimized src={profile.avatar_url} alt={`Logo ou photo de ${p.company_name}`} width={96} height={96} className="h-24 w-24 rounded-xl border object-contain" /><ArtisanRemoveButton action={actions.removeArtisanImageAction.bind(null, id, "avatar")} label="Retirer le logo / la photo" confirmation="Retirer le logo ou la photo de profil de cet artisan ?" /></div>}
        <ArtisanEditForm action={actions.saveArtisanImageAction.bind(null, id, "avatar")} label="Enregistrer le logo / la photo"><Field label="Nouveau logo ou photo de profil"><Input name="image" type="file" accept="image/jpeg,image/png,image/webp" required /></Field></ArtisanEditForm>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{galleryResult.data?.map(photo => <div key={photo.id} className="min-w-0 space-y-2"><Image unoptimized src={client.storage.from("avatars").getPublicUrl(photo.storage_path).data.publicUrl} alt="Photo de réalisation de l’artisan" width={240} height={180} className="aspect-[4/3] w-full rounded-xl object-cover" /><ArtisanRemoveButton action={actions.removeArtisanImageAction.bind(null, id, "gallery", photo.id)} label="Supprimer" confirmation="Supprimer cette photo de la galerie publique ?" /></div>)}</div>
        {(galleryResult.data?.length ?? 0) < 6 && <ArtisanEditForm action={actions.saveArtisanImageAction.bind(null, id, "gallery")} label="Ajouter à la galerie"><Field label="Nouvelle photo de réalisation"><Input name="image" type="file" accept="image/jpeg,image/png,image/webp" required /></Field></ArtisanEditForm>}
        <p className="text-xs text-muted-foreground">JPG, PNG ou WebP · 2 Mo par image · 6 photos maximum dans le carrousel.</p>
      </Section>
      <Section id="compte" title="Identité du compte et emails privés">
        <ArtisanEditForm action={actions.saveArtisanIdentityAction.bind(null, id)}>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2"><Field label="Prénom"><Input name="firstName" defaultValue={profile.first_name} maxLength={100} required /></Field><Field label="Nom"><Input name="lastName" defaultValue={profile.last_name} maxLength={100} required /></Field></div>
          <Field label="Téléphone du compte"><Input name="phone" type="tel" maxLength={50} defaultValue={profile.phone ?? ""} /></Field>
        </ArtisanEditForm>
        <div className="border-t pt-5"><ArtisanEditForm action={actions.saveArtisanEmailAction.bind(null, id, "contact")} label="Enregistrer l’email de contact"><Field label="Email de contact privé (notifications)"><Input name="email" type="email" defaultValue={account?.contactEmail ?? ""} /></Field><p className="text-xs text-muted-foreground">Non visible sur le profil public. Si vide, les notifications utilisent l’email de connexion.</p></ArtisanEditForm></div>
        <div className="border-t pt-5"><ArtisanEditForm action={actions.saveArtisanEmailAction.bind(null, id, "login")} label="Changer l’email de connexion" confirmation="Changer l’email de connexion de cet artisan ? Il devra utiliser la nouvelle adresse pour se connecter."><Field label="Email de connexion"><Input name="email" type="email" defaultValue={account?.email ?? ""} required /></Field></ArtisanEditForm></div>
        <p className="text-sm leading-6 text-muted-foreground">Les mots de passe restent non consultables. <Link href="/mot-de-passe-oublie" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-primary underline">Ouvrir la réinitialisation du mot de passe</Link></p>
      </Section>
      <Section id="services" title="Services, descriptions, tarifs et durées"><ServiceList key={p.trade_id} services={servicesResult.data ?? []} catalog={catalog ?? []} actions={{ add: actions.adminAddService.bind(null, id), update: actions.adminUpdateService.bind(null, id), toggle: actions.adminToggleService.bind(null, id) }} /></Section>
      <Section id="zones" title="Zones d’intervention"><ServiceAreasManager areas={areasResult.data ?? []} cities={citiesResult.data ?? []} profileCity={p.business_city} addAction={actions.adminAddArea.bind(null, id)} removeAction={actions.adminRemoveArea.bind(null, id)} /></Section>
      <Section id="horaires" title="Horaires et disponibilités"><DailyAvailabilityManager loadAction={actions.adminGetDay.bind(null, id)} saveAction={actions.adminSaveDay.bind(null, id)} blockAction={actions.adminBlockRange.bind(null, id)} bookingsHref="/admin/reservations" /><details className="rounded-xl border p-4"><summary className="min-h-11 cursor-pointer py-3 font-medium">Horaires habituels de la semaine</summary><WeeklyAvailabilityManager slots={slotsResult.data ?? []} addAction={actions.adminAddSlot.bind(null, id)} removeAction={actions.adminRemoveSlot.bind(null, id)} /></details>
        {!!exceptionsResult.data?.length && <div className="space-y-3"><h3 className="font-medium">Autres dates bloquées</h3>{exceptionsResult.data.map(exception => <div key={exception.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><span className="text-sm">{exception.date} {exception.reason}</span><ArtisanRemoveButton action={actions.adminRemoveException.bind(null, id, exception.id)} label="Débloquer" confirmation="Débloquer cette date ? Les réservations existantes seront conservées." /></div>)}</div>}
      </Section>
    </div>
  </div>;
}

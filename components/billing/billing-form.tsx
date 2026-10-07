"use client";
import { useState, useRef, type FormEvent, type ReactNode } from "react";
import { Download, Plus, Trash2, FileText, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { billingSchema, calculateTotals, eurosToCents, parisToday, type BillingDocument, type BillingIssuer } from "@/lib/billing/model";
import { formatPrice } from "@/lib/utils/format";
const inputClass = "h-11 w-full min-w-0 rounded-xl border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const areaClass = "w-full min-w-0 rounded-xl border border-input bg-white p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
type Line = { id: number; description: string; quantity: string; unit: BillingDocument["lines"][number]["unit"]; price: string; vatRate: number; duration: string };
const newLine = (id: number): Line => ({id,description:"",quantity:"1",unit:"forfait",price:"",vatRate:20,duration:""});
function Field({label,children,hint}: {label:string;children:ReactNode;hint?:string}) { return <label className="block min-w-0"><span className="mb-2 block text-sm font-medium">{label}</span>{children}{hint && <span className="mt-1.5 block text-xs leading-5 text-muted-foreground">{hint}</span>}</label>; }
function Section({title,children}: {title:string;children:ReactNode}) { return <section className="rounded-2xl border bg-white p-5 sm:p-6"><h2 className="mb-5 font-display text-lg font-semibold">{title}</h2>{children}</section>; }
export function BillingForm({issuer}: {issuer:BillingIssuer}) {
  const [kind,setKind] = useState<"quote"|"invoice">("quote");
  const [lines,setLines] = useState<Line[]>([newLine(1)]);
  const nextId = useRef(2);
  const [taxMode,setTaxMode] = useState<""|"vat"|"exempt">("");
  const [clientType,setClientType] = useState<"individual"|"business">("individual");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [success,setSuccess] = useState("");
  const [download,setDownload] = useState<{bytes:Uint8Array;name:string}|null>(null);
  const today = parisToday();
  const defaultDeadline = new Date(today+"T12:00:00Z"); defaultDeadline.setUTCDate(defaultDeadline.getUTCDate()+30);
  function updateLine(id:number, patch:Partial<Line>) { setLines(current=>current.map(line=>line.id===id?{...line,...patch}:line)); }
  const numericLines = lines.map(line=>({description:line.description,quantity:Number(line.quantity.replace(",",".")),unit:line.unit,unitPriceCents:eurosToCents(line.price),vatRate:(taxMode === "exempt" ? 0 : line.vatRate) as 0|5.5|10|20,duration:line.duration}));
  const validNumbers = numericLines.every(line=>Number.isFinite(line.quantity)&&line.quantity>0&&Number.isFinite(line.unitPriceCents));
  const totals = validNumbers ? calculateTotals({lines:numericLines,taxMode:taxMode || "vat"}) : null;
  function saveFile(bytes:Uint8Array,name:string) {
    const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:"application/pdf"}));
    const link=document.createElement("a");link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setError("");setSuccess("");setDownload(null);
    const data=new FormData(event.currentTarget);
    const value=(name:string)=>String(data.get(name) || "").trim();
    if(!taxMode){setError("Choisissez votre régime de TVA.");return;}
    const candidate={kind,number:value("number"),issuedOn:value("issuedOn"),serviceOn:value("serviceOn"),deadline:value("deadline"),issuerName:value("issuerName"),issuerAddress:value("issuerAddress"),issuerId:value("issuerId"),issuerEmail:value("issuerEmail"),issuerPhone:value("issuerPhone"),legalDetails:value("legalDetails"),vatNumber:value("vatNumber"),insurance:value("insurance"),clientName:value("clientName"),clientAddress:value("clientAddress"),clientEmail:value("clientEmail"),clientType,clientId:value("clientId"),clientVat:value("clientVat"),orderNumber:value("orderNumber"),workAddress:value("workAddress"),taxMode,paymentTerms:value("paymentTerms"),lateTerms:value("lateTerms"),notes:value("notes"),quoteFeeCents:kind==="quote"?eurosToCents(value("quoteFee")):0,lines:numericLines};
    const parsed=billingSchema.safeParse(candidate);
    if(!parsed.success){setError(parsed.error.issues.map(issue=>issue.message).filter((message,index,array)=>array.indexOf(message)===index).join(" "));return;}
    setBusy(true);
    try{
      const [module,fontResponse]=await Promise.all([import("@/lib/billing/pdf"),fetch("/fonts/NotoSans-Regular.ttf")]);
      if(!fontResponse.ok)throw new Error("Impossible de charger la police du PDF. Réessayez.");
      const bytes=await module.generateBillingPdf(parsed.data,new Uint8Array(await fontResponse.arrayBuffer()));
      const name=`${kind==="invoice"?"facture":"devis"}-${parsed.data.number.replace(/[^a-zA-Z0-9_-]/g,"-")}.pdf`;
      setDownload({bytes,name});saveFile(bytes,name);setSuccess("Votre PDF est prêt. Conservez le fichier téléchargé dans vos dossiers.");
    }catch(reason){setError(reason instanceof Error ? reason.message : "Impossible de générer le PDF.");}finally{setBusy(false);}
  }
  return <form onSubmit={submit} className="mt-8 space-y-6" onChange={()=>{setSuccess("");setDownload(null);}}>
    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Type de document">
      {[{value:"quote" as const,label:"Créer un devis",hint:"Présentez votre offre au client",icon:FileText},{value:"invoice" as const,label:"Créer une facture",hint:"Facturez vos prestations",icon:Receipt}].map(({value,label,hint,icon:Icon})=><button key={value} type="button" disabled={busy} aria-pressed={kind===value} onClick={()=>{setKind(value);setDownload(null);setError("");setSuccess("");}} className={`flex items-center gap-4 rounded-2xl border-2 p-5 text-left ${kind===value?"border-primary bg-primary/5":"border-border bg-white hover:border-primary/40"}`}><Icon aria-hidden="true" className="h-6 w-6 shrink-0 text-primary"/><span><span className="block font-semibold">{label}</span><span className="mt-1 block text-xs text-muted-foreground">{hint}</span></span></button>)}
    </div>
    <fieldset disabled={busy} className="min-w-0 space-y-6">
      <Section title="1. Votre entreprise"><div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom / raison sociale"><input className={inputClass} name="issuerName" required maxLength={200} defaultValue={issuer.name}/></Field>
        <Field label="SIREN ou SIRET"><input className={inputClass} name="issuerId" required inputMode="numeric" pattern="[0-9]{9}([0-9]{5})?" maxLength={14} defaultValue={issuer.id}/></Field>
        <Field label="Adresse professionnelle complète"><textarea className={areaClass} name="issuerAddress" required rows={2} maxLength={400} defaultValue={issuer.address}/></Field>
        <Field label="Statut et mentions de l’entreprise" hint="Ex. : EI, ou forme juridique, capital et immatriculation pour une société."><textarea className={areaClass} name="legalDetails" required rows={2} maxLength={600} placeholder="Renseignez les mentions de votre entreprise"/></Field>
        <Field label="Email professionnel"><input className={inputClass} name="issuerEmail" required type="email" defaultValue={issuer.email}/></Field>
        <Field label="Téléphone professionnel"><input className={inputClass} name="issuerPhone" required type="tel" maxLength={40} defaultValue={issuer.phone}/></Field>
        <Field label="Régime de TVA"><select className={inputClass} required value={taxMode} onChange={event=>setTaxMode(event.target.value as typeof taxMode)}><option value="">Choisir mon régime</option><option value="vat">TVA applicable</option><option value="exempt">Franchise en base — art. 293 B du CGI</option></select></Field>
        <Field label="Numéro de TVA intracommunautaire"><input className={inputClass} name="vatNumber" required={taxMode==="vat"} disabled={taxMode!=="vat"} maxLength={40}/></Field>
      </div><div className="mt-4"><Field label="Assurance professionnelle" hint="Nom et adresse de l’assureur, référence du contrat et couverture géographique des travaux."><textarea className={areaClass} name="insurance" required rows={2} maxLength={600}/></Field></div><p className="mt-4 text-xs text-muted-foreground">Les modifications saisies ici concernent uniquement ce document.</p></Section>
      <Section title="2. Votre client"><div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom du client / entreprise"><input className={inputClass} name="clientName" required maxLength={200}/></Field>
        <Field label="Type de client"><select className={inputClass} value={clientType} onChange={event=>setClientType(event.target.value as typeof clientType)}><option value="individual">Particulier</option><option value="business">Professionnel</option></select></Field>
        <Field label="Adresse de facturation complète"><textarea className={areaClass} name="clientAddress" required rows={2} maxLength={400}/></Field>
        <Field label="Email du client (facultatif)"><input className={inputClass} name="clientEmail" type="email"/></Field>
        {clientType==="business"&&<><Field label="SIREN ou SIRET du client"><input className={inputClass} name="clientId" required pattern="[0-9]{9}([0-9]{5})?" maxLength={14}/></Field><Field label="TVA du client (si applicable)"><input className={inputClass} name="clientVat" maxLength={40}/></Field></>}
        <Field label="Bon de commande (si existant)"><input className={inputClass} name="orderNumber" maxLength={80}/></Field>
        <Field label="Adresse des travaux (si différente)"><textarea className={areaClass} name="workAddress" rows={2} maxLength={400}/></Field>
      </div></Section>
      <Section title="3. Référence et dates"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field label={kind==="invoice"?"Numéro de facture":"Référence du devis"} hint={kind==="invoice"?"Suivez votre séquence comptable continue et unique.":"Ex. : DEV-2026-001"}><input className={inputClass} name="number" required maxLength={50} placeholder={kind==="invoice"?"FAC-2026-001":"DEV-2026-001"}/></Field>
        <Field label="Date du document"><input className={inputClass} name="issuedOn" required type="date" defaultValue={today}/></Field>
        <Field label={kind==="invoice"?"Date de prestation":"Début prévu des travaux"}><input className={inputClass} name="serviceOn" required type="date" defaultValue={today}/></Field>
        <Field label={kind==="invoice"?"Échéance de paiement":"Devis valable jusqu’au"}><input className={inputClass} name="deadline" required type="date" defaultValue={defaultDeadline.toISOString().slice(0,10)}/></Field>
      </div></Section>
      <Section title="4. Vos prestations"><div className="space-y-4">{lines.map((line,index)=><div key={line.id} className="rounded-2xl border bg-slate-50/70 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Prestation {index+1}</h3><button type="button" disabled={lines.length===1} onClick={()=>setLines(current=>current.filter(item=>item.id!==line.id))} aria-label={`Supprimer la prestation ${index+1}`} className="rounded-lg p-2 text-muted-foreground hover:bg-white hover:text-destructive disabled:opacity-30"><Trash2 aria-hidden="true" className="h-4 w-4"/></button></div>
        <Field label="Description"><textarea className={areaClass} required rows={2} maxLength={500} value={line.description} onChange={event=>updateLine(line.id,{description:event.target.value})} placeholder="Ex. : Remplacement d’un robinet, fourniture et pose"/></Field>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Field label="Quantité"><input className={inputClass} required type="number" min="0.001" max="100000" step="0.001" value={line.quantity} onChange={event=>updateLine(line.id,{quantity:event.target.value})}/></Field>
          <Field label="Unité"><select className={inputClass} value={line.unit} onChange={event=>updateLine(line.id,{unit:event.target.value as Line["unit"]})}>{["forfait","heure","unité","m²","mètre"].map(unit=><option key={unit}>{unit}</option>)}</select></Field>
          <Field label="Prix unitaire HT (€)"><input className={inputClass} required inputMode="decimal" value={line.price} onChange={event=>updateLine(line.id,{price:event.target.value})} placeholder="0,00"/></Field>
          <Field label="TVA"><select className={inputClass} disabled={taxMode!=="vat"} value={taxMode==="exempt"?0:line.vatRate} onChange={event=>updateLine(line.id,{vatRate:Number(event.target.value)})}>{[0,5.5,10,20].map(rate=><option key={rate} value={rate}>{rate} %</option>)}</select></Field>
          <Field label="Durée (facultatif)"><input className={inputClass} maxLength={100} value={line.duration} onChange={event=>updateLine(line.id,{duration:event.target.value})} placeholder="Ex. : 2 heures"/></Field>
        </div>
      </div>)}</div><Button type="button" variant="outline" disabled={lines.length>=50} className="mt-4 rounded-xl" onClick={()=>setLines(current=>[...current,newLine(nextId.current++)])}><Plus aria-hidden="true" className="mr-2 h-4 w-4"/>Ajouter une prestation</Button><p className="mt-3 text-xs text-muted-foreground">Pour une prestation horaire, choisissez « heure » et indiquez le nombre d’heures en quantité.</p></Section>
      <Section title="5. Conditions et informations"><div className="space-y-4">
        <Field label="Modalités de paiement et conditions"><textarea className={areaClass} name="paymentTerms" required rows={3} maxLength={600} placeholder="Mode de règlement, acompte éventuel, frais de déplacement inclus ou non, conditions de réalisation…"/></Field>
        <div className={kind==="invoice"&&clientType==="business"?"":"hidden"}><Field label="Pénalités de retard (client professionnel)"><textarea className={areaClass} name="lateTerms" required rows={2} maxLength={400} defaultValue="Pénalités de retard : trois fois le taux d’intérêt légal, exigibles à compter du lendemain de l’échéance."/></Field></div>
        {kind==="quote"&&<Field label="Coût d’établissement du devis (€ TTC)" hint="0 pour un devis gratuit. Ce montant est indiqué séparément du prix des travaux."><input className={inputClass} name="quoteFee" required inputMode="decimal" defaultValue="0"/></Field>}
        <Field label="Informations complémentaires (facultatif)"><textarea className={areaClass} name="notes" rows={3} maxLength={1500} placeholder="Détails du chantier, conditions complémentaires, coordonnées de paiement…"/></Field>
      </div></Section>
    </fieldset>
    <div className="rounded-2xl border bg-primary/5 p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-5"><div className="text-sm"><p>Total HT : <strong>{totals?formatPrice(totals.net):"—"}</strong></p><p className="mt-1">TVA : <strong>{totals?formatPrice(totals.tax):"—"}</strong></p><p className="mt-3 font-display text-2xl font-bold text-primary">Total TTC : {totals?formatPrice(totals.gross):"—"}</p></div><Button type="submit" disabled={busy} className="h-12 w-full rounded-xl px-6 sm:w-auto"><Download aria-hidden="true" className="mr-2 h-4 w-4"/>{busy?"Génération…":kind==="invoice"?"Générer la facture PDF":"Générer le devis PDF"}</Button></div>
      {error&&<p role="alert" className="mt-4 text-sm font-medium text-destructive">{error}</p>}{success&&<p role="status" className="mt-4 text-sm text-primary">{success}</p>}{download&&<button type="button" className="mt-3 text-sm font-semibold text-primary underline" onClick={()=>saveFile(download.bytes,download.name)}>Télécharger à nouveau le PDF</button>}
      <p className="mt-5 text-xs leading-5 text-muted-foreground">Les documents sont téléchargés sur votre appareil et ne sont pas archivés dans Plan B. Vérifiez les mentions propres à votre activité et conservez vos fichiers. Un PDF simple ne remplace pas une transmission via une plateforme agréée lorsque la facturation électronique est obligatoire.</p>
    </div>
  </form>;
}

import { PDFDocument, rgb, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { billingSchema, calculateTotals, type BillingDocument } from "./model";
const money = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} €`;
const dateLabel = (date: string) => date.split("-").reverse().join("/");
export async function generateBillingPdf(input: BillingDocument, fontBytes: Uint8Array) {
  const doc = billingSchema.parse(input);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const supported = new Set(font.getCharacterSet());
  const allText = JSON.stringify(doc);
  for (const char of allText) {
    if (!supported.has(char.codePointAt(0)!) && !/[\r\n\t]/.test(char)) throw new Error(`Le caractère « ${char} » n’est pas pris en charge par la police du PDF. Utilisez une transcription latine.`);
  }
  pdf.setTitle(`${doc.kind === "invoice" ? "Facture" : "Devis"} ${doc.number}`);
  pdf.setAuthor(doc.issuerName); pdf.setCreator("Plan B"); pdf.setLanguage("fr-FR");
  const teal = rgb(0.09, 0.3, 0.34), ink = rgb(0.16, 0.2, 0.22), muted = rgb(0.4, 0.45, 0.47);
  let page: PDFPage;
  let y = 0;
  function newPage() {
    page = pdf.addPage([595.28, 841.89]); y = 765;
    page.drawRectangle({ x: 0, y: 797, width: 595.28, height: 45, color: teal });
    page.drawText(`${doc.kind === "invoice" ? "FACTURE" : "DEVIS"} · ${doc.number}`, { x: 40, y: 813, font, size: 12, color: rgb(1,1,1) });
  }
  const widths = new Map<string, number>();
  function charWidth(char: string, size: number) {
    const key = `${char}:${size}`;
    if (!widths.has(key)) widths.set(key, font.widthOfTextAtSize(char, size));
    return widths.get(key)!;
  }
  function wrap(text: string, width: number, size: number) {
    const output: string[] = [];
    for (const paragraph of text.replace(/\r/g, "").split("\n")) {
      let line = ""; let lineWidth = 0;
      for (const word of paragraph.split(/(\s+)/)) {
        const wordWidth = Array.from(word).reduce((sum, char) => sum + charWidth(char, size), 0);
        if (line && lineWidth + wordWidth > width) { output.push(line.trimEnd()); line = ""; lineWidth = 0; }
        if (!line && /^\s+$/.test(word)) continue;
        for (const char of word) {
          if (line && lineWidth + charWidth(char, size) > width) { output.push(line.trimEnd()); line = ""; lineWidth = 0; }
          line += char; lineWidth += charWidth(char, size);
        }
      }
      output.push(line.trimEnd());
    }
    return output;
  }
  function text(value: string, size = 10, color = ink, x = 40, width = 515) {
    for (const line of wrap(value, width, size)) {
      if (y < 65) newPage();
      page.drawText(line, { x, y, font, size, color }); y -= size + 5;
    }
  }
  function heading(value: string) { if (y < 100) newPage(); y -= 12; text(value, 12, teal); y -= 3; }
  newPage();
  text(doc.issuerName, 19, teal);
  text(doc.issuerAddress); text(`SIREN / SIRET : ${doc.issuerId}`);
  text(`${doc.issuerEmail} · ${doc.issuerPhone}`);
  text(doc.legalDetails, 9, muted);
  if (doc.vatNumber) text(`TVA intracommunautaire : ${doc.vatNumber}`, 9, muted);
  heading("CLIENT"); text(doc.clientName, 12); text(doc.clientAddress);
  if (doc.clientEmail) text(doc.clientEmail);
  if (doc.clientType === "business") text(`SIREN / SIRET : ${doc.clientId}${doc.clientVat ? ` · TVA : ${doc.clientVat}` : ""}`);
  if (doc.orderNumber) text(`Bon de commande : ${doc.orderNumber}`);
  if (doc.workAddress) text(`Adresse des travaux : ${doc.workAddress}`);
  heading("DATES ET PRESTATIONS");
  text(`Émission : ${dateLabel(doc.issuedOn)} · ${doc.kind === "invoice" ? "Prestation réalisée le" : "Début prévu le"} : ${dateLabel(doc.serviceOn)}`);
  text(`${doc.kind === "invoice" ? "Échéance de paiement" : "Offre valable jusqu’au"} : ${dateLabel(doc.deadline)}`);
  const totals = calculateTotals(doc);
  doc.lines.forEach((line, index) => {
    const content = [`${index + 1}. ${line.description}`, `${line.quantity} ${line.unit} × ${money(line.unitPriceCents)} HT${line.duration ? ` · Durée : ${line.duration}` : ""}`, `TVA ${totals.lines[index].rate} % · Total HT : ${money(totals.lines[index].net)} · TTC : ${money(totals.lines[index].gross)}`];
    const blockHeight = content.reduce((sum, entry) => sum + wrap(entry,515,10).length * 15,0) + 13;
    if (y - Math.min(blockHeight, 650) < 65) newPage();
    y -= 8; content.forEach((entry, i) => text(entry,10,i === 0 ? ink : muted)); y -= 5;
  });
  heading("RÉCAPITULATIF"); text(`Total HT : ${money(totals.net)}`,12);
  const rates = [...new Set(totals.lines.map(line => line.rate))];
  rates.forEach(rate => text(`TVA ${rate} % : ${money(totals.lines.filter(line => line.rate === rate).reduce((sum,line)=>sum+line.tax,0))}`));
  text(`TOTAL TTC : ${money(totals.gross)}`,16,teal);
  if (doc.taxMode === "exempt") text("TVA non applicable, art. 293 B du CGI.",9);
  heading("CONDITIONS"); text(doc.paymentTerms,9);
  if (doc.kind === "invoice") {
    text("Escompte pour paiement anticipé : néant, sauf accord écrit contraire.",9);
    if (doc.clientType === "business") { text(doc.lateTerms,9); text("Indemnité forfaitaire pour frais de recouvrement en cas de retard : 40 € (client professionnel).",9); }
  } else {
    text(doc.quoteFeeCents === 0 ? "Devis gratuit." : `Coût d’établissement du devis : ${money(doc.quoteFeeCents)} TTC, distinct du prix des travaux.`,9);
    text("Acceptation : bon pour accord, date et signature du client. Les droits légaux du consommateur restent applicables.",9);
    y -= 25;
  }
  heading("ASSURANCE PROFESSIONNELLE"); text(doc.insurance,9);
  if (doc.notes) { heading("INFORMATIONS COMPLÉMENTAIRES"); text(doc.notes,9); }
  const pages = pdf.getPages();
  pages.forEach((p,i)=>{
    p.drawLine({start:{x:40,y:43},end:{x:555,y:43},thickness:0.5,color:rgb(0.85,0.88,0.89)});
    p.drawText(`${doc.kind === "invoice" ? "Facture" : "Devis"} ${doc.number} · Page ${i+1}/${pages.length}`,{x:40,y:27,font,size:8,color:muted});
  });
  return pdf.save();
}

import { PDFDocument, rgb, type PDFPage, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { PAYMENT_METHODS, billingSchema, calculateTotals, type BillingDocument } from "./model";
const money = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} €`;
const dateLabel = (date: string) => date.split("-").reverse().join("/");

export async function generateBillingPdf(input: BillingDocument, fontBytes: Uint8Array) {
  const doc = billingSchema.parse(input);
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const supported = new Set(font.getCharacterSet());
  for (const char of JSON.stringify(doc)) {
    if (!supported.has(char.codePointAt(0)!) && !/[\r\n\t]/.test(char)) throw new Error(`Le caractère « ${char} » n’est pas pris en charge par la police du PDF. Utilisez une transcription latine.`);
  }
  const title = doc.kind === "invoice" ? "Facture" : "Devis";
  pdf.setTitle(`${title} ${doc.number}`);
  pdf.setAuthor(doc.issuerName);
  pdf.setCreator("Plan B");
  pdf.setLanguage("fr-FR");

  const teal = rgb(0.09, 0.3, 0.34), ink = rgb(0.12, 0.19, 0.21), muted = rgb(0.39, 0.46, 0.48);
  const pale = rgb(0.94, 0.97, 0.97), light = rgb(0.97, 0.98, 0.98), lineColor = rgb(0.86, 0.90, 0.90), white = rgb(1, 1, 1);
  const widths = new Map<string, number>();
  let page: PDFPage;
  let y = 0;
  function charWidth(char: string, size: number) {
    const key = `${char}:${size}`;
    if (!widths.has(key)) widths.set(key, font.widthOfTextAtSize(char, size));
    return widths.get(key)!;
  }
  function wrap(value: string, width: number, size: number) {
    const output: string[] = [];
    for (const paragraph of value.replace(/\r/g, "").split("\n")) {
      let current = "", currentWidth = 0;
      for (const word of paragraph.split(/(\s+)/)) {
        const wordWidth = Array.from(word).reduce((sum, char) => sum + charWidth(char, size), 0);
        if (current && currentWidth + wordWidth > width) { output.push(current.trimEnd()); current = ""; currentWidth = 0; }
        if (!current && /^\s+$/.test(word)) continue;
        for (const char of word) {
          if (current && currentWidth + charWidth(char, size) > width) { output.push(current.trimEnd()); current = ""; currentWidth = 0; }
          current += char; currentWidth += charWidth(char, size);
        }
      }
      output.push(current.trimEnd());
    }
    return output;
  }
  function at(value: string, x: number, baseline: number, size = 9, color: RGB = ink) {
    page.drawText(value, { x, y: baseline, font, size, color });
  }
  function right(value: string, edge: number, baseline: number, size = 9, color: RGB = ink, width = 90) {
    const fitted = Math.min(size, size * width / Math.max(font.widthOfTextAtSize(value, size), 1));
    at(value, edge - font.widthOfTextAtSize(value, fitted), baseline, fitted, color);
  }
  function rounded(x: number, bottom: number, width: number, height: number, color: RGB, radius = 9) {
    page.drawRectangle({ x: x + radius, y: bottom, width: width - radius * 2, height, color });
    page.drawRectangle({ x, y: bottom + radius, width, height: height - radius * 2, color });
    for (const cx of [x + radius, x + width - radius]) for (const cy of [bottom + radius, bottom + height - radius]) page.drawCircle({ x: cx, y: cy, size: radius, color });
  }
  function newPage() {
    page = pdf.addPage([595.28, 841.89]);
    page.drawRectangle({ x: 0, y: 835.89, width: 595.28, height: 6, color: teal });
    at("DOCUMENT PROFESSIONNEL", 40, 794, 7, muted);
    const nameLines = wrap(doc.issuerName, 295, 18);
    nameLines.forEach((value, index) => at(value, 40, 767 - index * 24, 18, teal));
    right(title.toUpperCase(), 555, 784, 27, teal, 180);
    const referenceLines = wrap(doc.number, 180, 9);
    referenceLines.forEach((value, index) => right(value, 555, 761 - index * 13, 9, muted, 180));
    y = Math.min(767 - nameLines.length * 24, 748 - referenceLines.length * 13) - 15;
    page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.8, color: lineColor });
    y -= 22;
  }
  function ensure(height: number) { if (y - height < 65) newPage(); }
  function text(value: string, size = 9, color: RGB = muted) {
    for (const entry of wrap(value, 515, size)) { ensure(size + 5); at(entry, 40, y, size, color); y -= size + 5; }
  }
  function heading(value: string) { ensure(45); y -= 12; at(value, 40, y, 10, teal); y -= 21; }
  newPage();

  const issuer = [doc.issuerAddress, `SIREN / SIRET : ${doc.issuerId}`, doc.issuerEmail, doc.issuerPhone, ...(doc.vatNumber ? [`TVA : ${doc.vatNumber}`] : [])];
  const client = [doc.clientName, doc.clientAddress, ...(doc.clientEmail ? [doc.clientEmail] : []), ...(doc.clientType === "business" ? [`SIREN / SIRET : ${doc.clientId}`, ...(doc.clientVat ? [`TVA : ${doc.clientVat}`] : [])] : [])];
  const columnLines = (values: string[]) => values.flatMap(value => wrap(value, 222, 9));
  const issuerLines = columnLines(issuer), clientLines = columnLines(client);
  const panelHeight = Math.max(issuerLines.length, clientLines.length) * 14 + 43;
  ensure(panelHeight + 20);
  rounded(40, y - panelHeight, 250, panelHeight, light);
  rounded(305, y - panelHeight, 250, panelHeight, pale);
  at("ÉMETTEUR", 54, y - 23, 8, teal); at("CLIENT", 319, y - 23, 8, teal);
  issuerLines.forEach((value, index) => at(value, 54, y - 44 - index * 14, 9, muted));
  clientLines.forEach((value, index) => at(value, 319, y - 44 - index * 14, 9, index === 0 ? ink : muted));
  y -= panelHeight + 19;

  ensure(65);
  const dates = [
    { label: "DATE DU DOCUMENT", value: dateLabel(doc.issuedOn) },
    { label: doc.kind === "invoice" ? "PRESTATION RÉALISÉE" : "DÉBUT PRÉVU", value: dateLabel(doc.serviceOn) },
    { label: doc.kind === "invoice" ? "ÉCHÉANCE DE PAIEMENT" : "DEVIS VALABLE JUSQU’AU", value: dateLabel(doc.deadline) },
  ];
  dates.forEach((date, index) => { const x = 40 + index * 176; at(date.label, x, y - 8, 6.8, muted); at(date.value, x, y - 29, 11, ink); });
  y -= 57;

  const totals = calculateTotals(doc);
  function tableHeader() {
    ensure(44);
    rounded(40, y - 29, 515, 29, teal, 5);
    at("PRESTATION", 53, y - 18, 8, white);
    right("PRIX HT", 386, y - 18, 8, white, 70);
    right("TVA", 441, y - 18, 8, white, 45);
    right("TOTAL TTC", 542, y - 18, 8, white, 90);
    y -= 29;
  }
  tableHeader();
  doc.lines.forEach((item, index) => {
    const descriptions = wrap(`${index + 1}. ${item.description}`, 247, 9);
    const durationLines = item.duration ? wrap(`Durée : ${item.duration}`, 247, 8) : [];
    const height = Math.max(39, descriptions.length * 13 + durationLines.length * 12 + 19);
    if (y - height < 65) { newPage(); tableHeader(); }
    if (index % 2 === 0) page.drawRectangle({ x: 40, y: y - height, width: 515, height, color: light });
    let cursor = y - 18;
    descriptions.forEach(value => { at(value, 53, cursor, 9, ink); cursor -= 13; });
    durationLines.forEach(value => { at(value, 53, cursor, 8, muted); cursor -= 12; });
    right(money(item.priceCents), 386, y - 18, 9, ink, 70);
    right(`${totals.lines[index].rate} %`, 441, y - 18, 9, muted, 45);
    right(money(totals.lines[index].gross), 542, y - 18, 9, teal, 90);
    page.drawLine({ start: { x: 40, y: y - height }, end: { x: 555, y: y - height }, thickness: 0.5, color: lineColor });
    y -= height;
  });
  y -= 21;

  const rates = [...new Set(totals.lines.map(item => item.rate))];
  const summaryHeight = 98 + rates.length * 18;
  ensure(summaryHeight + 18);
  rounded(305, y - summaryHeight, 250, summaryHeight, pale);
  at("Total hors taxes", 320, y - 23, 9, muted); right(money(totals.net), 540, y - 23, 10, ink, 115);
  rates.forEach((rate, index) => { at(`TVA ${rate} %`, 320, y - 45 - index * 18, 9, muted); right(money(totals.lines.filter(item => item.rate === rate).reduce((sum, item) => sum + item.tax, 0)), 540, y - 45 - index * 18, 9, ink, 115); });
  const totalTop = y - summaryHeight + 51;
  rounded(305, y - summaryHeight, 250, 51, teal);
  at("TOTAL TTC", 320, totalTop - 30, 9, white);
  right(money(totals.gross), 540, totalTop - 32, 19, white, 139);
  at("MODE DE PAIEMENT", 40, y - 14, 7, muted);
  for (const [index, entry] of wrap(PAYMENT_METHODS[doc.paymentMethod], 230, 13).entries()) at(entry, 40, y - 36 - index * 18, 13, teal);
  if (doc.taxMode === "exempt") wrap("TVA non applicable, art. 293 B du CGI.", 230, 8).forEach((entry, index) => at(entry, 40, y - 70 - index * 12, 8, muted));
  y -= summaryHeight + 16;

  if (doc.notes) { heading("INFORMATIONS COMPLÉMENTAIRES"); text(doc.notes); }
  heading(doc.kind === "quote" ? "ACCEPTATION DU DEVIS" : "INFORMATIONS DE PAIEMENT");
  if (doc.kind === "invoice") {
    text("Escompte pour paiement anticipé : néant, sauf accord écrit contraire.", 8);
    if (doc.clientType === "business") { text(doc.lateTerms, 8); text("Indemnité forfaitaire pour frais de recouvrement en cas de retard : 40 € (client professionnel).", 8); }
  } else {
    text(doc.quoteFeeCents === 0 ? "Devis gratuit." : `Coût d’établissement du devis : ${money(doc.quoteFeeCents)} TTC, distinct du prix des travaux.`, 8);
    text("Bon pour accord. Les droits légaux du consommateur restent applicables.", 8);
    ensure(69);
    rounded(40, y - 61, 515, 61, light);
    at("Date et lieu", 54, y - 20, 8, muted); at("Signature du client", 319, y - 20, 8, muted);
    y -= 75;
  }
  const pages = pdf.getPages();
  pages.forEach((p, index) => {
    page = p;
    p.drawLine({ start: { x: 40, y: 43 }, end: { x: 555, y: 43 }, thickness: 0.5, color: lineColor });
    const footer = `${title} ${doc.number} · Page ${index + 1}/${pages.length}`;
    const footerSize = Math.min(7, 7 * 410 / Math.max(font.widthOfTextAtSize(footer, 7), 1));
    at(footer, 40, 27, footerSize, muted);
    right("Créé avec Plan B", 555, 27, 7, muted, 90);
  });
  return pdf.save();
}

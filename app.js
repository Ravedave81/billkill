const UNTERNEHMEN = {
  name: "Wohnzeit-Köln",
  inhaber: "Sarah und David Brand",
  strasse: "Murgweg 2",
  plz: "51061",
  ort: "Köln",
  telefon: "+49 163 4734664",
  telefonUri: "+491634734664",
  email: "brand-wohnzeit-koeln@gmx.de",
  bank: "Kreissparkasse Köln",
  iban: "DE96 3705 0299 0000 7168 73",
  bic: "COKSDE33XXX",
  steuernummer: "218/5025/7499"
}

let nachtIndex = 0

function nachtHinzufuegen(){

nachtIndex++

let html = `
<div class="nacht">
<label>Nächte</label>
<input type="number" class="nachtAnzahl" value="1">
<label>Preis pro Nacht (€)</label>
<input type="number" class="nachtPreis" value="195">
<button onclick="this.parentElement.remove()">entfernen</button>
</div>
`

document.getElementById("nachtListe").insertAdjacentHTML("beforeend", html)

}

function formatDatum(datum){
if(!datum) return ""
let d = new Date(datum)
let tag = String(d.getDate()).padStart(2,"0")
let monat = String(d.getMonth()+1).padStart(2,"0")
let jahr = d.getFullYear()
return tag + "." + monat + "." + jahr
}

function formatISO(datum){
if(!datum) return ""
let d = new Date(datum)
return d.toISOString().split("T")[0]
}

function esc(text){
return String(text ?? "")
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;")
.replaceAll("'", "&apos;")
}

function extrahiereNachname(name){
let ersteZeile = String(name ?? "").split(/\r?\n/)[0].trim()
if(!ersteZeile) return ""
let teile = ersteZeile
.replace(/^(Herrn?|Frau|Familie)\s+/i, "")
.replaceAll(",", " ")
.split(/\s+/)
.filter(Boolean)
return teile.at(-1) || ""
}

function erstelleAnrede(anrede, name){
let nachname = extrahiereNachname(name)
if(anrede === "Sehr geehrte Frau"){
return nachname ? `Sehr geehrte Frau ${nachname}` : "Sehr geehrte Frau"
}
if(anrede === "Sehr geehrter Herr"){
return nachname ? `Sehr geehrter Herr ${nachname}` : "Sehr geehrter Herr"
}
return "Sehr geehrte Damen und Herren"
}

function erstelleBuchungstext(anreise, abreise){
let start = formatDatum(anreise) || "xx"
let ende = formatDatum(abreise) || "xx"
return `vielen Dank für die Hausbuchung in der Zeit vom ${start} bis ${ende} und Ihr Vertrauen.`
}

function berechneNaechte(){

let anreise = document.getElementById("anreise").value
let abreise = document.getElementById("abreise").value

if(!anreise || !abreise) return

let start = new Date(anreise)
let ende = new Date(abreise)

let diff = ende - start
let naechte = diff / (1000 * 60 * 60 * 24)

let ersteNacht = document.querySelector(".nachtAnzahl")

if(ersteNacht){
ersteNacht.value = naechte
}

}

function sammleRechnungsDaten(){
let anzahlFelder = document.querySelectorAll(".nachtAnzahl")
let preisFelder = document.querySelectorAll(".nachtPreis")
let positionen = []
let bruttoUebernachtung = 0

for(let i=0;i<anzahlFelder.length;i++){
let anzahl = Number(anzahlFelder[i].value)
let preis = Number(preisFelder[i].value)
let sum = anzahl * preis
if(anzahl > 0 && preis > 0){
bruttoUebernachtung += sum
positionen.push({
position: positionen.length + 1,
beschreibung: `${anzahl}x Übernachtung ohne Verpflegung`,
preis,
summe: sum,
anzahl
})
}
}

let sonderAnzahl = Number(document.getElementById("sonderNaechte")?.value || 0)
let sonderPreis = Number(document.getElementById("sonderPreis")?.value || 0)
let sonderSumme = sonderAnzahl * sonderPreis
if(sonderAnzahl > 0 && sonderPreis > 0){
bruttoUebernachtung += sonderSumme
positionen.push({
position: positionen.length + 1,
beschreibung: `${sonderAnzahl}x Übernachtung zu Sonderkondition`,
preis: sonderPreis,
summe: sonderSumme,
anzahl: sonderAnzahl
})
}

let haustier = Number(document.getElementById("haustier").value)
let reinigung = Number(document.getElementById("reinigung").value)
if(haustier>0){
positionen.push({ position: "", beschreibung: "Haustier", preis: 0, summe: haustier, anzahl: 1 })
}
if(reinigung>0){
positionen.push({ position: "", beschreibung: "Endreinigung", preis: 0, summe: reinigung, anzahl: 1 })
}

let kultur = bruttoUebernachtung * 0.05
let zwischensumme = bruttoUebernachtung + haustier + reinigung + kultur
let mwst = zwischensumme * 0.07
let netto = zwischensumme - mwst
let gesamt = zwischensumme

return {
rechnung: document.getElementById("rechnungsnummer").value,
datum: document.getElementById("datum").value,
anrede: document.getElementById("anrede").value,
name: document.getElementById("name").value,
adresse: document.getElementById("adresse").value,
anreise: document.getElementById("anreise").value,
abreise: document.getElementById("abreise").value,
positionen,
kultur,
mwst,
netto,
gesamt,
unternehmen: UNTERNEHMEN
}
}

function berechnen(){
let daten = sammleRechnungsDaten()

let posHTML = ""
daten.positionen.forEach((p) => {
posHTML += `
<tr>
<td>${p.position || ""}</td>
<td>${esc(p.beschreibung)}</td>
<td style="text-align:right;white-space:nowrap">${p.preis ? p.preis.toFixed(2) + "&nbsp;Euro" : ""}</td>
<td style="text-align:right;white-space:nowrap">${p.summe.toFixed(2)}&nbsp;Euro</td>
</tr>
`
})

document.getElementById("positionen").innerHTML = posHTML

document.getElementById("kultur").innerHTML = daten.kultur.toFixed(2)+"&nbsp;Euro"
document.getElementById("mwst").innerHTML = daten.mwst.toFixed(2)+"&nbsp;Euro"
document.getElementById("netto").innerHTML = daten.netto.toFixed(2)+"&nbsp;Euro"
document.getElementById("gesamt").innerHTML = daten.gesamt.toFixed(2)+"&nbsp;Euro"

document.getElementById("zeitraum").innerText =
formatDatum(daten.anreise) + "–" + formatDatum(daten.abreise)

document.getElementById("r_nummer").innerText = daten.rechnung

document.getElementById("r_datum").innerText = formatDatum(daten.datum)

document.getElementById("kundeAdresse").innerHTML =
esc(daten.name) + "<br>" + esc(daten.adresse).replaceAll("\n", "<br>")

document.getElementById("anredeText").innerText = erstelleAnrede(daten.anrede, daten.name) + ","
document.getElementById("buchungsDankText").innerText = erstelleBuchungstext(daten.anreise, daten.abreise)
}

function downloadDatei(inhalt, dateiname, mimeType){
const blob = new Blob([inhalt], { type: mimeType })
const url = URL.createObjectURL(blob)
const a = document.createElement("a")
a.href = url
a.download = dateiname
a.click()
URL.revokeObjectURL(url)
}

function zugferdXMLInhalt(){
const d = sammleRechnungsDaten()
const u = d.unternehmen
const positionenXml = d.positionen.map((p, idx) => `
<ram:IncludedSupplyChainTradeLineItem>
  <ram:AssociatedDocumentLineDocument><ram:LineID>${idx + 1}</ram:LineID></ram:AssociatedDocumentLineDocument>
  <ram:SpecifiedTradeProduct><ram:Name>${esc(p.beschreibung)}</ram:Name></ram:SpecifiedTradeProduct>
  <ram:SpecifiedLineTradeAgreement><ram:GrossPriceProductTradePrice><ram:ChargeAmount>${p.summe.toFixed(2)}</ram:ChargeAmount></ram:GrossPriceProductTradePrice></ram:SpecifiedLineTradeAgreement>
  <ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="C62">${p.anzahl || 1}</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>
  <ram:SpecifiedLineTradeSettlement>
    <ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>S</ram:CategoryCode><ram:RateApplicablePercent>7</ram:RateApplicablePercent></ram:ApplicableTradeTax>
    <ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>${p.summe.toFixed(2)}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>
  </ram:SpecifiedLineTradeSettlement>
</ram:IncludedSupplyChainTradeLineItem>`).join("\n")

return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext><ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>urn:factur-x.eu:1p0:basicwl</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter></rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${esc(d.rechnung)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">${formatISO(d.datum).replaceAll("-", "")}</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    ${positionenXml}
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${esc(u.name)}</ram:Name>
        <ram:PostalTradeAddress><ram:PostcodeCode>${esc(u.plz)}</ram:PostcodeCode><ram:LineOne>${esc(u.strasse)}</ram:LineOne><ram:CityName>${esc(u.ort)}</ram:CityName><ram:CountryID>DE</ram:CountryID></ram:PostalTradeAddress>
        <ram:URIUniversalCommunication><ram:URIID schemeID="EM">${esc(u.email)}</ram:URIID></ram:URIUniversalCommunication>
        <ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${esc(u.steuernummer)}</ram:ID></ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty><ram:Name>${esc(d.name)}</ram:Name></ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:PaymentReference>${esc(d.rechnung)}</ram:PaymentReference>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementPaymentMeans><ram:TypeCode>58</ram:TypeCode><ram:PayeePartyCreditorFinancialAccount><ram:IBANID>${esc(u.iban.replaceAll(" ", ""))}</ram:IBANID></ram:PayeePartyCreditorFinancialAccount><ram:PayeeSpecifiedCreditorFinancialInstitution><ram:BICID>${esc(u.bic)}</ram:BICID><ram:Name>${esc(u.bank)}</ram:Name></ram:PayeeSpecifiedCreditorFinancialInstitution></ram:SpecifiedTradeSettlementPaymentMeans>
      <ram:ApplicableTradeTax><ram:CalculatedAmount>${d.mwst.toFixed(2)}</ram:CalculatedAmount><ram:TypeCode>VAT</ram:TypeCode><ram:BasisAmount>${d.netto.toFixed(2)}</ram:BasisAmount><ram:CategoryCode>S</ram:CategoryCode><ram:RateApplicablePercent>7</ram:RateApplicablePercent></ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation><ram:LineTotalAmount>${d.netto.toFixed(2)}</ram:LineTotalAmount><ram:TaxBasisTotalAmount>${d.netto.toFixed(2)}</ram:TaxBasisTotalAmount><ram:TaxTotalAmount>${d.mwst.toFixed(2)}</ram:TaxTotalAmount><ram:GrandTotalAmount>${d.gesamt.toFixed(2)}</ram:GrandTotalAmount><ram:DuePayableAmount>${d.gesamt.toFixed(2)}</ram:DuePayableAmount></ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`
}

function erstelleZugferdXML(){
const d = sammleRechnungsDaten()
downloadDatei(zugferdXMLInhalt(), `zugferd-${d.rechnung || "rechnung"}.xml`, "application/xml")
}

function zeichneText(page, text, x, y, options){
const { font, size, color, maxWidth, lineHeight } = options
const words = String(text || "").split(/\s+/)
let line = ""
let currentY = y
for(const word of words){
const testLine = line ? `${line} ${word}` : word
const width = font.widthOfTextAtSize(testLine, size)
if(maxWidth && width > maxWidth && line){
page.drawText(line, { x, y: currentY, size, font, color })
currentY -= lineHeight
line = word
}else{
line = testLine
}
}
if(line){
page.drawText(line, { x, y: currentY, size, font, color })
currentY -= lineHeight
}
return currentY
}

async function erstelleZugferdPDF(){
if(!window.PDFLib){
alert("Die PDF-Bibliothek konnte nicht geladen werden. Bitte Internetverbindung prüfen und erneut versuchen.")
return
}

berechnen()
const d = sammleRechnungsDaten()
const u = d.unternehmen
const xml = zugferdXMLInhalt()
const { PDFDocument, StandardFonts, rgb } = PDFLib
const pdfDoc = await PDFDocument.create()
pdfDoc.setTitle(`Rechnung ${d.rechnung || ""}`.trim())
pdfDoc.setAuthor(u.name)
pdfDoc.setSubject("ZUGFeRD-Rechnung mit eingebetteter XML")
pdfDoc.setCreator("Wohnzeit-Köln Rechnungsapp")
pdfDoc.setProducer("pdf-lib")
pdfDoc.setKeywords(["ZUGFeRD", "Factur-X", "Rechnung"])

const page = pdfDoc.addPage([595.28, 841.89])
const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
const black  = rgb(0, 0, 0)
const blue   = rgb(0, 0.529, 0.784)   // #0087c8
const white  = rgb(1, 1, 1)
const grey   = rgb(0.831, 0.831, 0.831) // Trennlinien

// ── Seitenmaße ──
const W = 595.28
const H = 841.89
const marginL = 56
const marginR = W - 56
const colW = marginR - marginL   // 483

// ── Absender oben links (blau, fett) ──
page.drawText(`${u.name}, ${u.strasse}, ${u.plz} ${u.ort}`, {
  x: marginL, y: H - 50, size: 9, font: bold, color: blue
})

// ── RECHNUNG – großes blaues Wort oben rechts ──
const titelText = "RECHNUNG"
const titelSize = 28
const titelW = bold.widthOfTextAtSize(titelText, titelSize)
page.drawText(titelText, {
  x: marginR - titelW, y: H - 50, size: titelSize, font: bold, color: blue
})

// ── Rechnungsnummer + Datum rechts, tabelliert ──
const labelX = 330
const valueX = 448
let metaY = H - 90
const metaLines = [
  ["Rechnungsnummer:", d.rechnung || ""],
  ["Rechnungsdatum:",  formatDatum(d.datum)],
]
if(d.anreise && d.abreise){
  metaLines.push(["Mietzeitraum:", `${formatDatum(d.anreise)}–${formatDatum(d.abreise)}`])
}
for(const [label, value] of metaLines){
  if(label) page.drawText(label, { x: labelX, y: metaY, size: 10, font: bold, color: black })
  page.drawText(value, { x: valueX, y: metaY, size: 10, font, color: black })
  metaY -= 15
}

// ── Absender-Unterzeile (klein, unterstrichen wirkend via separatem Text) ──
const senderLineY = H - 115
page.drawText(`${u.name} ${u.strasse}, ${u.plz} ${u.ort}`, {
  x: marginL, y: senderLineY, size: 7, font, color: rgb(0.4,0.4,0.4)
})

// ── Kunden-Adresse ──
let addrY = senderLineY - 16
const addrLines = [d.name, ...String(d.adresse || "").split(/\r?\n/)].filter(Boolean)
for(const line of addrLines){
  page.drawText(line, { x: marginL, y: addrY, size: 11, font, color: black })
  addrY -= 15
}

// ── Datum unten rechts im Kunden-Block ──
const datumRechtsY = H - 155
const datumStr = formatDatum(d.datum)
const datumW = font.widthOfTextAtSize(datumStr, 10)
page.drawText(datumStr, { x: marginR - datumW, y: datumRechtsY, size: 10, font, color: black })

// ── Anschreiben ──
let textY = H - 225
const anredeStr = erstelleAnrede(d.anrede, d.name) + ","
page.drawText(anredeStr, { x: marginL, y: textY, size: 11, font, color: black })
textY -= 18
textY = zeichneText(page, erstelleBuchungstext(d.anreise, d.abreise), marginL, textY,
  { font, size: 11, color: black, maxWidth: colW, lineHeight: 15 })
textY -= 4
textY = zeichneText(page, "Hiermit erlauben wir uns die folgenden Leistungen in Rechnung zu stellen:",
  marginL, textY, { font, size: 11, color: black, maxWidth: colW, lineHeight: 15 })
textY -= 18

// ── Tabellen-Kopf (blau) ──
const rowH = 22
const colPos  = marginL
const colDesc = marginL + 52
const colBrutto = marginR - 160
const colGesamt  = marginR - 60

page.drawRectangle({ x: marginL, y: textY - 6, width: colW, height: rowH, color: blue })
page.drawText("Pos.",        { x: colPos  + 4, y: textY + 2, size: 9, font: bold, color: white })
page.drawText("Beschreibung",{ x: colDesc + 4, y: textY + 2, size: 9, font: bold, color: white })
page.drawText("Bruttopreis", { x: colBrutto,   y: textY + 2, size: 9, font: bold, color: white })
page.drawText("Gesamtpreis", { x: colGesamt,   y: textY + 2, size: 9, font: bold, color: white })
textY -= rowH

// ── Positions-Zeilen ──
d.positionen.forEach((p) => {
  const posStr   = String(p.position || "")
  const descStr  = p.beschreibung
  const brutStr  = p.preis ? `${p.preis.toFixed(2)} Euro` : ""
  const gestStr  = `${p.summe.toFixed(2)} Euro`

  page.drawText(posStr,  { x: colPos  + 4, y: textY, size: 10, font, color: black })
  page.drawText(descStr, { x: colDesc + 4, y: textY, size: 10, font, color: black })
  if(brutStr){
    const bw = font.widthOfTextAtSize(brutStr, 10)
    page.drawText(brutStr, { x: colBrutto + 60 - bw, y: textY, size: 10, font, color: black })
  }
  const gw = font.widthOfTextAtSize(gestStr, 10)
  page.drawText(gestStr, { x: colGesamt + 60 - gw, y: textY, size: 10, font, color: black })
  page.drawLine({ start: { x: marginL, y: textY - 7 }, end: { x: marginR, y: textY - 7 },
    thickness: 0.5, color: grey })
  textY -= rowH
})

// ── Kulturförderabgabe als Extra-Zeile in der Tabelle ──
const kultStr = `${d.kultur.toFixed(2)} Euro`
page.drawText("Kulturförderabgabe der Stadt Köln", { x: colDesc + 4, y: textY, size: 10, font, color: black })
const kultW = font.widthOfTextAtSize(kultStr, 10)
page.drawText(kultStr, { x: colGesamt + 60 - kultW, y: textY, size: 10, font, color: black })
page.drawLine({ start: { x: marginL, y: textY - 7 }, end: { x: marginR, y: textY - 7 },
  thickness: 0.5, color: grey })
textY -= rowH

// ── Summenblock rechts ──
textY -= 6
const mwstStr  = `${d.mwst.toFixed(2)} Euro`
const nettoStr = `${d.netto.toFixed(2)} Euro`
const gesamtStr = `${d.gesamt.toFixed(2)} Euro`
const sumLabelX = 310

const mwstLabel = "7 % UST inkl."
const mwstW = bold.widthOfTextAtSize(mwstLabel, 10)
page.drawText(mwstLabel, { x: sumLabelX, y: textY, size: 10, font: bold, color: black })
const mwstVW = bold.widthOfTextAtSize(mwstStr, 10)
page.drawText(mwstStr, { x: marginR - mwstVW, y: textY, size: 10, font: bold, color: black })
textY -= 16

page.drawText("Netto", { x: sumLabelX, y: textY, size: 10, font, color: black })
const nettoVW = font.widthOfTextAtSize(nettoStr, 10)
page.drawText(nettoStr, { x: marginR - nettoVW, y: textY, size: 10, font, color: black })
textY -= 20

// Gesamtsumme: blauer Balken
const gesamtBoxH = 20
page.drawRectangle({ x: sumLabelX - 4, y: textY - 4, width: marginR - sumLabelX + 8, height: gesamtBoxH, color: blue })
page.drawText("Gesamtsumme", { x: sumLabelX, y: textY + 2, size: 11, font: bold, color: white })
const gesamtVW = bold.widthOfTextAtSize(gesamtStr, 11)
page.drawText(gesamtStr, { x: marginR - gesamtVW, y: textY + 2, size: 11, font: bold, color: white })
textY -= 30

// ── Zahlungsbedingungen ──
page.drawText("Zahlungsbedingungen: Zahlung per sofort und ohne Abzüge.", {
  x: marginL, y: textY, size: 9, font, color: black
})
textY -= 40

// ── Schlusstext ──
page.drawText("Bei Rückfragen stehen wir selbstverständlich jederzeit gerne zur Verfügung.", {
  x: marginL, y: textY, size: 12, font, color: black
})
textY -= 26
page.drawText("Mit freundlichen Grüßen", { x: marginL, y: textY, size: 12, font, color: black })
textY -= 26
page.drawText("Sarah und David Brand", { x: marginL, y: textY, size: 12, font, color: black })

// ── Fußzeile: dicker blauer Balken + 3 Kreis-Symbole + 4 Datenspalten ──
// 4 gleiche Spalten: Breite colW/4 je, Mittelpunkte bei 1/8, 3/8, 5/8, 7/8 von colW
const footerLineY = 105
const colWFoot = colW  // = marginR - marginL = 483
const colWPart = colWFoot / 4  // ≈ 120.75

// Mittelpunkte der ersten 3 Spalten (x-absolut)
const sym1X = marginL + colWPart * 0.5
const sym2X = marginL + colWPart * 1.5
const sym3X = marginL + colWPart * 2.5

// Blauer horizontaler Balken
page.drawLine({
  start: { x: marginL, y: footerLineY },
  end:   { x: marginR, y: footerLineY },
  thickness: 3, color: blue
})

// ── Helfer: Kreis zeichnen (via drawEllipse falls verfügbar, sonst Bézier-Näherung) ──
function drawCircle(pg, cx, cy, r, strokeColor, strokeWidth) {
  // Bézier-Annäherung für Kreis: 4 Kurven mit κ≈0.5523
  const k = 0.5523 * r
  pg.drawBezierCurve({ start:{x:cx,y:cy+r}, startControl:{x:cx+k,y:cy+r}, endControl:{x:cx+r,y:cy+k}, end:{x:cx+r,y:cy}, thickness:strokeWidth, color:strokeColor, borderColor:strokeColor })
  pg.drawBezierCurve({ start:{x:cx+r,y:cy}, startControl:{x:cx+r,y:cy-k}, endControl:{x:cx+k,y:cy-r}, end:{x:cx,y:cy-r}, thickness:strokeWidth, color:strokeColor, borderColor:strokeColor })
  pg.drawBezierCurve({ start:{x:cx,y:cy-r}, startControl:{x:cx-k,y:cy-r}, endControl:{x:cx-r,y:cy-k}, end:{x:cx-r,y:cy}, thickness:strokeWidth, color:strokeColor, borderColor:strokeColor })
  pg.drawBezierCurve({ start:{x:cx-r,y:cy}, startControl:{x:cx-r,y:cy+k}, endControl:{x:cx-k,y:cy+r}, end:{x:cx,y:cy+r}, thickness:strokeWidth, color:strokeColor, borderColor:strokeColor })
}

const iconR = 13    // Radius der Kreise
const iconY = footerLineY + 22  // Mitte der Icons oberhalb der Linie

// Symbol 1: Haus (△ + Rechteck) in Kreis
const h1x = sym1X, h1y = iconY
drawCircle(page, h1x, h1y, iconR, blue, 1)
// Dach: Dreieck
page.drawLine({ start:{x:h1x-7,y:h1y+2}, end:{x:h1x,y:h1y+9},   thickness:1.2, color:blue })
page.drawLine({ start:{x:h1x,y:h1y+9},   end:{x:h1x+7,y:h1y+2}, thickness:1.2, color:blue })
// Wände: Rechteck
page.drawRectangle({ x:h1x-5, y:h1y-5, width:10, height:7, borderColor:blue, borderWidth:1.2, color:white })
// Tür: kleines Rechteck
page.drawRectangle({ x:h1x-2, y:h1y-5, width:4, height:5, borderColor:blue, borderWidth:1, color:white })

// Symbol 2: Briefkasten/Liste in Kreis
const h2x = sym2X, h2y = iconY
drawCircle(page, h2x, h2y, iconR, blue, 1)
// Äußeres Rechteck
page.drawRectangle({ x:h2x-7, y:h2y-6, width:14, height:13, borderColor:blue, borderWidth:1.2, color:white })
// Kleine Box links oben
page.drawRectangle({ x:h2x-6, y:h2y+2, width:4, height:4, borderColor:blue, borderWidth:1, color:white })
// Linien rechts
page.drawLine({ start:{x:h2x-1,y:h2y+5}, end:{x:h2x+6,y:h2y+5}, thickness:1, color:blue })
page.drawLine({ start:{x:h2x-1,y:h2y+3}, end:{x:h2x+6,y:h2y+3}, thickness:1, color:blue })
// Untere Linien
page.drawLine({ start:{x:h2x-6,y:h2y-1}, end:{x:h2x+6,y:h2y-1}, thickness:1, color:blue })
page.drawLine({ start:{x:h2x-6,y:h2y-4}, end:{x:h2x+6,y:h2y-4}, thickness:1, color:blue })

// Symbol 3: Dollar/Münze in Kreis
const h3x = sym3X, h3y = iconY
drawCircle(page, h3x, h3y, iconR, blue, 1)
// Innerer Kreis
drawCircle(page, h3x, h3y, 7, blue, 1)
// $ Zeichen
page.drawText("$", { x:h3x-3, y:h3y-4, size:9, font:bold, color:blue })

// ── 4 Datenspalten (Texte) ──
const footerTextY = footerLineY - 14
const col1X = marginL + 4
const col2X = marginL + colWPart + 4
const col3X = marginL + colWPart * 2 + 4
const col4X = marginL + colWPart * 3 + 4

// Spalte 1
page.drawText(u.name,                         { x: col1X, y: footerTextY,      size: 8, font, color: black })
page.drawText(u.strasse,                       { x: col1X, y: footerTextY - 10, size: 8, font, color: black })
page.drawText(`${u.plz} ${u.ort}`,            { x: col1X, y: footerTextY - 20, size: 8, font, color: black })
page.drawText(u.inhaber,                       { x: col1X, y: footerTextY - 30, size: 8, font, color: black })

// Spalte 2
page.drawText(u.telefon,                       { x: col2X, y: footerTextY - 5,  size: 8, font, color: black })
page.drawText(u.email,                         { x: col2X, y: footerTextY - 16, size: 8, font, color: black })

// Spalte 3
page.drawText(u.bank,                          { x: col3X, y: footerTextY,      size: 8, font, color: black })
page.drawText(u.iban,                          { x: col3X, y: footerTextY - 10, size: 8, font, color: black })
page.drawText(`BIC: ${u.bic}`,                { x: col3X, y: footerTextY - 20, size: 8, font, color: black })

// Spalte 4
page.drawText("Steuernr.",                     { x: col4X, y: footerTextY,      size: 8, font, color: black })
page.drawText(u.steuernummer,                  { x: col4X, y: footerTextY - 10, size: 8, font, color: black })


// ── ZUGFeRD-XML einbetten ──
await pdfDoc.attach(new TextEncoder().encode(xml), "factur-x.xml", {
  mimeType: "application/xml",
  description: "ZUGFeRD Rechnungsdaten",
  creationDate: new Date(),
  modificationDate: new Date()
})

const pdfBytes = await pdfDoc.save()
downloadDatei(pdfBytes, `zugferd-${d.rechnung || "rechnung"}.pdf`, "application/pdf")
}

function erstelleXRechnungXML(){
const d = sammleRechnungsDaten()
const u = d.unternehmen
const lines = d.positionen.map((p, idx) => `
<cac:InvoiceLine>
  <cbc:ID>${idx + 1}</cbc:ID>
  <cbc:InvoicedQuantity unitCode="C62">${p.anzahl || 1}</cbc:InvoicedQuantity>
  <cbc:LineExtensionAmount currencyID="EUR">${p.summe.toFixed(2)}</cbc:LineExtensionAmount>
  <cac:Item><cbc:Name>${esc(p.beschreibung)}</cbc:Name></cac:Item>
  <cac:Price><cbc:PriceAmount currencyID="EUR">${(p.preis || p.summe).toFixed(2)}</cbc:PriceAmount></cac:Price>
</cac:InvoiceLine>`).join("\n")

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xeinkauf.de:kosit:xrechnung_3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${esc(d.rechnung)}</cbc:ID>
  <cbc:IssueDate>${formatISO(d.datum)}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty><cac:Party><cac:PartyName><cbc:Name>${esc(u.name)}</cbc:Name></cac:PartyName><cac:PostalAddress><cbc:StreetName>${esc(u.strasse)}</cbc:StreetName><cbc:CityName>${esc(u.ort)}</cbc:CityName><cbc:PostalZone>${esc(u.plz)}</cbc:PostalZone><cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country></cac:PostalAddress><cac:PartyTaxScheme><cbc:CompanyID>${esc(u.steuernummer)}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme><cac:Contact><cbc:Name>${esc(u.inhaber)}</cbc:Name><cbc:Telephone>${esc(u.telefon)}</cbc:Telephone><cbc:ElectronicMail>${esc(u.email)}</cbc:ElectronicMail></cac:Contact></cac:Party></cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty><cac:Party><cac:PartyName><cbc:Name>${esc(d.name)}</cbc:Name></cac:PartyName></cac:Party></cac:AccountingCustomerParty>
  <cac:PaymentMeans><cbc:PaymentMeansCode>58</cbc:PaymentMeansCode><cac:PayeeFinancialAccount><cbc:ID>${esc(u.iban.replaceAll(" ", ""))}</cbc:ID><cbc:Name>${esc(u.bank)}</cbc:Name><cac:FinancialInstitutionBranch><cbc:ID>${esc(u.bic)}</cbc:ID></cac:FinancialInstitutionBranch></cac:PayeeFinancialAccount></cac:PaymentMeans>
  <cac:TaxTotal><cbc:TaxAmount currencyID="EUR">${d.mwst.toFixed(2)}</cbc:TaxAmount></cac:TaxTotal>
  <cac:LegalMonetaryTotal><cbc:TaxExclusiveAmount currencyID="EUR">${d.netto.toFixed(2)}</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="EUR">${d.gesamt.toFixed(2)}</cbc:TaxInclusiveAmount><cbc:PayableAmount currencyID="EUR">${d.gesamt.toFixed(2)}</cbc:PayableAmount></cac:LegalMonetaryTotal>
  ${lines}
</Invoice>`

downloadDatei(xml, `xrechnung-${d.rechnung || "rechnung"}.xml`, "application/xml")
}

window.onload = function(){
nachtHinzufuegen()
}

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
<td>${p.preis ? p.preis.toFixed(2) + " €" : ""}</td>
<td>${p.summe.toFixed(2)} €</td>
</tr>
`
})

document.getElementById("positionen").innerHTML = posHTML

document.getElementById("kultur").innerText = daten.kultur.toFixed(2)+" €"
document.getElementById("mwst").innerText = daten.mwst.toFixed(2)+" €"
document.getElementById("netto").innerText = daten.netto.toFixed(2)+" €"
document.getElementById("gesamt").innerText = daten.gesamt.toFixed(2)+" €"

let zeitraumText = formatDatum(daten.anreise) + " – " + formatDatum(daten.abreise)
document.getElementById("zeitraum").innerText = zeitraumText
let ztMeta = document.getElementById("zeitraum_meta")
if(ztMeta) ztMeta.innerText = zeitraumText

document.getElementById("r_nummer").innerText = daten.rechnung

document.getElementById("r_datum").innerText = formatDatum(daten.datum)

// Populate separate Endreinigung cell in summen-table
let reinigungSummeEl = document.getElementById("reinigungSumme")
if(reinigungSummeEl){
let rPos = daten.positionen.find(p => p.beschreibung === "Endreinigung")
reinigungSummeEl.innerText = rPos ? rPos.summe.toFixed(2)+" €" : "0,00 €"
}

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
const black = rgb(0,0,0)
const blue = rgb(0, 0.529, 0.784)  // #0087C8
const grey = rgb(0.78,0.78,0.78)   // light grey for RECHNUNG title
const white = rgb(1,1,1)
const lightgrey = rgb(0.83,0.83,0.83)
let y = 810

// ── Large grey RECHNUNG title ──
page.drawText("RECHNUNG", { x: 48, y, size: 38, font: bold, color: grey })
y -= 46

// ── Sender block (top left) ──
page.drawText(u.name, { x: 48, y, size: 10, font: bold, color: black })
y -= 14
page.drawText(u.strasse, { x: 48, y, size: 10, font, color: black })
y -= 14
page.drawText(`${u.plz} ${u.ort}`, { x: 48, y, size: 10, font, color: black })

// ── Invoice meta (top right) ──
const metaX = 340
let metaY = 764
const metaRows = [
  ["Rechnungsnummer:", d.rechnung || ""],
  ["Rechnungsdatum:", formatDatum(d.datum)],
  ["Mietzeitraum:", `${formatDatum(d.anreise)} – ${formatDatum(d.abreise)}`]
]
for(const [label, val] of metaRows){
  page.drawText(label, { x: metaX, y: metaY, size: 10, font: bold, color: black })
  page.drawText(val, { x: metaX + 110, y: metaY, size: 10, font, color: black })
  metaY -= 16
}

// ── Customer address block ──
page.drawText(`${u.name}, ${u.strasse}, ${u.plz} ${u.ort}`, { x: 48, y: 700, size: 7, font, color: rgb(0.35,0.35,0.35) })
y = 682
for(const line of [d.name, ...String(d.adresse || "").split(/\r?\n/)].filter(Boolean)){
  page.drawText(line, { x: 48, y, size: 11, font, color: black })
  y -= 15
}

// ── Salutation & body text ──
y = Math.min(y - 14, 620)
y = zeichneText(page, `${erstelleAnrede(d.anrede, d.name)},`, 48, y, { font, size: 11, color: black, maxWidth: 500, lineHeight: 15 })
y -= 4
y = zeichneText(page, erstelleBuchungstext(d.anreise, d.abreise), 48, y, { font, size: 11, color: black, maxWidth: 500, lineHeight: 15 })
y -= 4
y = zeichneText(page, "Hiermit erlauben wir uns die folgenden Leistungen in Rechnung zu stellen:", 48, y, { font, size: 11, color: black, maxWidth: 500, lineHeight: 15 })
y -= 18

// ── Table header (blue background) ──
const tableLeft = 48
const tableRight = 548
const tableWidth = tableRight - tableLeft
const rowH = 22
page.drawRectangle({ x: tableLeft, y: y - 7, width: tableWidth, height: rowH, color: blue })
page.drawText("Pos.", { x: 54, y, size: 9, font: bold, color: white })
page.drawText("Beschreibung", { x: 100, y, size: 9, font: bold, color: white })
page.drawText("Bruttopreis", { x: 390, y, size: 9, font: bold, color: white })
page.drawText("Gesamtpreis", { x: 472, y, size: 9, font: bold, color: white })
y -= rowH

// ── Table rows ──
// Filter out Endreinigung from positions (shown separately in totals)
const posFuerTabelle = d.positionen.filter(p => p.beschreibung !== "Endreinigung")
posFuerTabelle.forEach((p, idx) => {
  page.drawText(String(p.position || idx + 1), { x: 54, y, size: 10, font, color: black })
  page.drawText(p.beschreibung, { x: 100, y, size: 10, font, color: black })
  page.drawText(p.preis ? `${p.preis.toFixed(2)} Euro` : "", { x: 375, y, size: 10, font, color: black })
  page.drawText(`${p.summe.toFixed(2)} Euro`, { x: 470, y, size: 10, font, color: black })
  page.drawLine({ start: { x: tableLeft, y: y - 7 }, end: { x: tableRight, y: y - 7 }, thickness: 0.5, color: lightgrey })
  y -= 20
})

// ── Totals section (right-aligned rows) ──
y -= 4
const totalsLabelX = 300
const totalsValueX = 490
const totalsW = tableRight - totalsLabelX

// Helper to draw a totals row
function drawTotalRow(label, value, isHighlight){
  if(isHighlight){
    page.drawRectangle({ x: totalsLabelX, y: y - 7, width: totalsW, height: 22, color: blue })
    page.drawText(label, { x: totalsLabelX + 6, y, size: 10, font: bold, color: white })
    page.drawText(value, { x: totalsValueX, y, size: 10, font: bold, color: white })
  } else {
    page.drawText(label, { x: totalsLabelX + 6, y, size: 10, font, color: black })
    page.drawText(value, { x: totalsValueX, y, size: 10, font, color: black })
    page.drawLine({ start: { x: totalsLabelX, y: y - 7 }, end: { x: tableRight, y: y - 7 }, thickness: 0.5, color: lightgrey })
  }
  y -= 20
}

// Endreinigung row
const reinigungPos = d.positionen.find(p => p.beschreibung === "Endreinigung")
if(reinigungPos){
  drawTotalRow("Endreinigung", `${reinigungPos.summe.toFixed(2)} Euro`, false)
}
drawTotalRow(`Kulturförderabgabe der Stadt Köln`, `${d.kultur.toFixed(2)} Euro`, false)
drawTotalRow(`7 % UST inkl.`, `${d.mwst.toFixed(2)} Euro`, false)
drawTotalRow(`Netto`, `${d.netto.toFixed(2)} Euro`, false)
y -= 2
drawTotalRow(`Gesamtsumme`, `${d.gesamt.toFixed(2)} Euro`, true)

// ── Closing copy ──
y -= 22
page.drawText("Zahlungsbedingungen: Zahlung per sofort und ohne Abzüge.", { x: 48, y, size: 9, font, color: black })
y -= 50
page.drawText("Bei Rückfragen stehen wir selbstverständlich jederzeit gerne zur Verfügung.", { x: 48, y, size: 12, font, color: black })
y -= 28
page.drawText("Mit freundlichen Grüßen", { x: 48, y, size: 12, font, color: black })
y -= 28
page.drawText("Sarah und David Brand", { x: 48, y, size: 12, font, color: black })

// ── Footer icons (simple circle outlines with symbols) ──
// Three circles at approx. x=150, x=300, x=450, y=108
function drawCircleIcon(cx, cy, r){
  // Approximate circle with many line segments
  const steps = 32
  for(let i = 0; i < steps; i++){
    const a1 = (i / steps) * 2 * Math.PI
    const a2 = ((i+1) / steps) * 2 * Math.PI
    page.drawLine({
      start: { x: cx + r * Math.cos(a1), y: cy + r * Math.sin(a1) },
      end:   { x: cx + r * Math.cos(a2), y: cy + r * Math.sin(a2) },
      thickness: 1.2, color: black
    })
  }
}

// House icon at x=150
const hx = 150, hy = 108, hr = 18
drawCircleIcon(hx, hy, hr)
// Roof: triangle
page.drawLine({ start:{x:hx-7,y:hy+2}, end:{x:hx,y:hy+9}, thickness:1.2, color:black })
page.drawLine({ start:{x:hx,y:hy+9}, end:{x:hx+7,y:hy+2}, thickness:1.2, color:black })
// House walls
page.drawLine({ start:{x:hx-7,y:hy+2}, end:{x:hx-7,y:hy-6}, thickness:1.2, color:black })
page.drawLine({ start:{x:hx+7,y:hy+2}, end:{x:hx+7,y:hy-6}, thickness:1.2, color:black })
page.drawLine({ start:{x:hx-7,y:hy-6}, end:{x:hx+7,y:hy-6}, thickness:1.2, color:black })
// Door
page.drawLine({ start:{x:hx-2,y:hy-6}, end:{x:hx-2,y:hy-1}, thickness:1, color:black })
page.drawLine({ start:{x:hx+2,y:hy-6}, end:{x:hx+2,y:hy-1}, thickness:1, color:black })
page.drawLine({ start:{x:hx-2,y:hy-1}, end:{x:hx+2,y:hy-1}, thickness:1, color:black })

// ID card icon at x=300
const ix = 300, iy = 108
drawCircleIcon(ix, iy, hr)
// Card rectangle
page.drawLine({ start:{x:ix-8,y:iy-5}, end:{x:ix+8,y:iy-5}, thickness:1, color:black })
page.drawLine({ start:{x:ix-8,y:iy+5}, end:{x:ix+8,y:iy+5}, thickness:1, color:black })
page.drawLine({ start:{x:ix-8,y:iy-5}, end:{x:ix-8,y:iy+5}, thickness:1, color:black })
page.drawLine({ start:{x:ix+8,y:iy-5}, end:{x:ix+8,y:iy+5}, thickness:1, color:black })
// Lines on card
page.drawLine({ start:{x:ix-2,y:iy+2}, end:{x:ix+6,y:iy+2}, thickness:1, color:black })
page.drawLine({ start:{x:ix-2,y:iy-1}, end:{x:ix+6,y:iy-1}, thickness:1, color:black })
// Small circle on left
page.drawLine({ start:{x:ix-6,y:iy+1}, end:{x:ix-4,y:iy+1}, thickness:2, color:black })

// Dollar/coin icon at x=450
const dx = 450, dy = 108
drawCircleIcon(dx, dy, hr)
// Inner circle
drawCircleIcon(dx, dy, hr * 0.58)
// Dollar S shape (simplified)
page.drawLine({ start:{x:dx,y:dy+7}, end:{x:dx,y:dy-7}, thickness:1.5, color:black })
page.drawLine({ start:{x:dx-3,y:dy+5}, end:{x:dx+3,y:dy+5}, thickness:1.2, color:black })
page.drawLine({ start:{x:dx-3,y:dy}, end:{x:dx+3,y:dy}, thickness:1.2, color:black })
page.drawLine({ start:{x:dx-3,y:dy-5}, end:{x:dx+3,y:dy-5}, thickness:1.2, color:black })

// ── Blue double separator line ──
page.drawLine({ start:{x:48,y:86}, end:{x:548,y:86}, thickness:4, color:blue })
page.drawLine({ start:{x:48,y:81}, end:{x:548,y:81}, thickness:1.5, color:blue })

// ── Footer text columns ──
page.drawText(`${u.name}`, { x: 60, y: 72, size: 8, font: bold, color: black })
page.drawText(u.strasse, { x: 60, y: 62, size: 8, font, color: black })
page.drawText(`${u.plz} ${u.ort}`, { x: 60, y: 52, size: 8, font, color: black })
page.drawText(u.inhaber, { x: 60, y: 42, size: 8, font, color: black })

page.drawText(u.telefon, { x: 190, y: 67, size: 8, font, color: black })
page.drawText(u.email, { x: 190, y: 55, size: 8, font, color: black })

page.drawText(u.bank, { x: 330, y: 72, size: 8, font: bold, color: black })
page.drawText(u.iban, { x: 330, y: 62, size: 8, font, color: black })
page.drawText(`BIC: ${u.bic}`, { x: 330, y: 52, size: 8, font, color: black })

page.drawText("Steuernr.", { x: 475, y: 67, size: 8, font: bold, color: black })
page.drawText(u.steuernummer, { x: 475, y: 55, size: 8, font, color: black })

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

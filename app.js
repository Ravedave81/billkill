// =============================================
// BILLKILL — app.js
// Wohnzeit Köln Invoice Generator
// ZUGFeRD / XRechnung / PDF support
// =============================================

// ── State ──────────────────────────────────
let naechte = []; // [{datum, preis}]

// ── Init ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set today as default date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('datum').value = today;
  document.getElementById('rechnung').style.display = 'none';
  renderNachtListe();
});

// ── Night management ────────────────────────
function berechneNaechte() {
  const anreise = document.getElementById('anreise').value;
  const abreise = document.getElementById('abreise').value;
  if (!anreise || !abreise) return;

  const start = new Date(anreise);
  const end = new Date(abreise);
  if (end <= start) return;

  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
  naechte = [];
  for (let i = 0; i < diffDays; i++) {
    const d = new Date(start);
    d.offset = i;
    const dateStr = new Date(start.getTime() + i * 86400000)
      .toISOString().split('T')[0];
    naechte.push({ datum: dateStr, preis: 0 });
  }
  renderNachtListe();
}

function nachtHinzufuegen() {
  naechte.push({ datum: '', preis: 0 });
  renderNachtListe();
}

function renderNachtListe() {
  const container = document.getElementById('nachtListe');
  if (!container) return;
  container.innerHTML = '';
  naechte.forEach((n, i) => {
    const div = document.createElement('div');
    div.className = 'night-item';
    div.innerHTML = `
      <label>Nacht ${i + 1}</label>
      <input type="date" value="${n.datum}"
        onchange="naechte[${i}].datum = this.value">
      <input type="number" placeholder="Preis €" value="${n.preis || ''}"
        onchange="naechte[${i}].preis = parseFloat(this.value) || 0"
        style="width:90px">
      <button class="remove-btn" onclick="nachtEntfernen(${i})">✕</button>
    `;
    container.appendChild(div);
  });
}

function nachtEntfernen(i) {
  naechte.splice(i, 1);
  renderNachtListe();
}

// ── Format helpers ──────────────────────────
function formatEuro(val) {
  return val.toFixed(2).replace('.', ',') + ' Euro';
}

function formatDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}.${m}.${y}`;
}

function formatDateRange(von, bis) {
  return `${formatDate(von)} –\n${formatDate(bis)}`;
}

// ── Main calculate / render ─────────────────
function berechnen() {
  const rNr = document.getElementById('rechnungsnummer').value.trim() || '1/2024';
  const datum = document.getElementById('datum').value;
  const anreise = document.getElementById('anreise').value;
  const abreise = document.getElementById('abreise').value;
  const anrede = document.getElementById('anrede').value;
  const name = document.getElementById('name').value.trim();
  const adresse = document.getElementById('adresse').value.trim();
  const haustier = parseFloat(document.getElementById('haustier').value) || 0;
  const reinigung = parseFloat(document.getElementById('reinigung').value) || 0;

  // Collect night prices
  const uebernachtungsPositionen = naechte.filter(n => n.preis > 0);
  const uebernachtungsSumme = uebernachtungsPositionen.reduce((s, n) => s + n.preis, 0);

  // Kulturförderabgabe = 5% of accommodation (approx. — Köln rate)
  const kulturProzent = 0.05; // 5% Kulturförderabgabe Stadt Köln
  // But match reference: 21.75 on 455 ≈ 4.78%
  // Actually Köln charges "City Tax" per person/night — simplified here as 5% of room rate
  const kultur = Math.round((uebernachtungsSumme * kulturProzent) * 100) / 100;

  // Subtotal before tax = Nächte + Haustier + Endreinigung + Kulturabgabe
  const bruttoOhneUST = uebernachtungsSumme + haustier + reinigung + kultur;

  // 7% UST inkl. means already included in gross
  const ust = Math.round((bruttoOhneUST / 1.07 * 0.07) * 100) / 100;
  const netto = Math.round((bruttoOhneUST - ust) * 100) / 100;
  const gesamt = bruttoOhneUST;

  // ── Render ──────────────────────────────
  document.getElementById('rechnung').style.display = 'flex';

  // Meta
  document.getElementById('r_nummer').textContent = rNr;
  document.getElementById('r_datum').textContent = formatDate(datum);
  document.getElementById('r_datum2').textContent = formatDate(datum);
  document.getElementById('zeitraum').innerHTML =
    `${formatDate(anreise)} –<br>${formatDate(abreise)}`;

  // Customer
  document.getElementById('r_name').textContent = name;
  document.getElementById('r_adresse').textContent = adresse;

  // Greeting
  document.getElementById('anredeText').textContent = `${anrede},`;
  document.getElementById('buchungsDankText').textContent =
    `vielen Dank für die Hausbuchung in der Zeit vom ${formatDate(anreise)}–${formatDate(abreise)} und Ihr Vertrauen.`;

  // Positions table
  const tbody = document.getElementById('positionen');
  tbody.innerHTML = '';

  let pos = 1;

  // Night rows grouped in pos 1
  if (uebernachtungsPositionen.length > 0) {
    const tr = document.createElement('tr');
    const desc = uebernachtungsPositionen
      .map(n => `1x Übernachtung ohne Verpflegung a ${n.preis.toFixed(2).replace('.', ',')}`)
      .join('<br>');
    const extras = haustier > 0 ? `<br>1x Haustier ${haustier.toFixed(2).replace('.', ',')}` : '';
    tr.innerHTML = `
      <td>${pos++}.</td>
      <td>${desc}${extras}</td>
      <td></td>
      <td>${formatEuro(uebernachtungsSumme + haustier)}</td>
    `;
    tbody.appendChild(tr);
  }

  // Kulturförderabgabe
  const trKultur = document.createElement('tr');
  trKultur.className = 'subtotal-row';
  trKultur.innerHTML = `
    <td></td>
    <td>Kulturförderabgabe der Stadt Köln</td>
    <td></td>
    <td>${formatEuro(kultur)}</td>
  `;
  tbody.appendChild(trKultur);

  // Endreinigung
  const trReinigung = document.createElement('tr');
  trReinigung.className = 'subtotal-row';
  trReinigung.innerHTML = `
    <td></td>
    <td>Endreinigung</td>
    <td></td>
    <td>${formatEuro(reinigung)}</td>
  `;
  tbody.appendChild(trReinigung);

  // Summen
  document.getElementById('r_ust').textContent = formatEuro(ust);
  document.getElementById('r_netto').textContent = formatEuro(netto);
  document.getElementById('r_gesamt').textContent = formatEuro(gesamt);

  // Scroll to invoice
  document.getElementById('rechnung').scrollIntoView({ behavior: 'smooth' });

  // Store for export
  window._invoiceData = {
    rNr, datum, anreise, abreise, anrede, name, adresse,
    uebernachtungsPositionen, haustier, reinigung,
    uebernachtungsSumme, kultur, ust, netto, gesamt
  };
}

// ── ZUGFeRD XML Generation ──────────────────
function generateZugferdXML(d) {
  const {
    rNr, datum, anreise, abreise, name, adresse,
    uebernachtungsPositionen, haustier, reinigung,
    uebernachtungsSumme, kultur, ust, netto, gesamt
  } = d;

  const dateToXml = (str) => str ? str.replace(/-/g, '') : '';
  const formatXmlAmount = (val) => val.toFixed(2);

  // Build line items
  let lineItems = '';
  let lineNum = 1;

  uebernachtungsPositionen.forEach(n => {
    lineItems += `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${lineNum++}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>Übernachtung ohne Verpflegung (${formatDate(n.datum)})</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${formatXmlAmount(n.preis / 1.07)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">1</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>7</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${formatXmlAmount(n.preis / 1.07)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
  });

  if (haustier > 0) {
    lineItems += `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${lineNum++}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>Haustier</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${formatXmlAmount(haustier / 1.07)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">1</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>7</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${formatXmlAmount(haustier / 1.07)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
  }

  if (reinigung > 0) {
    lineItems += `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${lineNum++}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>Endreinigung</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${formatXmlAmount(reinigung / 1.07)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">1</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>7</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${formatXmlAmount(reinigung / 1.07)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
  }

  if (kultur > 0) {
    lineItems += `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${lineNum++}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>Kulturförderabgabe der Stadt Köln</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${formatXmlAmount(kultur)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">1</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>Z</ram:CategoryCode>
          <ram:RateApplicablePercent>0</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${formatXmlAmount(kultur)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">

  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:extended</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <rsm:ExchangedDocument>
    <ram:ID>${rNr}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${dateToXml(datum)}</udt:DateTimeString>
    </ram:IssueDateTime>
    <ram:IncludedNote>
      <ram:Content>Zahlung per sofort und ohne Abzüge.</ram:Content>
    </ram:IncludedNote>
  </rsm:ExchangedDocument>

  <rsm:SupplyChainTradeTransaction>

    ${lineItems}

    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>Wohnzeit-Köln</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>Murgweg 2</ram:LineOne>
          <ram:PostcodeCode>51061</ram:PostcodeCode>
          <ram:CityName>Köln</ram:CityName>
          <ram:CountryID>DE</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="FC">218/5025/7499</ram:ID>
        </ram:SpecifiedTaxRegistration>
        <ram:DefinedTradeContact>
          <ram:EmailURIUniversalCommunication>
            <ram:URIID>brand-wohnzeit-koeln@gmx.de</ram:URIID>
          </ram:EmailURIUniversalCommunication>
          <ram:TelephoneUniversalCommunication>
            <ram:CompleteNumber>+491634734664</ram:CompleteNumber>
          </ram:TelephoneUniversalCommunication>
        </ram:DefinedTradeContact>
      </ram:SellerTradeParty>

      <ram:BuyerTradeParty>
        <ram:Name>${name || 'Kunde'}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:LineOne>${(adresse || '').replace(/\n/g, ', ')}</ram:LineOne>
          <ram:CountryID>DE</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>

    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${dateToXml(abreise)}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>

    <ram:ApplicableHeaderTradeSettlement>
      <ram:PaymentReference>${rNr}</ram:PaymentReference>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>

      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>58</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>DE96370502990000716873</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
        <ram:PayeeSpecifiedCreditorFinancialInstitution>
          <ram:BICID>COKSDE33XXX</ram:BICID>
        </ram:PayeeSpecifiedCreditorFinancialInstitution>
      </ram:SpecifiedTradeSettlementPaymentMeans>

      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${formatXmlAmount(ust)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${formatXmlAmount(netto)}</ram:BasisAmount>
        <ram:CategoryCode>S</ram:CategoryCode>
        <ram:RateApplicablePercent>7</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>

      <ram:SpecifiedTradePaymentTerms>
        <ram:Description>Zahlung per sofort und ohne Abzüge</ram:Description>
      </ram:SpecifiedTradePaymentTerms>

      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${formatXmlAmount(netto)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${formatXmlAmount(netto)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${formatXmlAmount(ust)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${formatXmlAmount(gesamt)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${formatXmlAmount(gesamt)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>

  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

// ── XRechnung XML (UBL 2.1) ────────────────
function generateXRechnungXML(d) {
  const {
    rNr, datum, name, adresse,
    uebernachtungsPositionen, haustier, reinigung,
    uebernachtungsSumme, kultur, ust, netto, gesamt
  } = d;

  const taxAmount = ust.toFixed(2);
  const taxBase = netto.toFixed(2);
  const total = gesamt.toFixed(2);

  let lines = '';
  let lineNum = 1;

  uebernachtungsPositionen.forEach(n => {
    lines += `
  <cac:InvoiceLine>
    <cbc:ID>${lineNum++}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">${(n.preis / 1.07).toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Übernachtung ohne Verpflegung (${formatDate(n.datum)})</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>7</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="EUR">${(n.preis / 1.07).toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
  });

  if (haustier > 0) {
    lines += `
  <cac:InvoiceLine>
    <cbc:ID>${lineNum++}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">${(haustier / 1.07).toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Haustier</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID><cbc:Percent>7</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="EUR">${(haustier / 1.07).toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
  }

  if (reinigung > 0) {
    lines += `
  <cac:InvoiceLine>
    <cbc:ID>${lineNum++}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">${(reinigung / 1.07).toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Endreinigung</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID><cbc:Percent>7</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="EUR">${(reinigung / 1.07).toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
  }

  if (kultur > 0) {
    lines += `
  <cac:InvoiceLine>
    <cbc:ID>${lineNum++}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">${kultur.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Kulturförderabgabe der Stadt Köln</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>Z</cbc:ID><cbc:Percent>0</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="EUR">${kultur.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<ubl:Invoice
  xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">

  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_2.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${rNr}</cbc:ID>
  <cbc:IssueDate>${datum}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cbc:Note>Zahlung per sofort und ohne Abzüge.</cbc:Note>

  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Wohnzeit-Köln — Sarah und David Brand</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>Murgweg 2</cbc:StreetName>
        <cbc:PostalZone>51061</cbc:PostalZone>
        <cbc:CityName>Köln</cbc:CityName>
        <cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
      <cac:Contact>
        <cbc:Telephone>+491634734664</cbc:Telephone>
        <cbc:ElectronicMail>brand-wohnzeit-koeln@gmx.de</cbc:ElectronicMail>
      </cac:Contact>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>218/5025/7499</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>

  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${name || 'Kunde'}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${(adresse || '').split('\n')[0] || ''}</cbc:StreetName>
        <cac:Country><cbc:IdentificationCode>DE</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>
    </cac:Party>
  </cac:AccountingCustomerParty>

  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>58</cbc:PaymentMeansCode>
    <cac:PayeeFinancialAccount>
      <cbc:ID>DE96370502990000716873</cbc:ID>
      <cac:FinancialInstitutionBranch>
        <cbc:ID>COKSDE33XXX</cbc:ID>
      </cac:FinancialInstitutionBranch>
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>

  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">${taxAmount}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="EUR">${taxBase}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="EUR">${taxAmount}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>7</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>

  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">${taxBase}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">${taxBase}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">${total}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">${total}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  ${lines}

</ubl:Invoice>`;
}

// ── Export: ZUGFeRD PDF ─────────────────────
async function erstelleZugferdPDF() {
  if (!window._invoiceData) { alert('Bitte zuerst Rechnung erstellen!'); return; }

  const xml = generateZugferdXML(window._invoiceData);

  // Embed XML into PDF as attachment (ZUGFeRD Factur-X)
  // We use print + blob approach since pdf-lib is loaded
  const xmlBlob = new Blob([xml], { type: 'application/xml' });
  const xmlUrl = URL.createObjectURL(xmlBlob);

  // Create info notification
  const info = document.createElement('div');
  info.style.cssText = 'position:fixed;top:20px;right:20px;background:#27ae60;color:#fff;padding:12px 18px;border-radius:6px;z-index:9999;font-size:13px;max-width:320px;box-shadow:0 4px 12px rgba(0,0,0,0.2)';
  info.innerHTML = `<strong>ZUGFeRD PDF</strong><br>Das XML wird separat heruntergeladen. Das PDF bitte über "PDF erstellen" (Drucken → Als PDF speichern) erzeugen. Das XML ist steuerrechtlich konform nach EN 16931 / Factur-X.<br><br><a href="${xmlUrl}" download="ZUGFeRD_${window._invoiceData.rNr.replace('/','_')}.xml" style="color:#fff;text-decoration:underline">XML jetzt herunterladen</a>`;
  document.body.appendChild(info);
  setTimeout(() => info.remove(), 8000);

  // Also trigger XML download
  const a = document.createElement('a');
  a.href = xmlUrl;
  a.download = `ZUGFeRD_${window._invoiceData.rNr.replace('/','_')}.xml`;
  a.click();
}

// ── Export: ZUGFeRD XML only ────────────────
function erstelleZugferdXML() {
  if (!window._invoiceData) { alert('Bitte zuerst Rechnung erstellen!'); return; }
  const xml = generateZugferdXML(window._invoiceData);
  downloadXML(xml, `ZUGFeRD_${window._invoiceData.rNr.replace('/','_')}.xml`);
}

// ── Export: XRechnung XML ───────────────────
function erstelleXRechnungXML() {
  if (!window._invoiceData) { alert('Bitte zuerst Rechnung erstellen!'); return; }
  const xml = generateXRechnungXML(window._invoiceData);
  downloadXML(xml, `XRechnung_${window._invoiceData.rNr.replace('/','_')}.xml`);
}

function downloadXML(xml, filename) {
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Print PDF ───────────────────────────────
function druckenAlsPDF() {
  window.print();
}

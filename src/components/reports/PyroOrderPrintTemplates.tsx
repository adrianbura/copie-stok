import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { InventoryDocument } from '@/hooks/useInventoryDocuments';
import { CompanySettings } from '@/hooks/useCompanySettings';

interface PrintTemplateProps {
  document: InventoryDocument;
  companyName?: string;
  companySettings?: CompanySettings | null;
  operatorName?: string;
}

// Generate HTML for "Comandă de Materii Explozive" - Clean vertical table format
export function generateOrderPrintHTML({ document, companyName = 'ARTIFICII GROUP SRL', operatorName }: PrintTemplateProps): string {
  const eventName = document.notes?.replace(/^[^:]+:\s*/, '') || '-';
  // Use operator name (logged-in user) for Pirotehnist field
  const pyrotechnist = operatorName || document.operator_name || document.partner || '-';
  const totalQuantity = document.items.reduce((sum, item) => sum + item.quantity, 0);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Comandă Materii Explozive - ${document.document_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif;
          padding: 15mm;
          color: #1a1a1a;
          font-size: 11pt;
          line-height: 1.4;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #333;
        }
        .company { font-weight: 600; font-size: 12pt; }
        .doc-number { font-size: 11pt; color: #555; }
        .title {
          text-align: center;
          font-size: 16pt;
          font-weight: bold;
          margin: 20px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 30px;
          margin-bottom: 25px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        .info-item { display: flex; gap: 8px; }
        .info-label { font-weight: 600; color: #555; min-width: 120px; }
        .info-value { color: #1a1a1a; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 10px 12px;
          text-align: left;
        }
        th {
          background: #f0f0f0;
          font-weight: 600;
          font-size: 10pt;
        }
        td { font-size: 10pt; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .total-row {
          background: #e8f4ff;
          font-weight: bold;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding-top: 20px;
        }
        .signature-block { width: 200px; }
        .signature-label { font-size: 10pt; margin-bottom: 5px; }
        .signature-line {
          border-bottom: 1px solid #333;
          height: 40px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 8pt;
          color: #888;
        }
        @media print {
          body { padding: 10mm; }
          .info-grid { background: #f8f9fa !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          th { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .total-row { background: #e8f4ff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company">${companyName}</div>
        </div>
        <div class="doc-number">Nr. ${document.document_number}</div>
      </div>
      
      <div class="title">Comandă de Materii Explozive</div>
      
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Data:</span>
          <span class="info-value">${format(new Date(document.date), 'dd MMMM yyyy', { locale: ro })}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Eveniment:</span>
          <span class="info-value">${eventName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Pirotehnist:</span>
          <span class="info-value">${pyrotechnist}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Gestiune:</span>
          <span class="info-value">${document.warehouse || 'Principal'}</span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 40px;">Nr.</th>
            <th style="white-space: nowrap;">Cod</th>
            <th>Denumire Produs</th>
            <th class="text-center" style="white-space: nowrap;">Categorie</th>
            <th class="text-right" style="white-space: nowrap;">Cantitate</th>
          </tr>
        </thead>
        <tbody>
          ${document.items.map((item, index) => `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td><code>${item.code}</code></td>
              <td>${item.name}</td>
              <td class="text-center">${item.category}</td>
              <td class="text-right">${item.quantity} buc</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="4" class="text-right">TOTAL PRODUSE:</td>
            <td class="text-right">${totalQuantity} buc</td>
          </tr>
        </tbody>
      </table>
      
      <div class="signatures">
        <div class="signature-block">
          <div class="signature-label">Șef schimb / Gestionar:</div>
          <div class="signature-line"></div>
        </div>
        <div class="signature-block">
          <div class="signature-label">Primitor / Pirotehnist:</div>
          <div class="signature-line"></div>
        </div>
      </div>
      
      <div class="footer">
        Document generat din PyroSafe Keeper la ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: ro })}
      </div>
    </body>
    </html>
  `;
}

// Generate HTML for "Aviz de Însoțire a Mărfii" - Full legal Romanian format
export function generateAvizPrintHTML({ document, companySettings }: PrintTemplateProps): string {
  const eventName = document.notes?.replace(/^[^:]+:\s*/, '') || '-';
  const pyrotechnist = document.partner || '-';
  const totalQuantity = document.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = document.total_value || document.items.reduce((sum, item) => sum + (item.quantity * (item.unit_price || 0)), 0);
  
  // Use company settings or defaults
  const company = {
    name: companySettings?.company_name || 'FIRMA MEA SRL',
    registrationNumber: companySettings?.registration_number || 'J40/XXXXX/20XX',
    cui: companySettings?.cui || 'RO XXXXXXXX',
    address: companySettings?.address || 'București, Sector X',
    phone: companySettings?.phone || '',
    email: companySettings?.email || '',
    bankName: companySettings?.bank_name || '',
    bankAccount: companySettings?.bank_account || '',
  };
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Aviz de Însoțire - ${document.document_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Times New Roman', serif;
          padding: 12mm;
          color: #000;
          font-size: 12pt;
          line-height: 1.4;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .company-info {
          font-size: 14pt;
          line-height: 1.5;
        }
        .company-name { font-weight: bold; font-size: 17pt; }
        .doc-info {
          text-align: right;
          font-size: 14pt;
        }
        .title {
          text-align: center;
          font-size: 20pt;
          font-weight: bold;
          margin: 18px 0 12px;
          text-transform: uppercase;
        }
        .subtitle {
          text-align: center;
          font-size: 13pt;
          margin-bottom: 18px;
        }
        .info-section {
          margin-bottom: 14px;
          font-size: 14pt;
        }
        .info-row {
          display: flex;
          gap: 20px;
          margin-bottom: 6px;
        }
        .info-label { font-weight: bold; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px 10px;
          text-align: left;
        }
        th {
          background: #f0f0f0;
          font-weight: bold;
          font-size: 14pt;
        }
        td { font-size: 14pt; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .total-row { font-weight: bold; background: #f5f5f5; }
        
        .footer-section {
          margin-top: 20px;
          border: 1px solid #000;
        }
        .footer-row {
          display: flex;
          border-bottom: 1px solid #000;
        }
        .footer-row:last-child { border-bottom: none; }
        .footer-left {
          width: 60%;
          padding: 10px 12px;
          border-right: 1px solid #000;
          font-size: 11pt;
          line-height: 1.7;
        }
        .footer-right {
          width: 40%;
          padding: 10px 12px;
          font-size: 11pt;
        }
        .footer-right-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px dotted #ccc;
        }
        .footer-right-row:last-child { border-bottom: none; }
        .signature-area {
          min-height: 50px;
          margin-top: 10px;
        }
        .document-footer {
          margin-top: 15px;
          text-align: center;
          font-size: 9pt;
          color: #666;
        }
        @media print {
          body { padding: 8mm; }
          th, .total-row { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header-row">
        <div class="company-info">
          <div class="company-name">${company.name}</div>
          <div>Nr. Reg. Com.: ${company.registrationNumber}</div>
          <div>C.U.I.: ${company.cui}</div>
          <div>Sediul: ${company.address}</div>
          ${company.phone ? `<div>Tel: ${company.phone}</div>` : ''}
        </div>
        <div class="doc-info">
          <div><strong>Seria:</strong> ${document.document_number.split('-')[0] || 'AV'}</div>
          <div><strong>Nr.:</strong> ${document.document_number}</div>
          <div><strong>Data:</strong> ${format(new Date(document.date), 'dd.MM.yyyy', { locale: ro })}</div>
        </div>
      </div>
      
      <div class="title">Aviz de Însoțire a Mărfii</div>
      <div class="subtitle">(pentru valori materiale care nu fac obiectul TVA)</div>
      
      <div class="info-section">
        <div class="info-row">
          <span><span class="info-label">Furnizor:</span> ${company.name}</span>
        </div>
        <div class="info-row">
          <span><span class="info-label">Gestiunea:</span> ${document.warehouse || 'Principal'}</span>
        </div>
        <div class="info-row">
          <span><span class="info-label">Beneficiar:</span> ${pyrotechnist}</span>
          <span><span class="info-label">Eveniment:</span> ${eventName}</span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 40px;">Nr.</th>
            <th style="white-space: nowrap;">Cod</th>
            <th>Denumirea produsului</th>
            <th class="text-center" style="white-space: nowrap;">U.M.</th>
            <th class="text-right" style="white-space: nowrap;">Cantitate</th>
            <th class="text-right" style="white-space: nowrap;">Preț (lei)</th>
            <th class="text-right" style="white-space: nowrap;">Valoare (lei)</th>
          </tr>
        </thead>
        <tbody>
          ${document.items.map((item, index) => {
            const itemValue = item.quantity * (item.unit_price || 0);
            return `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td><code>${item.code}</code></td>
                <td>${item.name} <small>(${item.category})</small></td>
                <td class="text-center">buc</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${(item.unit_price || 0).toFixed(2)}</td>
                <td class="text-right">${itemValue.toFixed(2)}</td>
              </tr>
            `;
          }).join('')}
          <tr class="total-row">
            <td colspan="4" class="text-right">TOTAL:</td>
            <td class="text-right">${totalQuantity}</td>
            <td></td>
            <td class="text-right">${totalValue.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="footer-section">
        <div class="footer-row">
          <div class="footer-left">
            <strong>Semnătura și ștampila furnizorului</strong><br/><br/>
            <div>Întocmit de: _______________________</div>
            <div>CNP: _______________________</div>
            <div>Numele delegatului: ${pyrotechnist !== '-' ? pyrotechnist : '_______________________'}</div>
            <div>B.I./C.I.: Seria ____ Nr. ____________</div>
            <div>Mijloc transport: _______________________</div>
            <div style="margin-top: 8px;">
              Expedierea s-a efectuat în prezența noastră la data de ____.____._______ ora ____:____
            </div>
            <div class="signature-area">
              Semnăturile: _______________________
            </div>
          </div>
          <div class="footer-right">
            <div class="footer-right-row">
              <span><strong>Total</strong></span>
              <span><strong>${totalValue.toFixed(2)}</strong></span>
            </div>
            <div style="margin-top: 15px;">
              <strong>Data primirii în gestiune și semnătura</strong>
              <div class="signature-area"></div>
            </div>
            <div style="margin-top: 10px;">
              <strong>Semnătura de primire:</strong>
              <div class="signature-area"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="document-footer">
        Document generat din PyroSafe Keeper la ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: ro })}
      </div>
    </body>
    </html>
  `;
}

// Generate HTML for "Îndeplinirea Comenzii" - Clean vertical table format
export function generateFulfillmentPrintHTML({ document, companyName = 'ARTIFICII GROUP SRL', operatorName }: PrintTemplateProps): string {
  const eventName = document.notes?.replace(/^[^:]+:\s*/, '') || 'Foc Artificii';
  // Use operator name (logged-in user) for Pirotehnist field
  const pyrotechnist = operatorName || document.operator_name || document.partner || '-';
  const totalQuantity = document.items.reduce((sum, item) => sum + item.quantity, 0);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Îndeplinirea Comenzii - ${document.document_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif;
          padding: 15mm;
          color: #1a1a1a;
          font-size: 11pt;
          line-height: 1.4;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #333;
        }
        .company { font-weight: 600; font-size: 12pt; }
        .doc-number { font-size: 11pt; color: #555; }
        .title {
          text-align: center;
          font-size: 16pt;
          font-weight: bold;
          margin: 20px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 30px;
          margin-bottom: 25px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        .info-item { display: flex; gap: 8px; }
        .info-label { font-weight: 600; color: #555; min-width: 120px; }
        .info-value { color: #1a1a1a; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 10px 12px;
          text-align: left;
        }
        th {
          background: #f0f0f0;
          font-weight: 600;
          font-size: 10pt;
        }
        td { font-size: 10pt; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .section-title {
          background: #fff8e6;
          font-weight: 600;
          font-size: 10pt;
        }
        .total-row {
          background: #e8f4ff;
          font-weight: bold;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding-top: 20px;
        }
        .signature-block { width: 200px; }
        .signature-label { font-size: 10pt; margin-bottom: 5px; }
        .signature-line {
          border-bottom: 1px solid #333;
          height: 40px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 8pt;
          color: #888;
        }
        @media print {
          body { padding: 10mm; }
          .info-grid { background: #f8f9fa !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          th { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .section-title { background: #fff8e6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .total-row { background: #e8f4ff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company">${companyName}</div>
        </div>
        <div class="doc-number">Nr. ${document.document_number}</div>
      </div>
      
      <div class="title">Îndeplinirea Comenzii</div>
      
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Data:</span>
          <span class="info-value">${format(new Date(document.date), 'dd MMMM yyyy', { locale: ro })}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Eveniment:</span>
          <span class="info-value">${eventName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Pirotehnist:</span>
          <span class="info-value">${pyrotechnist}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Gestiune:</span>
          <span class="info-value">${document.warehouse || 'Principal'}</span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 40px;">Nr.</th>
            <th style="white-space: nowrap;">Cod</th>
            <th>Denumire Produs</th>
            <th class="text-center" style="white-space: nowrap;">Categ.</th>
            <th class="text-right" style="white-space: nowrap;">Primit</th>
            <th class="text-right" style="white-space: nowrap;">Consumat</th>
            <th class="text-right" style="white-space: nowrap;">Restituit</th>
          </tr>
        </thead>
        <tbody>
          ${document.items.map((item, index) => `
            <tr>
              <td class="text-center">${index + 1}</td>
              <td><code>${item.code}</code></td>
              <td>${item.name}</td>
              <td class="text-center">${item.category}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">0</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="4" class="text-right">TOTAL:</td>
            <td class="text-right">${totalQuantity}</td>
            <td class="text-right">${totalQuantity}</td>
            <td class="text-right">0</td>
          </tr>
        </tbody>
      </table>
      
      <div style="margin-top: 15px; padding: 10px; background: #f0f0f0; border-radius: 4px; font-size: 9pt;">
        <strong>Rateuri / Neexplodate:</strong> 0 bucăți
      </div>
      
      <div class="signatures">
        <div class="signature-block">
          <div class="signature-label">Predător / Pirotehnist:</div>
          <div class="signature-line"></div>
        </div>
        <div class="signature-block">
          <div class="signature-label">Primitor / Gestionar:</div>
          <div class="signature-line"></div>
        </div>
      </div>
      
      <div class="footer">
        Document generat din PyroSafe Keeper la ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: ro })}
      </div>
    </body>
    </html>
  `;
}

// Print function
export function printPyroDocument(htmlContent: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Permite pop-up-uri pentru a putea printa.');
    return;
  }
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { InventoryDocument } from '@/hooks/useInventoryDocuments';

interface PrintTemplateProps {
  document: InventoryDocument;
  companyName?: string;
}

// Generate HTML for "Comandă de Materii Explozive" - Clean vertical table format
export function generateOrderPrintHTML({ document, companyName = 'ARTIFICII GROUP SRL' }: PrintTemplateProps): string {
  const eventName = document.notes?.replace(/^[^:]+:\s*/, '') || '-';
  const pyrotechnist = document.partner || '-';
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

// Generate HTML for "Îndeplinirea Comenzii" - Clean vertical table format
export function generateFulfillmentPrintHTML({ document, companyName = 'ARTIFICII GROUP SRL' }: PrintTemplateProps): string {
  const eventName = document.notes?.replace(/^[^:]+:\s*/, '') || 'Foc Artificii';
  const pyrotechnist = document.partner || '-';
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

import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { InventoryDocument, DocumentItem } from '@/hooks/useInventoryDocuments';

interface PrintTemplateProps {
  document: InventoryDocument;
  companyName?: string;
}

// Generate HTML for "Comandă de Materii Explozive"
export function generateOrderPrintHTML({ document, companyName = 'ARTIFICII GROUP SRL' }: PrintTemplateProps): string {
  const eventName = document.notes?.replace(/^[^:]+:\s*/, '') || '-';
  const pyrotechnist = document.partner || '-';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Comandă Materii Explozive - ${document.document_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif;
          padding: 15mm;
          color: #000;
          font-size: 10pt;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .title {
          text-align: center;
          font-size: 14pt;
          font-weight: bold;
          margin: 15px 0;
        }
        .date-row {
          text-align: right;
          margin-bottom: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        th, td {
          border: 1px solid #000;
          padding: 6px 8px;
          text-align: center;
          font-size: 9pt;
        }
        th {
          background-color: #e6f2ff;
          font-weight: bold;
        }
        .section-header {
          background-color: #cce5ff;
          font-weight: bold;
        }
        .pyro-name {
          text-align: left;
          font-weight: bold;
        }
        .text-left { text-align: left; }
        .footer-section {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
        }
        .signature-block {
          width: 45%;
        }
        .signature-line {
          border-bottom: 1px solid #000;
          margin-top: 30px;
          width: 150px;
        }
        @media print {
          body { padding: 10mm; }
        }
      </style>
    </head>
    <body>
      <div class="header-row">
        <div><strong>Unitatea:</strong> ${companyName}</div>
        <div><strong>NR:</strong> ${document.document_number.replace(/[^0-9]/g, '') || document.document_number}</div>
      </div>
      
      <div class="title">COMANDA DE MATERII EXPLOZIVE</div>
      
      <div class="date-row">
        <strong>Data:</strong> ${format(new Date(document.date), 'dd.MM.yyyy', { locale: ro })}
      </div>
      
      <table>
        <thead>
          <tr class="section-header">
            <th colspan="${document.items.length + 2}">Produse pirotehnice ridicate din depozit</th>
          </tr>
          <tr>
            <th class="text-left" style="width: 150px;">Numele și prenumele<br/>Primitorului (Pirotehnicianului)</th>
            ${document.items.map(item => `<th>${item.code}<br/>${item.category}</th>`).join('')}
            <th>Semnatura de primire</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="pyro-name">${pyrotechnist}</td>
            ${document.items.map(item => `<td>${item.quantity}</td>`).join('')}
            <td></td>
          </tr>
          <tr>
            <td class="text-left"><strong>TOTAL</strong></td>
            ${document.items.map(item => `<td><strong>${item.quantity}</strong></td>`).join('')}
            <td></td>
          </tr>
        </tbody>
      </table>
      
      <div class="footer-section">
        <div class="signature-block">
          <div>Șef schimb subunitate,</div>
          <div class="signature-line"></div>
        </div>
        <div class="signature-block" style="text-align: right;">
          <div>Am predat din Depozit,</div>
          <div>Distribuitor</div>
          <div class="signature-line" style="margin-left: auto;"></div>
        </div>
      </div>
      
      <div style="margin-top: 20px; font-size: 8pt; color: #666; text-align: center;">
        Document generat din PyroStock la ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: ro })}
      </div>
    </body>
    </html>
  `;
}

// Generate HTML for "Îndeplinirea Comenzii"
export function generateFulfillmentPrintHTML({ document, companyName = 'ARTIFICII GROUP SRL' }: PrintTemplateProps): string {
  const eventName = document.notes?.replace(/^[^:]+:\s*/, '') || 'Foc Artificii';
  const pyrotechnist = document.partner || '-';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Îndeplinirea Comenzii - ${document.document_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif;
          padding: 15mm;
          color: #000;
          font-size: 10pt;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .title {
          text-align: center;
          font-size: 14pt;
          font-weight: bold;
          margin: 15px 0;
        }
        .event-row {
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        th, td {
          border: 1px solid #000;
          padding: 5px 6px;
          text-align: center;
          font-size: 8pt;
        }
        th {
          background-color: #e6f2ff;
          font-weight: bold;
        }
        .section-header {
          background-color: #fffde6;
          font-weight: bold;
          text-align: left;
        }
        .text-left { text-align: left; }
        .row-label {
          text-align: left;
          font-size: 8pt;
          padding-left: 10px;
        }
        .signature-section {
          margin-top: 20px;
          text-align: right;
        }
        @media print {
          body { padding: 10mm; }
        }
      </style>
    </head>
    <body>
      <div class="header-row">
        <div><strong>Unitatea:</strong> ${companyName}</div>
        <div><strong>NR:</strong> ${document.document_number.replace(/[^0-9]/g, '') || document.document_number}</div>
      </div>
      
      <div class="title">ÎNDEPLINIREA COMENZII</div>
      
      <div class="event-row">
        <strong>Eveniment:</strong> ${eventName}
      </div>
      <div class="event-row">
        <strong>Primitorul (pirotehnicianul):</strong> ${pyrotechnist}
      </div>
      
      <table>
        <thead>
          <tr>
            <th class="text-left" style="width: 180px;">Operațiunea de mișcare a<br/>materialelor pirotehnice (primire,<br/>consum, restituire/predare)</th>
            ${document.items.map(item => `<th>${item.code}<br/>${item.category}</th>`).join('')}
            <th>Semnatura de primire</th>
          </tr>
        </thead>
        <tbody>
          <tr class="section-header">
            <td colspan="${document.items.length + 2}">Materii pirotenice luate în primire:</td>
          </tr>
          <tr>
            <td class="row-label"><strong>TOTAL PRIMIT</strong></td>
            ${document.items.map(item => `<td>${item.quantity}</td>`).join('')}
            <td>Primitor</td>
          </tr>
          <tr>
            <td class="row-label"><strong>TOTAL CONSUMAT</strong></td>
            ${document.items.map(item => `<td>${item.quantity}</td>`).join('')}
            <td>Primitor</td>
          </tr>
          <tr class="section-header">
            <td colspan="${document.items.length + 2}">Materii pirotenice restituite/predate:</td>
          </tr>
          <tr>
            <td class="row-label"><strong>TOTAL PREDAT - RESTITUIT</strong></td>
            ${document.items.map(() => `<td>0</td>`).join('')}
            <td>Predator</td>
          </tr>
          <tr>
            <td class="row-label">Materii pirotenice provenite din<br/>resturi neexplodate și rateuri</td>
            ${document.items.map(() => `<td>0</td>`).join('')}
            <td>Primitor</td>
          </tr>
        </tbody>
      </table>
      
      <div class="signature-section">
        <div>Semnătura primitorului (Gestionar)</div>
        <div style="border-bottom: 1px solid #000; width: 200px; margin-top: 30px; margin-left: auto;"></div>
      </div>
      
      <div style="margin-top: 20px; font-size: 8pt; color: #666; text-align: center;">
        Document generat din PyroStock la ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: ro })}
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

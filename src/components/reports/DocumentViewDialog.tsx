import { useRef } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { InventoryDocument } from '@/hooks/useInventoryDocuments';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { CATEGORIES } from '@/types';
import { Printer, ArrowDownToLine, ArrowUpFromLine, X, FileText, ClipboardCheck } from 'lucide-react';
import { generateOrderPrintHTML, generateFulfillmentPrintHTML, generateAvizPrintHTML, printPyroDocument } from './PyroOrderPrintTemplates';

interface DocumentViewDialogProps {
  document: InventoryDocument | null;
  onClose: () => void;
}

export function DocumentViewDialog({ document, onClose }: DocumentViewDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { data: companySettings } = useCompanySettings();

  if (!document) return null;

  const isEntry = document.type === 'entry';
  const Icon = isEntry ? ArrowDownToLine : ArrowUpFromLine;
  const typeLabel = isEntry ? 'NOTĂ DE INTRARE RECEPȚIE' : 'AVIZ DE EXPEDIȚIE';
  const partnerLabel = isEntry ? 'Furnizor' : 'Beneficiar';

  const getCategoryName = (categoryId: string) => {
    return CATEGORIES.find((c) => c.id === categoryId)?.name || categoryId;
  };

  const totalQuantity = document.items.reduce((sum, item) => sum + item.quantity, 0);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Permite pop-up-uri pentru a putea printa.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${document.document_number} - ${typeLabel}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20mm;
            color: #1a1a1a;
            font-size: 11pt;
          }
          .header { 
            text-align: center; 
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #333;
          }
          .header h1 { 
            font-size: 18pt; 
            font-weight: bold;
            margin-bottom: 5px;
          }
          .header .doc-number {
            font-size: 14pt;
            font-weight: 600;
            color: #444;
          }
          .meta-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 12px;
            background: #f8f8f8;
            border-radius: 6px;
          }
          .meta-item { margin-bottom: 8px; }
          .meta-label { 
            font-weight: 600; 
            color: #555;
            display: inline-block;
            min-width: 100px;
          }
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
            background-color: #f0f0f0; 
            font-weight: 600;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .totals { 
            margin-top: 20px;
            padding: 15px;
            background: #f0f8ff;
            border-radius: 6px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
          }
          .totals-row.main {
            font-size: 13pt;
            font-weight: bold;
            border-top: 1px solid #ccc;
            padding-top: 10px;
            margin-top: 5px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 9pt;
            color: #666;
            text-align: center;
          }
          .notes {
            margin-top: 15px;
            padding: 12px;
            background: #fffef0;
            border-radius: 6px;
            border-left: 3px solid #e0d000;
          }
          @media print {
            body { padding: 10mm; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${typeLabel}</h1>
          <div class="doc-number">Nr. ${document.document_number}</div>
        </div>
        
        <div class="meta-section">
          <div>
            <div class="meta-item">
              <span class="meta-label">Data:</span>
              ${format(new Date(document.date), 'dd MMMM yyyy', { locale: ro })}
            </div>
            <div class="meta-item">
              <span class="meta-label">${partnerLabel}:</span>
              ${document.partner || '-'}
            </div>
          </div>
          <div>
            <div class="meta-item">
              <span class="meta-label">Gestiune:</span>
              ${document.warehouse || 'Principal'}
            </div>
            <div class="meta-item">
              <span class="meta-label">Operator:</span>
              ${document.operator_name || '-'}
            </div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">Nr.</th>
              <th style="width: 120px;">Cod</th>
              <th>Denumire Produs</th>
              <th style="width: 100px;">Categorie</th>
              <th class="text-right" style="width: 80px;">Cantitate</th>
              <th class="text-right" style="width: 100px;">Preț Unit.</th>
              <th class="text-right" style="width: 100px;">Valoare</th>
            </tr>
          </thead>
          <tbody>
            ${document.items.map((item, index) => {
              const value = item.quantity * (item.unit_price || 0);
              return `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td><code>${item.code}</code></td>
                  <td>${item.name}</td>
                  <td>${getCategoryName(item.category)}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${(item.unit_price || 0).toFixed(2)} RON</td>
                  <td class="text-right">${value.toFixed(2)} RON</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="totals-row">
            <span>Total produse:</span>
            <span>${document.items.length}</span>
          </div>
          <div class="totals-row">
            <span>Total cantitate:</span>
            <span>${totalQuantity} buc</span>
          </div>
          <div class="totals-row main">
            <span>VALOARE TOTALĂ:</span>
            <span>${document.total_value.toLocaleString()} RON</span>
          </div>
        </div>
        
        ${document.notes ? `
          <div class="notes">
            <strong>Observații:</strong> ${document.notes}
          </div>
        ` : ''}
        
        <div class="footer">
          Document generat din aplicația PyroSafe Keeper la ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: ro })}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <Dialog open={!!document} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${isEntry ? 'text-success' : 'text-destructive'}`} />
            {typeLabel} - {document.document_number}
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="space-y-4">
          {/* Document Meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Data</p>
              <p className="font-medium">
                {format(new Date(document.date), 'dd MMMM yyyy', { locale: ro })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{partnerLabel}</p>
              <p className="font-medium">{document.partner || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gestiune</p>
              <p className="font-medium">{document.warehouse || 'Principal'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Operator</p>
              <p className="font-medium">{document.operator_name}</p>
            </div>
          </div>

          <Separator />

          {/* Products Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Nr.</TableHead>
                  <TableHead>Cod</TableHead>
                  <TableHead>Denumire</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead className="text-right">Cantitate</TableHead>
                  <TableHead className="text-right">Preț Unit.</TableHead>
                  <TableHead className="text-right">Valoare</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {document.items.map((item, index) => {
                  const value = item.quantity * (item.unit_price || 0);
                  return (
                    <TableRow key={index}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{item.code}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-sm">{getCategoryName(item.category)}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{(item.unit_price || 0).toFixed(2)} RON</TableCell>
                      <TableCell className="text-right font-medium">{value.toFixed(2)} RON</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="p-4 bg-primary/5 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total produse:</span>
              <span className="font-medium">{document.items.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total cantitate:</span>
              <span className="font-medium">{totalQuantity} buc</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Valoare totală:</span>
              <span>{document.total_value.toLocaleString()} RON</span>
            </div>
          </div>

          {/* Notes */}
          {document.notes && (
            <div className="p-4 bg-warning/10 rounded-lg border-l-4 border-warning">
              <p className="text-sm font-medium mb-1">Observații:</p>
              <p className="text-sm">{document.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Închide
          </Button>
          
          {/* Pyro-specific print buttons for exits */}
          {!isEntry && (
            <>
              <Button 
                variant="outline" 
                onClick={() => printPyroDocument(generateOrderPrintHTML({ document, operatorName: document.operator_name }))}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Comandă Materii
              </Button>
              <Button 
                variant="outline" 
                onClick={() => printPyroDocument(generateFulfillmentPrintHTML({ document, operatorName: document.operator_name }))}
                className="gap-2"
              >
                <ClipboardCheck className="h-4 w-4" />
                Îndeplinire
              </Button>
            </>
          )}
          
          <Button onClick={isEntry ? handlePrint : () => printPyroDocument(generateAvizPrintHTML({ document, companySettings }))} className="gap-2">
            <Printer className="h-4 w-4" />
            {isEntry ? 'Printează NIR' : 'Printează Aviz'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

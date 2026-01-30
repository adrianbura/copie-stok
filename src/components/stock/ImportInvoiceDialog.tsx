import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, Upload, Loader2, CheckCircle2, AlertCircle, Sparkles, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useProducts, useWarehouseProducts } from '@/hooks/useProducts';
import { useWarehouseContext } from '@/hooks/useWarehouse';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Product, PyroCategory } from '@/types';
import type { EntryItem } from './StockEntryForm';
import type { Database } from '@/integrations/supabase/types';

type PyroCategoryDB = Database['public']['Enums']['pyro_category'];

export interface InvoiceMetadata {
  supplier: string;
  invoiceNumber: string;
  invoiceDate: string;
}

interface ImportInvoiceDialogProps {
  onImportToList: (items: EntryItem[], metadata?: InvoiceMetadata) => void;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

interface ParsedInvoiceItem {
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  category?: string;
}

interface ParsedInvoice {
  supplier: string;
  invoiceNumber: string;
  invoiceDate: string;
  items: ParsedInvoiceItem[];
}

interface ImportRow {
  productCode: string;
  quantity: number;
  unitPrice?: number;
  reference?: string;
  notes?: string;
  productName?: string;
  category?: PyroCategoryDB;
  supplier?: string;
}

export function ImportInvoiceDialog({ onImportToList, externalOpen, onExternalOpenChange }: ImportInvoiceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onExternalOpenChange || setInternalOpen;
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pdf' | 'csv'>('pdf');
  const [result, setResult] = useState<{
    invoice?: ParsedInvoice | null;
    matched: number;
    newProducts: number;
    errors: string[];
    skipped?: string[];
    totalRows?: number;
  } | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  const { selectedWarehouse } = useWarehouseContext();
  const { data: products } = useProducts();
  const { data: warehouseProducts } = useWarehouseProducts(selectedWarehouse?.id);

  const validCategories: PyroCategoryDB[] = ['F1', 'F2', 'F3', 'F4', 'T1', 'T2'];

  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const extractKeyWords = (name: string): string[] => {
    const lower = name.toLowerCase();
    const words: string[] = [];
    
    const caliberMatch = lower.match(/(\d+(?:\.\d+)?)\s*["'']/);
    if (caliberMatch) words.push(caliberMatch[0].replace(/\s/g, ''));
    
    if (lower.includes('single shot')) words.push('single shot');
    if (lower.includes('baterie')) words.push('baterie');
    if (lower.includes('bombita') || lower.includes('bombită')) words.push('bombita');
    
    const effects = ['brocade', 'crown', 'strobe', 'willow', 'peony', 'chrysanthemum', 
                    'crackling', 'glitter', 'waterfall', 'jellyfish', 'comet', 'mine'];
    effects.forEach(e => { if (lower.includes(e)) words.push(e); });
    
    return words;
  };

  const handlePDFChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast.error('Te rog selectează un fișier PDF');
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      toast.info('Se procesează factura cu AI...', { duration: 5000 });
      
      const pdfBase64 = await extractTextFromPDF(file);
      
      const { data, error } = await supabase.functions.invoke('parse-invoice', {
        body: { pdfBase64 }
      });

      if (error) {
        throw new Error(error.message || 'Eroare la procesare');
      }

      if (!data.success) {
        throw new Error(data.error || 'Nu s-au putut extrage datele');
      }

      const invoice: ParsedInvoice = data.data;
      
      const itemsToAdd: EntryItem[] = [];
      let matched = 0;
      let newProducts = 0;
      const errors: string[] = [];

      for (const item of invoice.items) {
        const itemNameLower = item.name.toLowerCase();
        
        let existingProduct = products?.find(p => 
          p.name.toLowerCase() === itemNameLower
        );
        
        if (!existingProduct) {
          const itemKeyWords = extractKeyWords(item.name);
          
          if (itemKeyWords.length >= 2) {
            existingProduct = products?.find(p => {
              const productKeyWords = extractKeyWords(p.name);
              const matchCount = itemKeyWords.filter(w => productKeyWords.includes(w)).length;
              return matchCount >= Math.ceil(itemKeyWords.length * 0.8);
            });
          }
        }

        if (existingProduct) {
          itemsToAdd.push({
            id: crypto.randomUUID(),
            product: existingProduct,
            quantity: item.quantity,
            isNew: false,
          });
          matched++;
        } else {
          itemsToAdd.push({
            id: crypto.randomUUID(),
            product: null,
            quantity: item.quantity,
            isNew: true,
            newProductCode: item.code,
            newProductName: item.name,
            category: (item.category as PyroCategory) || 'F2',
            unitPrice: item.unitPrice,
            supplier: invoice.supplier,
          });
          newProducts++;
        }
      }

      setResult({
        invoice,
        matched,
        newProducts,
        errors,
      });

      if (itemsToAdd.length > 0) {
        const metadata: InvoiceMetadata = {
          supplier: invoice.supplier || '',
          invoiceNumber: invoice.invoiceNumber || '',
          invoiceDate: invoice.invoiceDate || '',
        };
        onImportToList(itemsToAdd, metadata);
        toast.success(`${itemsToAdd.length} produse adăugate în listă pentru verificare`);
      }

    } catch (error) {
      console.error('Error processing invoice:', error);
      const message = error instanceof Error ? error.message : 'Eroare la procesarea facturii';
      toast.error(message);
      setResult({
        invoice: null,
        matched: 0,
        newProducts: 0,
        errors: [message],
      });
    } finally {
      setProcessing(false);
      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }
    }
  };

  const parseCSV = (text: string): { rows: ImportRow[]; skipped: string[]; totalRows: number } => {
    const lines = text.trim().split('\n');
    const rows: ImportRow[] = [];
    const skipped: string[] = [];
    const totalRows = lines.length - 1;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        skipped.push(`Rând ${i + 1}: rând gol`);
        continue;
      }
      
      const parts = line.split(/[,;]/).map(p => p.trim().replace(/"/g, ''));
      
      if (parts.length < 2) {
        skipped.push(`Rând ${i + 1}: format invalid (${parts[0] || 'gol'})`);
        continue;
      }
      
      const productCode = parts[0];
      if (!productCode) {
        skipped.push(`Rând ${i + 1}: cod produs lipsă`);
        continue;
      }
      
      const quantity = parseInt(parts[1], 10);
      if (isNaN(quantity) || quantity <= 0) {
        skipped.push(`Rând ${i + 1} (${productCode}): cantitate invalidă "${parts[1]}"`);
        continue;
      }
      
      const unitPrice = parts[2] ? parseFloat(parts[2]) : undefined;
      
      rows.push({
        productCode,
        quantity,
        unitPrice: unitPrice && !isNaN(unitPrice) ? unitPrice : undefined,
        reference: parts[3] || undefined,
        notes: parts[4] || undefined,
        productName: parts[5] || undefined,
        category: parts[6] ? (validCategories.includes(parts[6].toUpperCase() as PyroCategoryDB) ? parts[6].toUpperCase() as PyroCategoryDB : 'F2') : undefined,
        supplier: parts[7] || undefined,
      });
    }
    
    return { rows, skipped, totalRows };
  };

  const handleCSVChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setResult(null);

    try {
      const text = await file.text();
      const { rows, skipped, totalRows } = parseCSV(text);
      
      if (rows.length === 0) {
        setResult({ matched: 0, newProducts: 0, skipped, errors: [], totalRows });
        toast.error('Fișierul nu conține date valide pentru import');
        setProcessing(false);
        return;
      }

      const itemsToAdd: EntryItem[] = [];
      let matched = 0;
      let newProducts = 0;
      const errors: string[] = [];

      for (const row of rows) {
        const existingProduct = products?.find(p => 
          p.code.toLowerCase() === row.productCode.toLowerCase()
        );

        if (existingProduct) {
          itemsToAdd.push({
            id: crypto.randomUUID(),
            product: existingProduct,
            quantity: row.quantity,
            isNew: false,
          });
          matched++;
        } else {
          itemsToAdd.push({
            id: crypto.randomUUID(),
            product: null,
            quantity: row.quantity,
            isNew: true,
            newProductCode: row.productCode,
            newProductName: row.productName || row.productCode,
            category: (row.category || 'F2') as PyroCategory,
            unitPrice: row.unitPrice || 0,
            supplier: row.supplier,
          });
          newProducts++;
        }
      }

      setResult({ matched, newProducts, skipped, errors, totalRows });

      if (itemsToAdd.length > 0) {
        onImportToList(itemsToAdd);
        toast.success(`${itemsToAdd.length} produse adăugate în listă pentru verificare`);
      }

    } catch (error) {
      toast.error('Eroare la citirea fișierului');
    } finally {
      setProcessing(false);
      if (csvInputRef.current) {
        csvInputRef.current.value = '';
      }
    }
  };

  const resetDialog = () => {
    setResult(null);
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Upload className="h-4 w-4" />
          Import Produse
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Produse
          </DialogTitle>
          <DialogDescription>
            Importă produse din factură PDF sau fișier CSV
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'pdf' | 'csv'); setResult(null); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pdf" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Factură PDF (AI)
            </TabsTrigger>
            <TabsTrigger value="csv" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Fișier CSV
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="space-y-4 mt-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Cum funcționează:
              </p>
              <ul className="text-muted-foreground text-xs space-y-1 list-disc list-inside">
                <li>Încarcă factura în format PDF</li>
                <li>AI-ul analizează și extrage: furnizor, produse, cantități, prețuri</li>
                <li>Produsele existente sunt recunoscute automat după nume</li>
                <li>Produsele noi vor fi create la salvare</li>
              </ul>
            </div>

            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              onChange={handlePDFChange}
              className="hidden"
            />

            <Button 
              onClick={() => pdfInputRef.current?.click()} 
              disabled={processing}
              className="w-full gap-2"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Se procesează cu AI...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Selectează Factură PDF
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4 mt-4">
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p className="font-medium">Format fișier CSV:</p>
              <code className="block bg-background p-2 rounded text-xs overflow-x-auto">
                cod_produs,cantitate,pret,referinta,note,denumire,categorie,furnizor<br />
                PYRO001,10,25.50,DOC-001,Aprovizionare,Artificii F2,F2,Pyro SRL
              </code>
              <p className="text-muted-foreground text-xs">
                Separatori: virgulă sau punct și virgulă<br />
                Obligatoriu: cod_produs, cantitate
              </p>
            </div>

            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleCSVChange}
              className="hidden"
            />

            <Button 
              onClick={() => csvInputRef.current?.click()} 
              disabled={processing}
              className="w-full gap-2"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Se importă...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Selectează Fișier CSV
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {result && (
          <div className="space-y-3 mt-4">
            {/* Invoice info (PDF only) */}
            {result.invoice && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="font-medium mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Factură procesată cu succes
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Furnizor: <span className="text-foreground">{result.invoice.supplier}</span></div>
                  <div>Nr: <span className="text-foreground">{result.invoice.invoiceNumber}</span></div>
                  <div>Data: <span className="text-foreground">{result.invoice.invoiceDate}</span></div>
                  <div>Produse: <span className="text-foreground">{result.invoice.items.length}</span></div>
                </div>
              </div>
            )}

            {/* Stats */}
            {(result.matched > 0 || result.newProducts > 0) && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="font-medium mb-2">
                  Raport import{result.totalRows !== undefined ? ` (${result.totalRows} rânduri)` : ''}:
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    <span>Produse recunoscute: {result.matched}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    <span>Produse noi: {result.newProducts}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Skipped rows (CSV only) */}
            {result.skipped && result.skipped.length > 0 && (
              <Alert className="border-warning/50 bg-warning/10">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertDescription>
                  <div className="font-medium mb-1">{result.skipped.length} rânduri sărite:</div>
                  <ul className="text-xs space-y-1 max-h-24 overflow-y-auto">
                    {result.skipped.map((msg, i) => (
                      <li key={i}>• {msg}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Erori:</div>
                  <ul className="text-xs space-y-1 max-h-24 overflow-y-auto">
                    {result.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

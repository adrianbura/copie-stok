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
import { FileText, Upload, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProducts';
import type { Product, PyroCategory } from '@/types';
import type { EntryItem } from './StockEntryForm';

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

export function ImportInvoiceDialog({ onImportToList, externalOpen, onExternalOpenChange }: ImportInvoiceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onExternalOpenChange || setInternalOpen;
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    invoice: ParsedInvoice | null;
    matched: number;
    newProducts: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: products } = useProducts();

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // For now, we'll send the file as base64 and let the AI extract text
    // In a production app, you might use pdf.js or similar for text extraction
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // Match items with existing products
      const itemsToAdd: EntryItem[] = [];
      let matched = 0;
      let newProducts = 0;
      const errors: string[] = [];

      for (const item of invoice.items) {
        // Try to find existing product - prioritize name matching over AI-generated codes
        // 1. First try exact name match
        // 2. Then try fuzzy name match (contains key words)
        // 3. AI-generated codes are unique per invoice, so we don't match by code
        
        const itemNameLower = item.name.toLowerCase();
        
        // Extract key identifiers from the item name for fuzzy matching
        const extractKeyWords = (name: string): string[] => {
          const lower = name.toLowerCase();
          const words: string[] = [];
          
          // Extract caliber (1", 1.2", 2", 3", etc.)
          const caliberMatch = lower.match(/(\d+(?:\.\d+)?)\s*["'']/);
          if (caliberMatch) words.push(caliberMatch[0].replace(/\s/g, ''));
          
          // Extract type keywords
          if (lower.includes('single shot')) words.push('single shot');
          if (lower.includes('baterie')) words.push('baterie');
          if (lower.includes('bombita') || lower.includes('bombită')) words.push('bombita');
          
          // Extract color/effect keywords
          const effects = ['brocade', 'crown', 'strobe', 'willow', 'peony', 'chrysanthemum', 
                          'crackling', 'glitter', 'waterfall', 'jellyfish', 'comet', 'mine'];
          effects.forEach(e => { if (lower.includes(e)) words.push(e); });
          
          return words;
        };
        
        // Find exact name match first
        let existingProduct = products?.find(p => 
          p.name.toLowerCase() === itemNameLower
        );
        
        // If no exact match, try fuzzy matching
        if (!existingProduct) {
          const itemKeyWords = extractKeyWords(item.name);
          
          if (itemKeyWords.length >= 2) {
            existingProduct = products?.find(p => {
              const productKeyWords = extractKeyWords(p.name);
              // Match if at least 80% of key words match
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
          // Create new product entry with AI-generated code
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const resetDialog = () => {
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Import Factură PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Factură cu AI
          </DialogTitle>
          <DialogDescription>
            Încarcă o factură PDF și AI-ul va extrage automat produsele
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Cum funcționează:
            </p>
            <ul className="text-muted-foreground text-xs space-y-1 list-disc list-inside">
              <li>Încarcă factura în format PDF</li>
              <li>AI-ul analizează și extrage: furnizor, produse, cantități, prețuri</li>
              <li>Produsele sunt adăugate în lista temporară pentru verificare</li>
              <li>Produsele existente sunt recunoscute automat după cod/nume</li>
              <li>Produsele noi vor fi create la salvare</li>
            </ul>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button 
            onClick={handleButtonClick} 
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

          {result && (
            <div className="space-y-3">
              {/* Invoice info */}
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
                  <div className="font-medium mb-2">Raport import:</div>
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

              {/* Errors */}
              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Erori:</div>
                    <ul className="text-xs space-y-1">
                      {result.errors.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

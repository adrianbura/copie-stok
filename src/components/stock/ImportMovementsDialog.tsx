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
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useProducts, useUpdateProduct, useCreateProduct } from '@/hooks/useProducts';
import { useCreateStockMovement } from '@/hooks/useStockMovements';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Database } from '@/integrations/supabase/types';

type PyroCategory = Database['public']['Enums']['pyro_category'];

interface ImportMovementsDialogProps {
  type: 'entry' | 'exit';
}

interface ImportRow {
  productCode: string;
  quantity: number;
  unitPrice?: number;
  reference?: string;
  notes?: string;
  productName?: string;
  category?: PyroCategory;
  supplier?: string;
}

interface ImportResult {
  success: number;
  created: number;
  errors: string[];
}

export function ImportMovementsDialog({ type }: ImportMovementsDialogProps) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: products } = useProducts();
  const updateProduct = useUpdateProduct();
  const createProduct = useCreateProduct();
  const createMovement = useCreateStockMovement();

  const validCategories: PyroCategory[] = ['F1', 'F2', 'F3', 'F4', 'T1', 'T2'];

  const parseCSV = (text: string): ImportRow[] => {
    const lines = text.trim().split('\n');
    const rows: ImportRow[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(/[,;]/).map(p => p.trim().replace(/"/g, ''));
      if (parts.length >= 2) {
        const quantity = parseInt(parts[1], 10);
        const unitPrice = parts[2] ? parseFloat(parts[2]) : undefined;
        if (!isNaN(quantity) && quantity > 0) {
          // Parse category if provided
          const categoryRaw = parts[5]?.toUpperCase();
          const category = validCategories.includes(categoryRaw as PyroCategory) 
            ? categoryRaw as PyroCategory 
            : undefined;
          
          rows.push({
            productCode: parts[0],
            quantity,
            unitPrice: unitPrice && !isNaN(unitPrice) ? unitPrice : undefined,
            reference: parts[3] || undefined,
            notes: parts[4] || undefined,
            productName: parts[5] || undefined,
            category: parts[6] ? (validCategories.includes(parts[6].toUpperCase() as PyroCategory) ? parts[6].toUpperCase() as PyroCategory : 'F2') : undefined,
            supplier: parts[7] || undefined,
          });
        }
      }
    }
    
    return rows;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        toast.error('Fișierul nu conține date valide');
        setImporting(false);
        return;
      }

      const importResult: ImportResult = { success: 0, created: 0, errors: [] };

      for (const row of rows) {
        let product = products?.find(p => 
          p.code.toLowerCase() === row.productCode.toLowerCase()
        );

        // For entries: create the product if it doesn't exist
        if (!product && type === 'entry') {
          try {
            const newProduct = await createProduct.mutateAsync({
              code: row.productCode,
              name: row.productName || row.productCode,
              category: row.category || 'F2',
              quantity: 0,
              unit_price: row.unitPrice || 0,
              min_stock: 10,
              supplier: row.supplier || null,
            });
            product = newProduct;
            importResult.created++;
          } catch (error) {
            importResult.errors.push(`Eroare la crearea produsului ${row.productCode}: ${error}`);
            continue;
          }
        } else if (!product && type === 'exit') {
          importResult.errors.push(`Produs negăsit: ${row.productCode}`);
          continue;
        }

        if (!product) continue;

        if (type === 'exit' && product.quantity < row.quantity) {
          importResult.errors.push(
            `Stoc insuficient pentru ${row.productCode}: disponibil ${product.quantity}, cerut ${row.quantity}`
          );
          continue;
        }

        try {
          // Update product price if provided (for entries)
          if (type === 'entry' && row.unitPrice !== undefined) {
            await updateProduct.mutateAsync({
              id: product.id,
              unit_price: row.unitPrice,
            });
          }
          
          await createMovement.mutateAsync({
            product_id: product.id,
            quantity: row.quantity,
            type,
            reference: row.reference,
            notes: row.notes,
          });
          importResult.success++;
        } catch (error) {
          importResult.errors.push(`Eroare la ${row.productCode}: ${error}`);
        }
      }

      setResult(importResult);
      
      if (importResult.success > 0 || importResult.created > 0) {
        const messages = [];
        if (importResult.success > 0) messages.push(`${importResult.success} mișcări importate`);
        if (importResult.created > 0) messages.push(`${importResult.created} produse noi create`);
        toast.success(messages.join(', '));
      }
      
      if (importResult.errors.length > 0) {
        toast.error(`${importResult.errors.length} erori la import`);
      }

    } catch (error) {
      toast.error('Eroare la citirea fișierului');
    } finally {
      setImporting(false);
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
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import din Fișier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import {type === 'entry' ? 'Intrări' : 'Ieșiri'} din Fișier
          </DialogTitle>
          <DialogDescription>
            Importă mișcări de stoc dintr-un fișier CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium">Format fișier CSV:</p>
            <code className="block bg-background p-2 rounded text-xs overflow-x-auto">
              cod_produs,cantitate,pret_unitar,referinta,note,denumire,categorie,furnizor<br />
              PYRO001,10,25.50,DOC-001,Aprovizionare,Artificii F2,F2,Pyro SRL<br />
              PYRO002,5,15.00,DOC-002,,,,
            </code>
            <p className="text-muted-foreground text-xs">
              Separatori acceptați: virgulă (,) sau punct și virgulă (;)<br />
              <strong>Produse noi:</strong> La import intrări, produsele inexistente sunt create automat.<br />
              Câmpuri obligatorii: cod_produs, cantitate<br />
              Câmpuri opționale: pret_unitar, referinta, note, denumire, categorie (F1-F4, T1-T2), furnizor
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button 
            onClick={handleButtonClick} 
            disabled={importing}
            className="w-full gap-2"
          >
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                Se importă...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Selectează Fișier CSV
              </>
            )}
          </Button>

          {result && (
            <div className="space-y-2">
              {(result.success > 0 || result.created > 0) && (
                <Alert className="border-success/50 bg-success/10">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success">
                    {result.success > 0 && `${result.success} mișcări importate`}
                    {result.success > 0 && result.created > 0 && ', '}
                    {result.created > 0 && `${result.created} produse noi create`}
                  </AlertDescription>
                </Alert>
              )}
              
              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">{result.errors.length} erori:</div>
                    <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
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

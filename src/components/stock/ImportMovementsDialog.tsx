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
import { useProducts, useWarehouseProducts } from '@/hooks/useProducts';
import { useWarehouseContext } from '@/hooks/useWarehouse';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Database } from '@/integrations/supabase/types';
import type { Product, PyroCategory } from '@/types';

type PyroCategoryDB = Database['public']['Enums']['pyro_category'];

interface ImportMovementsDialogProps {
  type: 'entry' | 'exit';
  onImportToList?: (items: ImportedItem[]) => void;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export interface ImportedItem {
  id: string;
  product: Product | null;
  quantity: number;
  isNew?: boolean;
  newProductName?: string;
  newProductCode?: string;
  category?: PyroCategory;
  unitPrice?: number;
  supplier?: string;
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

interface ImportResult {
  added: number;
  created: number;
  skipped: string[];
  errors: string[];
  totalRows: number;
}

export function ImportMovementsDialog({ type, onImportToList, externalOpen, onExternalOpenChange }: ImportMovementsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onExternalOpenChange || setInternalOpen;
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { selectedWarehouse } = useWarehouseContext();
  const { data: allProducts } = useProducts();
  // For exits, use warehouse-specific products with accurate stock levels
  const { data: warehouseProducts } = useWarehouseProducts(selectedWarehouse?.id);

  const validCategories: PyroCategoryDB[] = ['F1', 'F2', 'F3', 'F4', 'T1', 'T2'];

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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const { rows, skipped, totalRows } = parseCSV(text);
      
      if (rows.length === 0) {
        setResult({ added: 0, created: 0, skipped, errors: [], totalRows });
        toast.error('Fișierul nu conține date valide pentru import');
        setImporting(false);
        return;
      }

      const importResult: ImportResult = { added: 0, created: 0, skipped, errors: [], totalRows };
      const itemsToAdd: ImportedItem[] = [];

      for (const row of rows) {
        // For exits, use warehouse-specific products with accurate stock
        // For entries, use all products catalog
        const productsToSearch = type === 'exit' ? warehouseProducts : allProducts;
        const existingProduct = productsToSearch?.find(p => 
          p.code.toLowerCase() === row.productCode.toLowerCase()
        );

        if (existingProduct) {
          // Check stock for exits - now using warehouse-specific quantity
          if (type === 'exit' && existingProduct.quantity < row.quantity) {
            importResult.errors.push(
              `Stoc insuficient pentru ${row.productCode}: disponibil ${existingProduct.quantity}, cerut ${row.quantity}`
            );
            continue;
          }

          itemsToAdd.push({
            id: crypto.randomUUID(),
            product: existingProduct,
            quantity: row.quantity,
            isNew: false,
          });
          importResult.added++;
        } else if (type === 'entry') {
          // For entries, create new product entry
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
          importResult.created++;
        } else {
          // For exits, product must exist in selected warehouse
          importResult.errors.push(`Produs negăsit în depozit: ${row.productCode}`);
        }
      }

      // Add items to the temporary list
      if (itemsToAdd.length > 0 && onImportToList) {
        onImportToList(itemsToAdd);
      }

      setResult(importResult);
      
      if (importResult.added > 0 || importResult.created > 0) {
        const messages = [];
        if (importResult.added > 0) messages.push(`${importResult.added} produse existente`);
        if (importResult.created > 0) messages.push(`${importResult.created} produse noi`);
        toast.success(`Adăugate în listă: ${messages.join(', ')}`);
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
            Importă produse din CSV în lista temporară pentru verificare
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
              <strong>Produsele vor fi adăugate în lista temporară</strong> pentru verificare.<br />
              {type === 'entry' && <><strong>Produse noi:</strong> Produsele inexistente vor fi create automat la salvare.<br /></>}
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
            <div className="space-y-3">
              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="font-medium mb-2">Raport import ({result.totalRows} rânduri în fișier):</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    <span>Produse existente: {result.added}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    <span>Produse noi: {result.created}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-warning" />
                    <span>Sărite (parse): {result.skipped.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-destructive" />
                    <span>Erori: {result.errors.length}</span>
                  </div>
                </div>
              </div>

              {/* Skipped rows */}
              {result.skipped.length > 0 && (
                <Alert className="border-warning/50 bg-warning/10">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <AlertDescription>
                    <div className="font-medium mb-1">{result.skipped.length} rânduri sărite la parsare:</div>
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
                    <div className="font-medium mb-1">{result.errors.length} erori la procesare:</div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
import { useProducts } from '@/hooks/useProducts';
import { useCreateStockMovement } from '@/hooks/useStockMovements';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportMovementsDialogProps {
  type: 'entry' | 'exit';
}

interface ImportRow {
  productCode: string;
  quantity: number;
  reference?: string;
  notes?: string;
}

interface ImportResult {
  success: number;
  errors: string[];
}

export function ImportMovementsDialog({ type }: ImportMovementsDialogProps) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: products } = useProducts();
  const createMovement = useCreateStockMovement();

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
        if (!isNaN(quantity) && quantity > 0) {
          rows.push({
            productCode: parts[0],
            quantity,
            reference: parts[2] || undefined,
            notes: parts[3] || undefined,
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

      const importResult: ImportResult = { success: 0, errors: [] };

      for (const row of rows) {
        const product = products?.find(p => 
          p.code.toLowerCase() === row.productCode.toLowerCase()
        );

        if (!product) {
          importResult.errors.push(`Produs negăsit: ${row.productCode}`);
          continue;
        }

        if (type === 'exit' && product.quantity < row.quantity) {
          importResult.errors.push(
            `Stoc insuficient pentru ${row.productCode}: disponibil ${product.quantity}, cerut ${row.quantity}`
          );
          continue;
        }

        try {
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
      
      if (importResult.success > 0) {
        toast.success(`${importResult.success} mișcări importate cu succes`);
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
            <code className="block bg-background p-2 rounded text-xs">
              cod_produs,cantitate,referinta,note<br />
              PYRO001,10,DOC-001,Aprovizionare<br />
              PYRO002,5,DOC-002,
            </code>
            <p className="text-muted-foreground text-xs">
              Separatori acceptați: virgulă (,) sau punct și virgulă (;)
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
              {result.success > 0 && (
                <Alert className="border-success/50 bg-success/10">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success">
                    {result.success} mișcări importate cu succes
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

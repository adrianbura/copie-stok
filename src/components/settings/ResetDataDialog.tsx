import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useWarehouseContext } from '@/hooks/useWarehouse';

interface ResetDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetDataDialog({ open, onOpenChange }: ResetDataDialogProps) {
  const { selectedWarehouse } = useWarehouseContext();
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const queryClient = useQueryClient();
  const [options, setOptions] = useState({
    movements: true,
    products: true,
    alerts: true,
    documents: true,
  });

  const canReset = confirmText === 'RESET' && Object.values(options).some(Boolean);

  const handleReset = async () => {
    if (!canReset) return;
    
    if (!selectedWarehouse) {
      toast.error('Te rugăm să selectezi un depozit');
      return;
    }
    
    setIsResetting(true);
    
    try {
      // Delete warehouse-specific data only
      if (options.movements) {
        const { error: movementsError } = await supabase
          .from('stock_movements')
          .delete()
          .eq('warehouse_id', selectedWarehouse.id);
        
        if (movementsError) throw movementsError;
      }

      if (options.alerts) {
        // Get product IDs from warehouse stock
        const { data: warehouseStock } = await supabase
          .from('warehouse_stock')
          .select('product_id')
          .eq('warehouse_id', selectedWarehouse.id);
        
        const productIds = warehouseStock?.map(ws => ws.product_id) || [];
        
        if (productIds.length > 0) {
          const { error: alertsError } = await supabase
            .from('alerts')
            .delete()
            .in('product_id', productIds);
          
          if (alertsError) throw alertsError;
        }
      }

      if (options.documents) {
        const { error: documentsError } = await supabase
          .from('inventory_documents')
          .delete()
          .eq('warehouse', selectedWarehouse.id);
        
        if (documentsError) throw documentsError;
      }

      if (options.products) {
        // Delete warehouse stock entries for this warehouse
        const { error: warehouseStockError } = await supabase
          .from('warehouse_stock')
          .delete()
          .eq('warehouse_id', selectedWarehouse.id);
        
        if (warehouseStockError) throw warehouseStockError;
        
        // Delete movements if not already deleted
        if (!options.movements) {
          const { error: movementsError } = await supabase
            .from('stock_movements')
            .delete()
            .eq('warehouse_id', selectedWarehouse.id);
          
          if (movementsError) throw movementsError;
        }
      }

      toast.success(`Datele din ${selectedWarehouse.name} au fost șterse cu succes`);
      onOpenChange(false);
      setConfirmText('');
      
      // Clear all cached queries to ensure document numbers reset to 1
      queryClient.clear();
      
      // Reload to refresh all data
      window.location.reload();
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Eroare la ștergerea datelor');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Resetare Date
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-4">
            <p>
              <strong className="text-foreground">Atenție!</strong> Această acțiune este ireversibilă. 
              Toate datele selectate din <strong className="text-foreground">{selectedWarehouse?.name}</strong> vor fi șterse permanent.
            </p>
            
            <div className="space-y-3 py-2">
              <Label className="text-foreground font-medium">Selectează ce dorești să ștergi:</Label>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="movements"
                    checked={options.movements}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, movements: checked as boolean }))
                    }
                  />
                  <label htmlFor="movements" className="text-sm cursor-pointer">
                    Mișcări de stoc (intrări și ieșiri)
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="products"
                    checked={options.products}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, products: checked as boolean }))
                    }
                  />
                  <label htmlFor="products" className="text-sm cursor-pointer">
                    Stoc depozit (șterge cantitățile și mișcările din acest depozit)
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="alerts"
                    checked={options.alerts}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, alerts: checked as boolean }))
                    }
                  />
                  <label htmlFor="alerts" className="text-sm cursor-pointer">
                    Alerte
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="documents"
                    checked={options.documents}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, documents: checked as boolean }))
                    }
                  />
                  <label htmlFor="documents" className="text-sm cursor-pointer">
                    Documente istoric (Intrări și Ieșiri)
                  </label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-foreground">
                Scrie <span className="font-mono font-bold text-destructive">RESET</span> pentru a confirma:
              </Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="RESET"
                className="font-mono"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>Anulează</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={!canReset || isResetting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isResetting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Se șterge...
              </>
            ) : (
              'Șterge datele'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

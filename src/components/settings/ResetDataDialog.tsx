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

interface ResetDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetDataDialog({ open, onOpenChange }: ResetDataDialogProps) {
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
    
    setIsResetting(true);
    
    try {
      // Delete in order to respect foreign key constraints
      if (options.movements) {
        const { error: movementsError } = await supabase
          .from('stock_movements')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (movementsError) throw movementsError;
      }

      if (options.alerts) {
        const { error: alertsError } = await supabase
          .from('alerts')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (alertsError) throw alertsError;
      }

      if (options.documents) {
        const { error: documentsError } = await supabase
          .from('inventory_documents')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (documentsError) throw documentsError;
      }

      if (options.products) {
        // First delete movements and alerts related to products if not already deleted
        if (!options.movements) {
          const { error: movementsError } = await supabase
            .from('stock_movements')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
          
          if (movementsError) throw movementsError;
        }
        
        if (!options.alerts) {
          const { error: alertsError } = await supabase
            .from('alerts')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
          
          if (alertsError) throw alertsError;
        }

        const { error: productsError } = await supabase
          .from('products')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (productsError) throw productsError;
      }

      toast.success('Datele au fost șterse cu succes');
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
              Toate datele selectate vor fi șterse permanent.
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
                    Produse (include mișcări și alerte asociate)
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

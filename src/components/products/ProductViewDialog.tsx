import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Product } from '@/types';
import { CategoryBadge } from '@/components/ui/category-badge';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Package, MapPin, Calendar, Scale, AlertTriangle, ShieldCheck, Building2 } from 'lucide-react';

interface ProductViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function ProductViewDialog({ open, onOpenChange, product }: ProductViewDialogProps) {
  if (!product) return null;

  const expiryDate = product.expiry_date ? new Date(product.expiry_date) : null;
  const isLowStock = product.quantity <= product.min_stock;
  const isExpiringSoon = expiryDate 
    ? expiryDate <= new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Detalii Produs
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header with name and category */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold">{product.name}</h3>
              <p className="text-sm text-muted-foreground font-mono">{product.code}</p>
            </div>
            <CategoryBadge category={product.category} />
          </div>

          {/* Stock info */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/50">
            <div className="text-center">
              <p className="text-2xl font-bold">
                <span className={isLowStock ? 'text-destructive' : 'text-foreground'}>
                  {product.quantity}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">Cantitate</p>
              {isLowStock && (
                <p className="text-xs text-destructive flex items-center justify-center gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3" />
                  Stoc scăzut
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{product.min_stock}</p>
              <p className="text-xs text-muted-foreground">Stoc Minim</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{Number(product.unit_price).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Preț (RON)</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {product.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Locație</p>
                  <p className="font-medium">{product.location}</p>
                </div>
              </div>
            )}
            
            {product.supplier && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Furnizor</p>
                  <p className="font-medium">{product.supplier}</p>
                </div>
              </div>
            )}
            
            {expiryDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Data expirării</p>
                  <p className={`font-medium ${isExpiringSoon ? 'text-warning' : ''}`}>
                    {format(expiryDate, 'd MMMM yyyy', { locale: ro })}
                  </p>
                </div>
              </div>
            )}
            
            {product.batch_number && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Nr. Lot</p>
                  <p className="font-medium">{product.batch_number}</p>
                </div>
              </div>
            )}
            
            {product.net_weight && (
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Greutate Netă</p>
                  <p className="font-medium">{product.net_weight} kg</p>
                </div>
              </div>
            )}
            
            {product.hazard_class && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Clasă Pericol</p>
                  <p className="font-medium">{product.hazard_class}</p>
                </div>
              </div>
            )}
            
            {product.certification && (
              <div className="flex items-center gap-2 col-span-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Certificare</p>
                  <p className="font-medium">{product.certification}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

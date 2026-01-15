import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockProducts } from '@/data/mockData';
import { ArrowUpFromLine, Save, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StockExitFormProps {
  onSuccess?: () => void;
}

export function StockExitForm({ onSuccess }: StockExitFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    documentNumber: '',
    reason: 'Vânzare',
    notes: '',
  });

  const selectedProduct = mockProducts.find((p) => p.id === formData.productId);
  const requestedQuantity = parseInt(formData.quantity) || 0;
  const insufficientStock =
    selectedProduct && requestedQuantity > selectedProduct.quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (insufficientStock) {
      toast({
        title: 'Eroare',
        description: 'Cantitatea solicitată depășește stocul disponibil.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Ieșire înregistrată',
      description: `Au fost scoase ${formData.quantity} unități din stoc.`,
    });

    setFormData({
      productId: '',
      quantity: '',
      documentNumber: '',
      reason: 'Vânzare',
      notes: '',
    });

    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpFromLine className="h-5 w-5 text-destructive" />
          Formular Ieșire Stoc
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product">Produs *</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) =>
                  setFormData({ ...formData, productId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează produsul" />
                </SelectTrigger>
                <SelectContent>
                  {mockProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs">{product.code}</span>
                        <span>{product.name}</span>
                        <span className="text-muted-foreground">
                          ({product.quantity} {product.unit})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <p
                  className={cn(
                    'text-xs',
                    selectedProduct.quantity <= selectedProduct.minStock
                      ? 'text-warning'
                      : 'text-muted-foreground'
                  )}
                >
                  Stoc disponibil: {selectedProduct.quantity} {selectedProduct.unit}
                  {selectedProduct.quantity <= selectedProduct.minStock && (
                    <span className="ml-1">(⚠️ sub limita minimă)</span>
                  )}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Cantitate *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedProduct?.quantity}
                placeholder="Ex: 50"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                className={cn(insufficientStock && 'border-destructive')}
                required
              />
              {insufficientStock && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Stoc insuficient
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentNumber">Număr Document *</Label>
              <Input
                id="documentNumber"
                placeholder="Ex: AV-2024-0090"
                value={formData.documentNumber}
                onChange={(e) =>
                  setFormData({ ...formData, documentNumber: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motiv</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) =>
                  setFormData({ ...formData, reason: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vânzare">Vânzare</SelectItem>
                  <SelectItem value="Transfer">Transfer între depozite</SelectItem>
                  <SelectItem value="Casare">Casare/Pierdere</SelectItem>
                  <SelectItem value="Retur">Retur către furnizor</SelectItem>
                  <SelectItem value="Corecție">Corecție inventar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observații</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Client: Compania ABC, Contact: 0721..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              variant="destructive"
              className="gap-2"
              disabled={insufficientStock}
            >
              <Save className="h-4 w-4" />
              Salvează Ieșirea
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setFormData({
                  productId: '',
                  quantity: '',
                  documentNumber: '',
                  reason: 'Vânzare',
                  notes: '',
                })
              }
            >
              <X className="h-4 w-4 mr-2" />
              Resetează
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

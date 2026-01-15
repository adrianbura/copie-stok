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
import { ArrowDownToLine, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StockEntryFormProps {
  onSuccess?: () => void;
}

export function StockEntryForm({ onSuccess }: StockEntryFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    documentNumber: '',
    reason: 'Aprovizionare',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: 'Intrare înregistrată',
      description: `Au fost adăugate ${formData.quantity} unități în stoc.`,
    });
    
    setFormData({
      productId: '',
      quantity: '',
      documentNumber: '',
      reason: 'Aprovizionare',
      notes: '',
    });
    
    onSuccess?.();
  };

  const selectedProduct = mockProducts.find((p) => p.id === formData.productId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDownToLine className="h-5 w-5 text-success" />
          Formular Intrare Stoc
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
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <p className="text-xs text-muted-foreground">
                  Stoc actual: {selectedProduct.quantity} {selectedProduct.unit}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Cantitate *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Ex: 100"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentNumber">Număr Document *</Label>
              <Input
                id="documentNumber"
                placeholder="Ex: NIR-2024-0157"
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
                  <SelectItem value="Aprovizionare">Aprovizionare</SelectItem>
                  <SelectItem value="Retur">Retur de la client</SelectItem>
                  <SelectItem value="Transfer">Transfer între depozite</SelectItem>
                  <SelectItem value="Corecție">Corecție inventar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observații</Label>
            <Textarea
              id="notes"
              placeholder="Adaugă detalii suplimentare..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="gap-2 gradient-fire text-white border-0">
              <Save className="h-4 w-4" />
              Salvează Intrarea
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setFormData({
                  productId: '',
                  quantity: '',
                  documentNumber: '',
                  reason: 'Aprovizionare',
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

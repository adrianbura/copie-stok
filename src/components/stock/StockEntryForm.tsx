import { useState } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockProducts } from '@/data/mockData';
import { PyroCategory, CATEGORIES } from '@/types';
import { ArrowDownToLine, Save, X, CalendarIcon, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StockEntryFormProps {
  onSuccess?: () => void;
}

export function StockEntryForm({ onSuccess }: StockEntryFormProps) {
  const { toast } = useToast();
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    productId: '',
    newProductName: '',
    newProductCode: '',
    category: '' as PyroCategory | '',
    quantity: '',
    unit: 'buc',
    documentNumber: '',
    supplier: '',
    reason: 'Aprovizionare',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productName = isNewProduct 
      ? formData.newProductName 
      : mockProducts.find((p) => p.id === formData.productId)?.name;
    
    toast({
      title: 'Intrare înregistrată',
      description: `Au fost adăugate ${formData.quantity} unități de "${productName}" în stoc.`,
    });
    
    setFormData({
      productId: '',
      newProductName: '',
      newProductCode: '',
      category: '',
      quantity: '',
      unit: 'buc',
      documentNumber: '',
      supplier: '',
      reason: 'Aprovizionare',
      notes: '',
    });
    setEntryDate(new Date());
    setIsNewProduct(false);
    
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
          {/* Toggle pentru produs nou/existent */}
          <div className="flex items-center gap-4 pb-2 border-b border-border">
            <Button
              type="button"
              variant={!isNewProduct ? "default" : "outline"}
              size="sm"
              onClick={() => setIsNewProduct(false)}
            >
              Produs Existent
            </Button>
            <Button
              type="button"
              variant={isNewProduct ? "default" : "outline"}
              size="sm"
              onClick={() => setIsNewProduct(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Produs Nou
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Data intrării */}
            <div className="space-y-2">
              <Label>Data Intrării *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !entryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {entryDate ? format(entryDate, "PPP", { locale: ro }) : <span>Selectează data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={entryDate}
                    onSelect={(date) => date && setEntryDate(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Selectare sau introducere produs */}
            {!isNewProduct ? (
              <div className="space-y-2">
                <Label htmlFor="product">Produs Existent *</Label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, productId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează produsul" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
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
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newProductName">Nume Produs Nou *</Label>
                  <Input
                    id="newProductName"
                    placeholder="Ex: Racheta Aurie 50mm"
                    value={formData.newProductName}
                    onChange={(e) =>
                      setFormData({ ...formData, newProductName: e.target.value })
                    }
                    required={isNewProduct}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newProductCode">Cod Produs *</Label>
                  <Input
                    id="newProductCode"
                    placeholder="Ex: RACH-050-AU"
                    value={formData.newProductCode}
                    onChange={(e) =>
                      setFormData({ ...formData, newProductCode: e.target.value })
                    }
                    required={isNewProduct}
                  />
                </div>
              </>
            )}

            {/* Categoria produsului */}
            <div className="space-y-2">
              <Label htmlFor="category">Categorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as PyroCategory })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează categoria" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.id}</span>
                        <span className="text-muted-foreground text-xs">- {cat.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cantitate */}
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

            {/* Unitate de măsură */}
            <div className="space-y-2">
              <Label htmlFor="unit">Unitate</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) =>
                  setFormData({ ...formData, unit: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="buc">Bucăți (buc)</SelectItem>
                  <SelectItem value="kg">Kilograme (kg)</SelectItem>
                  <SelectItem value="set">Seturi (set)</SelectItem>
                  <SelectItem value="cutie">Cutii (cutie)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Număr document */}
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

            {/* Furnizor */}
            <div className="space-y-2">
              <Label htmlFor="supplier">Furnizor</Label>
              <Input
                id="supplier"
                placeholder="Ex: PyroTech SRL"
                value={formData.supplier}
                onChange={(e) =>
                  setFormData({ ...formData, supplier: e.target.value })
                }
              />
            </div>

            {/* Motiv */}
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
                <SelectContent className="z-50">
                  <SelectItem value="Aprovizionare">Aprovizionare</SelectItem>
                  <SelectItem value="Retur">Retur de la client</SelectItem>
                  <SelectItem value="Transfer">Transfer între depozite</SelectItem>
                  <SelectItem value="Corecție">Corecție inventar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observații */}
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

          {/* Butoane */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="gap-2 gradient-fire text-white border-0">
              <Save className="h-4 w-4" />
              Salvează Intrarea
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  productId: '',
                  newProductName: '',
                  newProductCode: '',
                  category: '',
                  quantity: '',
                  unit: 'buc',
                  documentNumber: '',
                  supplier: '',
                  reason: 'Aprovizionare',
                  notes: '',
                });
                setEntryDate(new Date());
                setIsNewProduct(false);
              }}
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
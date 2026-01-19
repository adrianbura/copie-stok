import { useState } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts, useCreateProduct } from '@/hooks/useProducts';
import { useCreateStockMovement } from '@/hooks/useStockMovements';
import { PyroCategory, CATEGORIES } from '@/types';
import { ArrowDownToLine, Save, X, CalendarIcon, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StockEntryFormProps {
  onSuccess?: () => void;
}

export function StockEntryForm({ onSuccess }: StockEntryFormProps) {
  const { data: products } = useProducts();
  const createProduct = useCreateProduct();
  const createMovement = useCreateStockMovement();
  
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    productId: '',
    newProductName: '',
    newProductCode: '',
    category: '' as PyroCategory | '',
    quantity: '',
    unitPrice: '',
    documentNumber: '',
    supplier: '',
    notes: '',
  });

  const isSubmitting = createProduct.isPending || createMovement.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantity = parseInt(formData.quantity) || 0;
    
    if (quantity <= 0) {
      toast.error('Cantitatea trebuie să fie mai mare decât 0');
      return;
    }
    
    try {
      if (isNewProduct) {
        // Validate new product fields
        if (!formData.newProductCode || !formData.newProductName || !formData.category) {
          toast.error('Completează toate câmpurile obligatorii pentru produsul nou');
          return;
        }
        
        const unitPrice = parseFloat(formData.unitPrice) || 0;
        
        // Create new product with initial stock of 0 (will be updated by movement)
        const newProduct = await createProduct.mutateAsync({
          code: formData.newProductCode,
          name: formData.newProductName,
          category: formData.category as PyroCategory,
          quantity: 0, // Start with 0, movement will add the quantity
          min_stock: 10,
          unit_price: unitPrice,
          supplier: formData.supplier || null,
          location: null,
          batch_number: null,
          expiry_date: null,
          net_weight: null,
          hazard_class: null,
          certification: null,
        });
        
        // Create stock movement for the initial entry
        await createMovement.mutateAsync({
          product_id: newProduct.id,
          type: 'entry',
          quantity: quantity,
          reference: formData.documentNumber || 'Stoc inițial',
          notes: formData.notes || `Produs nou adăugat: ${formData.newProductName}`,
          date: entryDate.toISOString(),
        });
        
        toast.success(`Produs nou "${formData.newProductName}" creat cu ${quantity} bucăți`);
      } else {
        // Validate existing product selection
        if (!formData.productId) {
          toast.error('Selectează un produs existent');
          return;
        }
        
        // Create stock movement for existing product
        await createMovement.mutateAsync({
          product_id: formData.productId,
          type: 'entry',
          quantity: quantity,
          reference: formData.documentNumber || undefined,
          notes: formData.notes || undefined,
          date: entryDate.toISOString(),
        });
      }
      
      // Reset form
      setFormData({
        productId: '',
        newProductName: '',
        newProductCode: '',
        category: '',
        quantity: '',
        unitPrice: '',
        documentNumber: '',
        supplier: '',
        notes: '',
      });
      setEntryDate(new Date());
      setIsNewProduct(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const selectedProduct = products?.find((p) => p.id === formData.productId);

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
          <div className="flex items-center gap-4 pb-2 border-b border-border">
            <Button type="button" variant={!isNewProduct ? "default" : "outline"} size="sm" onClick={() => setIsNewProduct(false)}>
              Produs Existent
            </Button>
            <Button type="button" variant={isNewProduct ? "default" : "outline"} size="sm" onClick={() => setIsNewProduct(true)} className="gap-1">
              <Plus className="h-4 w-4" />
              Produs Nou
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Data Intrării *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !entryDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {entryDate ? format(entryDate, "PPP", { locale: ro }) : <span>Selectează data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <Calendar mode="single" selected={entryDate} onSelect={(date) => date && setEntryDate(date)} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {!isNewProduct ? (
              <div className="space-y-2">
                <Label htmlFor="product">Produs Existent *</Label>
                <Select value={formData.productId} onValueChange={(value) => setFormData({ ...formData, productId: value })}>
                  <SelectTrigger><SelectValue placeholder="Selectează produsul" /></SelectTrigger>
                  <SelectContent className="z-50">
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-xs">{product.code}</span>
                          <span>{product.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProduct && <p className="text-xs text-muted-foreground">Stoc actual: {selectedProduct.quantity} buc</p>}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newProductName">Nume Produs Nou *</Label>
                  <Input id="newProductName" placeholder="Ex: Racheta Aurie 50mm" value={formData.newProductName} onChange={(e) => setFormData({ ...formData, newProductName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newProductCode">Cod Produs *</Label>
                  <Input id="newProductCode" placeholder="Ex: RACH-050-AU" value={formData.newProductCode} onChange={(e) => setFormData({ ...formData, newProductCode: e.target.value })} />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Cantitate *</Label>
              <Input id="quantity" type="number" min="1" placeholder="Ex: 100" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
            </div>

            {isNewProduct && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="category">Categorie *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as PyroCategory })}>
                    <SelectTrigger><SelectValue placeholder="Selectează categoria" /></SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Preț Unitar (RON) *</Label>
                  <Input 
                    id="unitPrice" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    placeholder="Ex: 25.50" 
                    value={formData.unitPrice} 
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })} 
                    required 
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="documentNumber">Număr Document</Label>
              <Input id="documentNumber" placeholder="Ex: NIR-2024-0157" value={formData.documentNumber} onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })} />
            </div>

            {isNewProduct && (
              <div className="space-y-2">
                <Label htmlFor="supplier">Furnizor</Label>
                <Input id="supplier" placeholder="Ex: PyroTech SRL" value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observații</Label>
            <Textarea id="notes" placeholder="Adaugă detalii suplimentare..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="gap-2 gradient-fire text-white border-0" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvează Intrarea
            </Button>
            <Button type="button" variant="outline" onClick={() => { setFormData({ productId: '', newProductName: '', newProductCode: '', category: '', quantity: '', unitPrice: '', documentNumber: '', supplier: '', notes: '' }); setEntryDate(new Date()); setIsNewProduct(false); }}>
              <X className="h-4 w-4 mr-2" />
              Resetează
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

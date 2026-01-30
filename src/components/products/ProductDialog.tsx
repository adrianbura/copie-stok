import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product, PyroCategory } from '@/types';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useWarehouseContext } from '@/hooks/useWarehouse';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

const PYRO_CATEGORIES: PyroCategory[] = ['F1', 'F2', 'F3', 'F4', 'T1', 'T2'];

const productSchema = z.object({
  code: z.string().min(1, 'Codul este obligatoriu').max(50),
  name: z.string().min(1, 'Numele este obligatoriu').max(200),
  category: z.enum(['F1', 'F2', 'F3', 'F4', 'T1', 'T2']),
  quantity: z.number().min(0, 'Cantitatea nu poate fi negativă'),
  min_stock: z.number().min(0, 'Stocul minim nu poate fi negativ'),
  unit_price: z.number().min(0, 'Prețul nu poate fi negativ'),
  location: z.string().max(100).optional(),
  supplier: z.string().max(200).optional(),
  batch_number: z.string().max(100).optional(),
  expiry_date: z.string().optional(),
  net_weight: z.number().min(0).optional(),
  hazard_class: z.string().max(50).optional(),
  certification: z.string().max(200).optional(),
});

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const isEditing = !!product;
  const { selectedWarehouse } = useWarehouseContext();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isSubmitting = createProduct.isPending || updateProduct.isPending;

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'F1' as PyroCategory,
    quantity: 0,
    min_stock: 10,
    unit_price: 0,
    location: '',
    supplier: '',
    batch_number: '',
    expiry_date: '',
    net_weight: '',
    hazard_class: '',
    certification: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code,
        name: product.name,
        category: product.category,
        quantity: product.quantity,
        min_stock: product.min_stock,
        unit_price: Number(product.unit_price),
        location: product.location || '',
        supplier: product.supplier || '',
        batch_number: product.batch_number || '',
        expiry_date: product.expiry_date || '',
        net_weight: product.net_weight ? String(product.net_weight) : '',
        hazard_class: product.hazard_class || '',
        certification: product.certification || '',
      });
    } else {
      setFormData({
        code: '',
        name: '',
        category: 'F1',
        quantity: 0,
        min_stock: 10,
        unit_price: 0,
        location: '',
        supplier: '',
        batch_number: '',
        expiry_date: '',
        net_weight: '',
        hazard_class: '',
        certification: '',
      });
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToValidate = {
      ...formData,
      net_weight: formData.net_weight ? parseFloat(formData.net_weight) : undefined,
      location: formData.location || undefined,
      supplier: formData.supplier || undefined,
      batch_number: formData.batch_number || undefined,
      expiry_date: formData.expiry_date || undefined,
      hazard_class: formData.hazard_class || undefined,
      certification: formData.certification || undefined,
    };

    const result = productSchema.safeParse(dataToValidate);
    if (!result.success) {
      const errors = result.error.errors.map(e => e.message).join(', ');
      toast.error(`Eroare de validare: ${errors}`);
      return;
    }

    const productData = {
      code: formData.code,
      name: formData.name,
      category: formData.category,
      quantity: formData.quantity,
      min_stock: formData.min_stock,
      unit_price: formData.unit_price,
      location: formData.location || null,
      supplier: formData.supplier || null,
      batch_number: formData.batch_number || null,
      expiry_date: formData.expiry_date || null,
      net_weight: formData.net_weight ? parseFloat(formData.net_weight) : null,
      hazard_class: formData.hazard_class || null,
      certification: formData.certification || null,
    };

    try {
      if (isEditing && product) {
        await updateProduct.mutateAsync({ id: product.id, ...productData });
      } else {
        if (!selectedWarehouse?.id) {
          toast.error('Selectează un depozit înainte de a adăuga produse');
          return;
        }
        await createProduct.mutateAsync({
          ...productData,
          warehouse_id: selectedWarehouse.id,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editare Produs' : 'Produs Nou'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Row 1: Code & Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Cod Produs *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="ex: PYRO-001"
                  required
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Denumire *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Artificii de revelion"
                  required
                  maxLength={200}
                />
              </div>
            </div>

            {/* Row 2: Category & Location */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: PyroCategory) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PYRO_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Locație</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="ex: A-01-03"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Row 3: Quantity, Min Stock, Price */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantitate *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={0}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock">Stoc Minim *</Label>
                <Input
                  id="min_stock"
                  type="number"
                  min={0}
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit_price">Preț Unitar (RON) *</Label>
                <Input
                  id="unit_price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Row 4: Supplier & Batch */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Furnizor</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="ex: SC Pirotehnica SRL"
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch_number">Nr. Lot</Label>
                <Input
                  id="batch_number"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  placeholder="ex: LOT-2024-001"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Row 5: Expiry & Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry_date">Data Expirării</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="net_weight">Greutate Netă (kg)</Label>
                <Input
                  id="net_weight"
                  type="number"
                  min={0}
                  step="0.01"
                  value={formData.net_weight}
                  onChange={(e) => setFormData({ ...formData, net_weight: e.target.value })}
                />
              </div>
            </div>

            {/* Row 6: Hazard & Certification */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hazard_class">Clasă Pericol</Label>
                <Input
                  id="hazard_class"
                  value={formData.hazard_class}
                  onChange={(e) => setFormData({ ...formData, hazard_class: e.target.value })}
                  placeholder="ex: 1.4G"
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="certification">Certificare</Label>
                <Input
                  id="certification"
                  value={formData.certification}
                  onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                  placeholder="ex: CE-2024-12345"
                  maxLength={200}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anulare
            </Button>
            <Button type="submit" className="gradient-fire text-white border-0" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se salvează...
                </>
              ) : isEditing ? (
                'Salvează Modificările'
              ) : (
                'Adaugă Produs'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
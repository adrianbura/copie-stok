import { useState } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProducts } from '@/hooks/useProducts';
import { useCreateStockMovement } from '@/hooks/useStockMovements';
import { Product } from '@/types';
import { ProductSearchSelect } from './ProductSearchSelect';
import { CategoryBadge } from '@/components/ui/category-badge';
import { ArrowUpFromLine, Save, X, AlertTriangle, Loader2, CalendarIcon, Trash2, Plus, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StockExitFormProps {
  onSuccess?: () => void;
}

interface ExitItem {
  id: string;
  product: Product;
  quantity: number;
}

export function StockExitForm({ onSuccess }: StockExitFormProps) {
  const { data: products } = useProducts();
  const createMovement = useCreateStockMovement();
  
  // Form state for adding items
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  
  // Global form state
  const [documentNumber, setDocumentNumber] = useState('');
  const [reason, setReason] = useState('Vânzare');
  const [notes, setNotes] = useState('');
  const [exitDate, setExitDate] = useState<Date>(new Date());
  
  // Exit items list
  const [exitItems, setExitItems] = useState<ExitItem[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);

  const selectedProduct = products?.find((p) => p.id === selectedProductId);
  const requestedQuantity = parseInt(itemQuantity) || 0;
  
  // Calculate already allocated quantity for the selected product
  const alreadyAllocated = exitItems
    .filter((item) => item.product.id === selectedProductId)
    .reduce((sum, item) => sum + item.quantity, 0);
  
  const availableStock = selectedProduct 
    ? selectedProduct.quantity - alreadyAllocated 
    : 0;
  
  const insufficientStock = selectedProduct && requestedQuantity > availableStock;

  // Add item to the list
  const handleAddItem = () => {
    if (!selectedProduct || requestedQuantity <= 0 || insufficientStock) {
      return;
    }

    const newItem: ExitItem = {
      id: crypto.randomUUID(),
      product: selectedProduct,
      quantity: requestedQuantity,
    };

    setExitItems([...exitItems, newItem]);
    setSelectedProductId('');
    setItemQuantity('');
    toast.success(`${selectedProduct.name} adăugat în listă`);
  };

  // Remove item from the list
  const handleRemoveItem = (itemId: string) => {
    setExitItems(exitItems.filter((item) => item.id !== itemId));
  };

  // Save all exits
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (exitItems.length === 0) {
      toast.error('Adaugă cel puțin un produs în listă');
      return;
    }

    if (!documentNumber.trim()) {
      toast.error('Numărul documentului este obligatoriu');
      return;
    }

    setIsSaving(true);
    
    try {
      // Create all movements
      for (const item of exitItems) {
        await createMovement.mutateAsync({
          product_id: item.product.id,
          type: 'exit',
          quantity: item.quantity,
          reference: documentNumber,
          notes: `${reason}: ${notes}`.trim(),
          date: exitDate.toISOString(),
        });
      }

      toast.success(`${exitItems.length} ieșiri înregistrate cu succes!`);
      
      // Reset form
      setExitItems([]);
      setDocumentNumber('');
      setReason('Vânzare');
      setNotes('');
      setExitDate(new Date());
      setSelectedProductId('');
      setItemQuantity('');
      
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Eroare la salvarea ieșirilor');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset entire form
  const handleReset = () => {
    setExitItems([]);
    setDocumentNumber('');
    setReason('Vânzare');
    setNotes('');
    setExitDate(new Date());
    setSelectedProductId('');
    setItemQuantity('');
  };

  const totalItems = exitItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Add Product Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpFromLine className="h-5 w-5 text-destructive" />
            Adaugă Produse pentru Ieșire
          </CardTitle>
          <CardDescription>
            Selectează produsele și cantitățile. Acestea vor fi adăugate în lista de mai jos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Produs</Label>
              <ProductSearchSelect
                products={products}
                value={selectedProductId}
                onSelect={setSelectedProductId}
                placeholder="Caută și selectează produsul"
                showStock
              />
              {selectedProduct && (
                <p className={cn(
                  'text-xs',
                  availableStock <= selectedProduct.min_stock ? 'text-warning' : 'text-muted-foreground'
                )}>
                  Stoc disponibil: {availableStock} buc
                  {alreadyAllocated > 0 && (
                    <span className="text-muted-foreground"> ({alreadyAllocated} deja în listă)</span>
                  )}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemQuantity">Cantitate</Label>
              <Input
                id="itemQuantity"
                type="number"
                min="1"
                max={availableStock}
                placeholder="Ex: 50"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
                className={cn(insufficientStock && 'border-destructive')}
              />
              {insufficientStock && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Stoc insuficient
                </p>
              )}
            </div>

            <div className="space-y-2 flex flex-col justify-end">
              <Button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedProduct || requestedQuantity <= 0 || insufficientStock}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Adaugă în listă
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exit Items List */}
      {exitItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produse de Scos ({exitItems.length})
            </CardTitle>
            <CardDescription>
              Total: {totalItems} bucăți
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cod</TableHead>
                    <TableHead>Denumire</TableHead>
                    <TableHead>Categorie</TableHead>
                    <TableHead className="text-right">Cantitate</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exitItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        {item.product.code}
                      </TableCell>
                      <TableCell>{item.product.name}</TableCell>
                      <TableCell>
                        <CategoryBadge category={item.product.category} size="sm" />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.quantity} buc
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Details & Save */}
      <Card>
        <CardHeader>
          <CardTitle>Detalii Document</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="documentNumber">Număr Document *</Label>
                <Input
                  id="documentNumber"
                  placeholder="Ex: AV-2024-0090"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motiv</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vânzare">Vânzare</SelectItem>
                    <SelectItem value="Transfer">Transfer între depozite</SelectItem>
                    <SelectItem value="Casare">Casare/Pierdere</SelectItem>
                    <SelectItem value="Retur">Retur către furnizor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data Ieșirii *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !exitDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {exitDate ? format(exitDate, "PPP", { locale: ro }) : <span>Selectează data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={exitDate}
                      onSelect={(date) => date && setExitDate(date)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                      locale={ro}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observații</Label>
              <Textarea
                id="notes"
                placeholder="Ex: Client: Compania ABC"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="destructive"
                className="gap-2"
                disabled={exitItems.length === 0 || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvează Ieșirile ({exitItems.length})
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                <X className="h-4 w-4 mr-2" />
                Resetează
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

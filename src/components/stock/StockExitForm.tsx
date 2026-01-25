import { useState, useEffect } from 'react';
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
import { useWarehouseProducts } from '@/hooks/useProducts';
import { useCreateStockMovement } from '@/hooks/useStockMovements';
import { useCreateInventoryDocument, useNextDocumentNumber, DocumentItem } from '@/hooks/useInventoryDocuments';
import { useWarehouseContext } from '@/hooks/useWarehouse';
import { Product } from '@/types';
import { ProductSearchSelect } from './ProductSearchSelect';
import { CategoryBadge } from '@/components/ui/category-badge';
import { ArrowUpFromLine, Save, X, AlertTriangle, Loader2, CalendarIcon, Trash2, Plus, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StockExitFormProps {
  onSuccess?: () => void;
  externalItems?: ExitItem[];
  onItemsChange?: (items: ExitItem[]) => void;
}

export interface ExitItem {
  id: string;
  product: Product;
  quantity: number;
}

export function StockExitForm({ onSuccess, externalItems, onItemsChange }: StockExitFormProps) {
  const { selectedWarehouse } = useWarehouseContext();
  const { data: products } = useWarehouseProducts(selectedWarehouse?.id);
  const createMovement = useCreateStockMovement();
  const createDocument = useCreateInventoryDocument();
  const { data: nextDocNumber } = useNextDocumentNumber('exit', selectedWarehouse?.name);
  
  
  // Use external items if provided, otherwise use internal state
  const [internalItems, setInternalItems] = useState<ExitItem[]>([]);
  const exitItems = externalItems ?? internalItems;
  const setExitItems = onItemsChange ?? setInternalItems;
  
  // Form state for adding items
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  
  // Global form state
  const [documentNumber, setDocumentNumber] = useState('');
  const [reason, setReason] = useState('Vânzare');
  // Use selected warehouse name for document storage
  const [partnerName, setPartnerName] = useState('');
  const [notes, setNotes] = useState('');
  const [exitDate, setExitDate] = useState<Date>(new Date());
  
  const [isSaving, setIsSaving] = useState(false);

  // Auto-fill document number
  useEffect(() => {
    if (nextDocNumber && !documentNumber) {
      setDocumentNumber(nextDocNumber);
    }
  }, [nextDocNumber, documentNumber]);

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

  // Update item quantity
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    setExitItems(exitItems.map((item) => {
      if (item.id === itemId) {
        // Calculate max available for this product
        const otherAllocated = exitItems
          .filter(i => i.product.id === item.product.id && i.id !== itemId)
          .reduce((sum, i) => sum + i.quantity, 0);
        const maxAvailable = item.product.quantity - otherAllocated;
        const validQuantity = Math.max(1, Math.min(newQuantity, maxAvailable));
        return { ...item, quantity: validQuantity };
      }
      return item;
    }));
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

    if (!selectedWarehouse) {
      toast.error('Nu ai selectat un depozit! Revino la pagina de autentificare.');
      return;
    }

    // Validate stock before proceeding
    const stockErrors: string[] = [];
    for (const item of exitItems) {
      const productInWarehouse = products?.find(p => p.id === item.product.id);
      const availableQty = productInWarehouse?.quantity || 0;
      
      // Calculate total requested for this product across all items
      const totalRequested = exitItems
        .filter(i => i.product.id === item.product.id)
        .reduce((sum, i) => sum + i.quantity, 0);
      
      if (totalRequested > availableQty) {
        stockErrors.push(`${item.product.code}: disponibil ${availableQty}, cerut ${totalRequested}`);
      }
    }
    
    // Remove duplicates from error messages
    const uniqueErrors = [...new Set(stockErrors)];
    if (uniqueErrors.length > 0) {
      toast.error(`Stoc insuficient: ${uniqueErrors.join('; ')}`);
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    
    try {
      const documentItems: DocumentItem[] = [];
      
      // Create all movements
      for (const item of exitItems) {
        await createMovement.mutateAsync({
          product_id: item.product.id,
          type: 'exit',
          quantity: item.quantity,
          reference: documentNumber,
          notes: `${reason}: ${notes}`.trim(),
          date: exitDate.toISOString(),
          warehouse_id: selectedWarehouse?.id,
        });
        
        // Add to document items
        documentItems.push({
          product_id: item.product.id,
          code: item.product.code,
          name: item.product.name,
          category: item.product.category,
          quantity: item.quantity,
          unit_price: Number(item.product.unit_price),
        });
      }

      // Calculate total value
      const totalValue = documentItems.reduce(
        (sum, item) => sum + item.quantity * (item.unit_price || 0),
        0
      );

      // Create inventory document with selected warehouse name
      await createDocument.mutateAsync({
        type: 'exit',
        document_number: documentNumber,
        date: exitDate.toISOString(),
        warehouse: selectedWarehouse?.name || undefined,
        partner: partnerName || undefined,
        notes: `${reason}: ${notes}`.trim() || undefined,
        items: documentItems,
        total_value: totalValue,
      });

      toast.success(`${exitItems.length} ieșiri înregistrate cu succes!`);
      
      // Reset form
      setExitItems([]);
      setDocumentNumber('');
      setReason('Vânzare');
      setPartnerName('');
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
    setPartnerName('');
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
                  {exitItems.map((item) => {
                    const otherAllocated = exitItems
                      .filter(i => i.product.id === item.product.id && i.id !== item.id)
                      .reduce((sum, i) => sum + i.quantity, 0);
                    const maxForThis = item.product.quantity - otherAllocated;
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">
                          {item.product.code}
                        </TableCell>
                        <TableCell>{item.product.name}</TableCell>
                        <TableCell>
                          <CategoryBadge category={item.product.category} size="sm" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min={1}
                            max={maxForThis}
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-20 h-8 text-right ml-auto"
                          />
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
                    );
                  })}
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
                    <SelectItem value="Foc Artificii">Foc Artificii</SelectItem>
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

              <div className="space-y-2">
                <Label htmlFor="warehouse">Gestiune</Label>
                <Input
                  id="warehouse"
                  placeholder="Ex: Principal"
                  value={selectedWarehouse?.name || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partnerName">Beneficiar</Label>
                <Input
                  id="partnerName"
                  placeholder="Ex: Client SRL"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                />
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

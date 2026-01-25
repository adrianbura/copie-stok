import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useProducts, useCreateProduct, useWarehouseProducts } from '@/hooks/useProducts';
import { useCreateStockMovement } from '@/hooks/useStockMovements';
import { useCreateInventoryDocument, useNextDocumentNumber, DocumentItem } from '@/hooks/useInventoryDocuments';
import { useWarehouseContext } from '@/hooks/useWarehouse';
import { Product, PyroCategory, CATEGORIES } from '@/types';
import { ArrowDownToLine, Save, X, CalendarIcon, Plus, Loader2, Package, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ProductSearchSelect } from './ProductSearchSelect';
import { CategoryBadge } from '@/components/ui/category-badge';
import type { InvoiceMetadata } from './ImportInvoiceDialog';

interface StockEntryFormProps {
  onSuccess?: () => void;
  externalItems?: EntryItem[];
  onItemsChange?: (items: EntryItem[]) => void;
  invoiceMetadata?: InvoiceMetadata | null;
  onMetadataUsed?: () => void;
}

export interface EntryItem {
  id: string;
  product: Product | null;
  quantity: number;
  isNew?: boolean;
  newProductName?: string;
  newProductCode?: string;
  category?: PyroCategory;
  unitPrice?: number;
  supplier?: string;
}

export function StockEntryForm({ onSuccess, externalItems, onItemsChange, invoiceMetadata, onMetadataUsed }: StockEntryFormProps) {
  const { selectedWarehouse } = useWarehouseContext();
  const { data: allProducts } = useProducts();
  const { data: warehouseProducts } = useWarehouseProducts(selectedWarehouse?.id);
  const createProduct = useCreateProduct();
  const createMovement = useCreateStockMovement();
  const createDocument = useCreateInventoryDocument();
  const { data: nextDocNumber } = useNextDocumentNumber('entry', selectedWarehouse?.name);
  
  // Use external items if provided, otherwise use internal state
  const [internalItems, setInternalItems] = useState<EntryItem[]>([]);
  const entryItems = externalItems ?? internalItems;
  const setEntryItems = onItemsChange ?? setInternalItems;
  
  // Form state for adding items
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductCode, setNewProductCode] = useState('');
  const [category, setCategory] = useState<PyroCategory | ''>('');
  const [unitPrice, setUnitPrice] = useState('');
  const [supplier, setSupplier] = useState('');
  
  // Global form state
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [documentNumber, setDocumentNumber] = useState('');
  // Use selected warehouse name for document storage
  const [partnerName, setPartnerName] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);

  // Auto-fill document number
  useEffect(() => {
    if (nextDocNumber && !documentNumber) {
      setDocumentNumber(nextDocNumber);
    }
  }, [nextDocNumber, documentNumber]);

  // Auto-fill from invoice metadata
  useEffect(() => {
    if (invoiceMetadata) {
      if (invoiceMetadata.supplier) {
        setPartnerName(invoiceMetadata.supplier);
      }
      if (invoiceMetadata.invoiceNumber) {
        setDocumentNumber(invoiceMetadata.invoiceNumber);
      }
      if (invoiceMetadata.invoiceDate) {
        const parsedDate = new Date(invoiceMetadata.invoiceDate);
        if (!isNaN(parsedDate.getTime())) {
          setEntryDate(parsedDate);
        }
      }
      // Mark metadata as used
      onMetadataUsed?.();
    }
  }, [invoiceMetadata, onMetadataUsed]);

  const selectedProduct = warehouseProducts?.find((p) => p.id === selectedProductId);
  const requestedQuantity = parseInt(itemQuantity) || 0;

  // Add item to the list
  const handleAddItem = () => {
    if (requestedQuantity <= 0) {
      toast.error('Cantitatea trebuie să fie mai mare decât 0');
      return;
    }

    if (isNewProduct) {
      if (!newProductCode || !newProductName || !category) {
        toast.error('Completează toate câmpurile obligatorii pentru produsul nou');
        return;
      }

      const newItem: EntryItem = {
        id: crypto.randomUUID(),
        product: null,
        quantity: requestedQuantity,
        isNew: true,
        newProductName,
        newProductCode,
        category: category as PyroCategory,
        unitPrice: parseFloat(unitPrice) || 0,
        supplier: supplier || undefined,
      };

      setEntryItems([...entryItems, newItem]);
      toast.success(`${newProductName} adăugat în listă`);
      
      // Reset new product fields
      setNewProductName('');
      setNewProductCode('');
      setCategory('');
      setUnitPrice('');
      setSupplier('');
    } else {
      if (!selectedProduct) {
        toast.error('Selectează un produs');
        return;
      }

      const newItem: EntryItem = {
        id: crypto.randomUUID(),
        product: selectedProduct,
        quantity: requestedQuantity,
        isNew: false,
      };

      setEntryItems([...entryItems, newItem]);
      toast.success(`${selectedProduct.name} adăugat în listă`);
      setSelectedProductId('');
    }
    
    setItemQuantity('');
  };

  // Remove item from the list
  const handleRemoveItem = (itemId: string) => {
    setEntryItems(entryItems.filter((item) => item.id !== itemId));
  };

  // Update item quantity
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    setEntryItems(entryItems.map((item) => {
      if (item.id === itemId) {
        return { ...item, quantity: Math.max(1, newQuantity) };
      }
      return item;
    }));
  };

  // Save all entries
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (entryItems.length === 0) {
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

    setIsSaving(true);
    
    try {
      const documentItems: DocumentItem[] = [];
      
      for (const item of entryItems) {
        let productId = item.product?.id;
        let productCode = item.product?.code || item.newProductCode!;
        let productName = item.product?.name || item.newProductName!;
        let productCategory = item.product?.category || item.category!;
        let productPrice = item.product?.unit_price || item.unitPrice || 0;
        
        // Create new product if needed
        if (item.isNew && !productId) {
          const newProduct = await createProduct.mutateAsync({
            code: item.newProductCode!,
            name: item.newProductName!,
            category: item.category!,
            quantity: 0,
            min_stock: 10,
            unit_price: item.unitPrice || 0,
            supplier: item.supplier || null,
            location: null,
            batch_number: null,
            expiry_date: null,
            net_weight: null,
            hazard_class: null,
            certification: null,
          });
          productId = newProduct.id;
        }

        if (!productId) continue;

        // Create stock movement with warehouse_id
        await createMovement.mutateAsync({
          product_id: productId,
          type: 'entry',
          quantity: item.quantity,
          reference: documentNumber || undefined,
          notes: notes || undefined,
          date: entryDate.toISOString(),
          warehouse_id: selectedWarehouse?.id,
        });
        
        // Add to document items
        documentItems.push({
          product_id: productId,
          code: productCode,
          name: productName,
          category: productCategory,
          quantity: item.quantity,
          unit_price: Number(productPrice),
        });
      }

      // Calculate total value
      const totalValue = documentItems.reduce(
        (sum, item) => sum + item.quantity * (item.unit_price || 0),
        0
      );

      // Create inventory document with the selected warehouse name
      await createDocument.mutateAsync({
        type: 'entry',
        document_number: documentNumber,
        date: entryDate.toISOString(),
        warehouse: selectedWarehouse?.name || undefined,
        partner: partnerName || undefined,
        notes: notes || undefined,
        items: documentItems,
        total_value: totalValue,
      });

      const newCount = entryItems.filter(i => i.isNew).length;
      
      let message = `${entryItems.length} intrări înregistrate`;
      if (newCount > 0) message += ` (${newCount} produse noi create)`;
      toast.success(message);
      
      // Reset form - set documentNumber to empty string first
      // so useEffect will populate it with next number from refreshed query
      setEntryItems([]);
      setDocumentNumber(''); 
      setPartnerName('');
      setNotes('');
      setEntryDate(new Date());
      setSelectedProductId('');
      setItemQuantity('');
      setIsNewProduct(false);
      
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Eroare la salvarea intrărilor');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset entire form
  const handleReset = () => {
    setEntryItems([]);
    setDocumentNumber('');
    
    setPartnerName('');
    setNotes('');
    setEntryDate(new Date());
    setSelectedProductId('');
    setItemQuantity('');
    setIsNewProduct(false);
    setNewProductName('');
    setNewProductCode('');
    setCategory('');
    setUnitPrice('');
    setSupplier('');
  };

  const totalItems = entryItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Add Product Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-success" />
            Adaugă Produse pentru Intrare
          </CardTitle>
          <CardDescription>
            Selectează produsele și cantitățile. Acestea vor fi adăugate în lista de mai jos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-2 border-b border-border">
              <Button type="button" variant={!isNewProduct ? "default" : "outline"} size="sm" onClick={() => setIsNewProduct(false)}>
                Produs Existent
              </Button>
              <Button type="button" variant={isNewProduct ? "default" : "outline"} size="sm" onClick={() => setIsNewProduct(true)} className="gap-1">
                <Plus className="h-4 w-4" />
                Produs Nou
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {!isNewProduct ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Produs Existent (din depozitul curent)</Label>
                  <ProductSearchSelect
                    products={warehouseProducts}
                    value={selectedProductId}
                    onSelect={setSelectedProductId}
                    placeholder="Caută și selectează produsul"
                    showStock
                  />
                  {selectedProduct && (
                    <p className="text-xs text-muted-foreground">
                      Stoc în depozit: {warehouseProducts?.find(p => p.id === selectedProductId)?.quantity || 0} buc
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="newProductName">Nume Produs *</Label>
                    <Input
                      id="newProductName"
                      placeholder="Ex: Racheta Aurie 50mm"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newProductCode">Cod Produs *</Label>
                    <Input
                      id="newProductCode"
                      placeholder="Ex: RACH-050-AU"
                      value={newProductCode}
                      onChange={(e) => setNewProductCode(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="itemQuantity">Cantitate *</Label>
                <Input
                  id="itemQuantity"
                  type="number"
                  min="1"
                  placeholder="Ex: 100"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                />
              </div>

              {!isNewProduct && (
                <div className="space-y-2 flex flex-col justify-end">
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!selectedProduct || requestedQuantity <= 0}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adaugă în listă
                  </Button>
                </div>
              )}
            </div>

            {isNewProduct && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categorie *</Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as PyroCategory)}>
                    <SelectTrigger><SelectValue placeholder="Selectează" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.id}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Preț Unitar (RON)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 25.50"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier">Furnizor</Label>
                  <Input
                    id="supplier"
                    placeholder="Ex: PyroTech SRL"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                  />
                </div>

                <div className="space-y-2 flex flex-col justify-end">
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!newProductCode || !newProductName || !category || requestedQuantity <= 0}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adaugă în listă
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Entry Items List */}
      {entryItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produse de Adăugat ({entryItems.length})
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
                  {entryItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        {item.isNew ? (
                          <span className="text-success">{item.newProductCode} (nou)</span>
                        ) : (
                          item.product?.code
                        )}
                      </TableCell>
                      <TableCell>
                        {item.isNew ? item.newProductName : item.product?.name}
                      </TableCell>
                      <TableCell>
                        <CategoryBadge 
                          category={item.isNew ? item.category! : item.product?.category!} 
                          size="sm" 
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={1}
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

              <div className="space-y-2">
                <Label htmlFor="documentNumber">Număr Document *</Label>
                <Input
                  id="documentNumber"
                  placeholder="Ex: NIR-2024-0157"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  required
                />
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
                <Label htmlFor="partnerName">Furnizor</Label>
                <Input
                  id="partnerName"
                  placeholder="Ex: PyroTech SRL"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observații</Label>
              <Textarea
                id="notes"
                placeholder="Adaugă detalii suplimentare..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="gap-2 gradient-fire text-white border-0"
                disabled={entryItems.length === 0 || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvează Intrările ({entryItems.length})
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

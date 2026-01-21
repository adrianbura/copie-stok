import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StockEntryForm, EntryItem } from '@/components/stock/StockEntryForm';
import { MovementsHistory } from '@/components/stock/MovementsHistory';
import { ImportMovementsDialog, ImportedItem } from '@/components/stock/ImportMovementsDialog';
import { ImportInvoiceDialog } from '@/components/stock/ImportInvoiceDialog';
import { ArrowDownToLine } from 'lucide-react';

export default function Entries() {
  const [entryItems, setEntryItems] = useState<EntryItem[]>([]);

  const handleImportToList = (items: ImportedItem[]) => {
    const newItems: EntryItem[] = items.map(item => ({
      id: item.id,
      product: item.product,
      quantity: item.quantity,
      isNew: item.isNew,
      newProductName: item.newProductName,
      newProductCode: item.newProductCode,
      category: item.category,
      unitPrice: item.unitPrice,
      supplier: item.supplier,
    }));
    
    setEntryItems(prev => [...prev, ...newItems]);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <ArrowDownToLine className="h-8 w-8 text-success" />
              Intrări Stoc
            </h1>
            <p className="text-muted-foreground mt-1">
              Înregistrează aprovizionări și adaugă produse în stoc
            </p>
          </div>
          <div className="flex gap-2">
            <ImportInvoiceDialog onImportToList={handleImportToList} />
            <ImportMovementsDialog type="entry" onImportToList={handleImportToList} />
          </div>
        </div>

        {/* Entry Form */}
        <StockEntryForm 
          externalItems={entryItems} 
          onItemsChange={setEntryItems} 
        />

        {/* History */}
        <MovementsHistory type="entry" />
      </div>
    </MainLayout>
  );
}

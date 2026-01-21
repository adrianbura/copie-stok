import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StockExitForm, ExitItem } from '@/components/stock/StockExitForm';
import { MovementsHistory } from '@/components/stock/MovementsHistory';
import { ImportMovementsDialog, ImportedItem } from '@/components/stock/ImportMovementsDialog';
import { ArrowUpFromLine } from 'lucide-react';

export default function Exits() {
  const [exitItems, setExitItems] = useState<ExitItem[]>([]);

  const handleImportToList = (items: ImportedItem[]) => {
    // Only add items with existing products for exits
    const newItems: ExitItem[] = items
      .filter(item => item.product !== null)
      .map(item => ({
        id: item.id,
        product: item.product!,
        quantity: item.quantity,
      }));
    
    setExitItems(prev => [...prev, ...newItems]);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <ArrowUpFromLine className="h-8 w-8 text-destructive" />
              Ieșiri Stoc
            </h1>
            <p className="text-muted-foreground mt-1">
              Înregistrează vânzări și scoate produse din stoc
            </p>
          </div>
          <ImportMovementsDialog type="exit" onImportToList={handleImportToList} />
        </div>

        {/* Exit Form */}
        <StockExitForm 
          externalItems={exitItems} 
          onItemsChange={setExitItems} 
        />

        {/* History */}
        <MovementsHistory type="exit" />
      </div>
    </MainLayout>
  );
}

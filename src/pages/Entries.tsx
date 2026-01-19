import { MainLayout } from '@/components/layout/MainLayout';
import { StockEntryForm } from '@/components/stock/StockEntryForm';
import { MovementsHistory } from '@/components/stock/MovementsHistory';
import { ImportMovementsDialog } from '@/components/stock/ImportMovementsDialog';
import { ArrowDownToLine } from 'lucide-react';

export default function Entries() {
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
          <ImportMovementsDialog type="entry" />
        </div>

        {/* Entry Form */}
        <StockEntryForm />

        {/* History */}
        <MovementsHistory type="entry" />
      </div>
    </MainLayout>
  );
}

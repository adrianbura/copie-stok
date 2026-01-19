import { MainLayout } from '@/components/layout/MainLayout';
import { StockExitForm } from '@/components/stock/StockExitForm';
import { MovementsHistory } from '@/components/stock/MovementsHistory';
import { ImportMovementsDialog } from '@/components/stock/ImportMovementsDialog';
import { ArrowUpFromLine } from 'lucide-react';

export default function Exits() {
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
          <ImportMovementsDialog type="exit" />
        </div>

        {/* Exit Form */}
        <StockExitForm />

        {/* History */}
        <MovementsHistory type="exit" />
      </div>
    </MainLayout>
  );
}

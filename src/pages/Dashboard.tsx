import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/ui/stat-card';
import { StockOverview } from '@/components/dashboard/StockOverview';
import { RecentMovements } from '@/components/dashboard/RecentMovements';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useWarehouseProductStats } from '@/hooks/useProducts';
import { useAlertStats } from '@/hooks/useAlerts';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useWarehouseContext } from '@/hooks/useWarehouse';
import { Package, TrendingUp, AlertTriangle, FileCheck } from 'lucide-react';

export default function Dashboard() {
  const { selectedWarehouse } = useWarehouseContext();
  const { totalProducts, totalStockValue, lowStockCount } = useWarehouseProductStats(selectedWarehouse?.id);
  const { unacknowledgedCount } = useAlertStats(selectedWarehouse?.id);
  const { data: movements } = useStockMovements(selectedWarehouse?.id);
  const recentEntries = movements?.filter((m) => m.type === 'entry').length || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Bun venit la <span className="text-gradient-fire">PyroStock</span></h1>
          <p className="text-muted-foreground">Sistem de management pentru depozitul de produse pirotehnice</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Produse" value={totalProducts} subtitle={`${recentEntries} intrări luna aceasta`} icon={Package} variant="primary" />
          <StatCard title="Valoare Stoc" value={`${totalStockValue.toLocaleString()} RON`} subtitle="Valoare totală estimată" icon={TrendingUp} variant="success" />
          <StatCard title="Stoc Scăzut" value={lowStockCount} subtitle="Produse sub limita minimă" icon={AlertTriangle} variant={lowStockCount > 0 ? 'warning' : 'default'} />
          <StatCard title="Alerte Active" value={unacknowledgedCount} subtitle="Necesită atenție" icon={FileCheck} variant={unacknowledgedCount > 0 ? 'danger' : 'default'} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <StockOverview />
          <RecentMovements />
          <QuickActions />
        </div>
      </div>
    </MainLayout>
  );
}
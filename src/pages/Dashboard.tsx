import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/ui/stat-card';
import { StockOverview } from '@/components/dashboard/StockOverview';
import { RecentMovements } from '@/components/dashboard/RecentMovements';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { QuickActions } from '@/components/dashboard/QuickActions';
import {
  mockProducts,
  mockMovements,
  mockAlerts,
  getTotalStockValue,
  getLowStockProducts,
} from '@/data/mockData';
import { Package, TrendingUp, AlertTriangle, FileCheck } from 'lucide-react';

export default function Dashboard() {
  const totalProducts = mockProducts.length;
  const totalStockValue = getTotalStockValue();
  const lowStockCount = getLowStockProducts().length;
  const activeAlerts = mockAlerts.filter((a) => !a.acknowledged).length;
  const recentEntries = mockMovements.filter((m) => m.type === 'entry').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Bun venit la <span className="text-gradient-fire">PyroStock</span>
          </h1>
          <p className="text-muted-foreground">
            Sistem de management pentru depozitul de produse pirotehnice
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Produse"
            value={totalProducts}
            subtitle={`${recentEntries} intrări luna aceasta`}
            icon={Package}
            variant="primary"
            trend={{ value: 12, label: 'vs luna trecută' }}
          />
          <StatCard
            title="Valoare Stoc"
            value={`${totalStockValue.toLocaleString()} RON`}
            subtitle="Valoare totală estimată"
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Stoc Scăzut"
            value={lowStockCount}
            subtitle="Produse sub limita minimă"
            icon={AlertTriangle}
            variant={lowStockCount > 0 ? 'warning' : 'default'}
          />
          <StatCard
            title="Alerte Active"
            value={activeAlerts}
            subtitle="Necesită atenție"
            icon={FileCheck}
            variant={activeAlerts > 0 ? 'danger' : 'default'}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-4">
          <StockOverview />
          <AlertsPanel />
          <RecentMovements />
          <QuickActions />
        </div>
      </div>
    </MainLayout>
  );
}

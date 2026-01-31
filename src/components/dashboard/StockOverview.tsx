import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORIES, PyroCategory } from '@/types';
import { useProductStats } from '@/hooks/useProducts';
import { useWarehouseContext } from '@/hooks/useWarehouse';
import { cn } from '@/lib/utils';

const categoryColors: Record<PyroCategory, string> = {
  'F1': 'bg-emerald-500',
  'F2': 'bg-sky-500',
  'F3': 'bg-amber-500',
  'F4': 'bg-red-500',
  'T1': 'bg-violet-500',
  'T2': 'bg-pink-500',
};

export function StockOverview() {
  const { selectedWarehouse } = useWarehouseContext();
  const { stockByCategory } = useProductStats(selectedWarehouse?.id);
  const totalStock = Object.values(stockByCategory).reduce((a, b) => a + b, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Distribuție Stoc pe Categorii</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {CATEGORIES.map((category) => {
            const quantity = stockByCategory[category.id] || 0;
            const percentage = totalStock > 0 ? (quantity / totalStock) * 100 : 0;

            return (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{quantity} buc</span>
                    <span className="font-semibold w-12 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      categoryColors[category.id]
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Stoc</span>
            <span className="text-2xl font-bold">{totalStock.toLocaleString()} buc</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecentMovements } from '@/hooks/useStockMovements';
import { ArrowDownToLine, ArrowUpFromLine, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export function RecentMovements() {
  const { data: movements, isLoading } = useRecentMovements(5);

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Mișcări Recente</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : movements?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nu există mișcări de stoc înregistrate
          </p>
        ) : (
          <div className="space-y-4">
            {movements?.map((movement) => (
              <div
                key={movement.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    movement.type === 'entry'
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  )}
                >
                  {movement.type === 'entry' ? (
                    <ArrowDownToLine className="h-5 w-5" />
                  ) : (
                    <ArrowUpFromLine className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{movement.product?.name || 'Produs șters'}</p>
                  <p className="text-sm text-muted-foreground">
                    {movement.type === 'entry' ? 'Intrare' : 'Ieșire'} • {movement.reference || '-'}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'font-semibold',
                      movement.type === 'entry' ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {movement.type === 'entry' ? '+' : '-'}
                    {movement.quantity}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(movement.date), 'd MMM yyyy', { locale: ro })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
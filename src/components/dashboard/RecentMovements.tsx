import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockMovements } from '@/data/mockData';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export function RecentMovements() {
  const recentMovements = mockMovements.slice(0, 5);

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Mișcări Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentMovements.map((movement) => (
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
                <p className="font-medium truncate">{movement.productName}</p>
                <p className="text-sm text-muted-foreground">
                  {movement.type === 'entry' ? 'Intrare' : 'Ieșire'} • {movement.documentNumber}
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
      </CardContent>
    </Card>
  );
}

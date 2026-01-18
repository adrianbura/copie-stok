import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStockMovements } from '@/hooks/useStockMovements';
import { ArrowDownToLine, ArrowUpFromLine, History, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { MovementType } from '@/types';

interface MovementsHistoryProps {
  type?: MovementType | 'all';
  limit?: number;
}

export function MovementsHistory({ type = 'all', limit }: MovementsHistoryProps) {
  const { data: allMovements, isLoading } = useStockMovements();
  
  const movements = allMovements
    ?.filter((m) => type === 'all' || m.type === type)
    .slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Istoric Mișcări
          {type !== 'all' && (
            <span className="text-sm font-normal text-muted-foreground">
              ({type === 'entry' ? 'Intrări' : 'Ieșiri'})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !movements || movements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nu există mișcări de stoc înregistrate
          </p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[80px]">Tip</TableHead>
                  <TableHead>Produs</TableHead>
                  <TableHead>Referință</TableHead>
                  <TableHead className="text-right">Cantitate</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full',
                          movement.type === 'entry'
                            ? 'bg-success/10 text-success'
                            : 'bg-destructive/10 text-destructive'
                        )}
                      >
                        {movement.type === 'entry' ? (
                          <ArrowDownToLine className="h-4 w-4" />
                        ) : (
                          <ArrowUpFromLine className="h-4 w-4" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{movement.product?.name || 'Produs șters'}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {movement.product?.code || '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm">{movement.reference || '-'}</p>
                        <p className="text-xs text-muted-foreground">{movement.notes || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'font-semibold',
                          movement.type === 'entry' ? 'text-success' : 'text-destructive'
                        )}
                      >
                        {movement.type === 'entry' ? '+' : '-'}
                        {movement.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(movement.date), 'd MMM yyyy', { locale: ro })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
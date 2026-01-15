import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockMovements } from '@/data/mockData';
import { StockMovement } from '@/types';
import { ArrowDownToLine, ArrowUpFromLine, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface MovementsHistoryProps {
  type?: 'entry' | 'exit' | 'all';
  limit?: number;
}

export function MovementsHistory({ type = 'all', limit }: MovementsHistoryProps) {
  const movements = mockMovements
    .filter((m) => type === 'all' || m.type === type)
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
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px]">Tip</TableHead>
                <TableHead>Produs</TableHead>
                <TableHead>Document</TableHead>
                <TableHead className="text-right">Cantitate</TableHead>
                <TableHead>Operator</TableHead>
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
                      <p className="font-medium">{movement.productName}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {movement.productCode}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-mono text-sm">{movement.documentNumber}</p>
                      <p className="text-xs text-muted-foreground">{movement.reason}</p>
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
                  <TableCell className="text-sm">{movement.operator}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(movement.date), 'd MMM yyyy', { locale: ro })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

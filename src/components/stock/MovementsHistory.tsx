import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useWarehouseContext } from '@/hooks/useWarehouse';
import { ArrowDownToLine, ArrowUpFromLine, History, Loader2, ArrowUpDown, SortAsc, SortDesc } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { MovementType } from '@/types';

interface MovementsHistoryProps {
  type?: MovementType | 'all';
  limit?: number;
}

type SortField = 'date' | 'product' | 'quantity';
type SortOrder = 'asc' | 'desc';

export function MovementsHistory({ type = 'all', limit }: MovementsHistoryProps) {
  const { selectedWarehouse } = useWarehouseContext();
  const { data: allMovements, isLoading, refetch } = useStockMovements(selectedWarehouse?.id);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const movements = useMemo(() => {
    if (!allMovements) return [];
    
    let filtered = allMovements.filter((m) => type === 'all' || m.type === type);
    
    // Sort the movements
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'product':
          const nameA = a.product?.name || '';
          const nameB = b.product?.name || '';
          comparison = nameA.localeCompare(nameB, 'ro');
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return limit ? filtered.slice(0, limit) : filtered;
  }, [allMovements, type, limit, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortOrder === 'asc' 
      ? <SortAsc className="h-4 w-4 ml-1" />
      : <SortDesc className="h-4 w-4 ml-1" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Istoric Mișcări
          {type !== 'all' && (
            <span className="text-sm font-normal text-muted-foreground">
              ({type === 'entry' ? 'Intrări' : 'Ieșiri'})
            </span>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Sortare" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">După dată</SelectItem>
              <SelectItem value="product">După produs</SelectItem>
              <SelectItem value="quantity">După cantitate</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="h-8 px-2"
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
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
                  <TableHead>
                    <button
                      onClick={() => toggleSort('product')}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Produs
                      {getSortIcon('product')}
                    </button>
                  </TableHead>
                  <TableHead>Referință</TableHead>
                  <TableHead className="text-right">
                    <button
                      onClick={() => toggleSort('quantity')}
                      className="flex items-center justify-end w-full hover:text-foreground transition-colors"
                    >
                      Cantitate
                      {getSortIcon('quantity')}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => toggleSort('date')}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Data
                      {getSortIcon('date')}
                    </button>
                  </TableHead>
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
                      {format(new Date(movement.date), 'd MMM yyyy, HH:mm', { locale: ro })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {movements && movements.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {movements.length} {movements.length === 1 ? 'înregistrare' : 'înregistrări'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

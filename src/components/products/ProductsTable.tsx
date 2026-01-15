import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CategoryBadge } from '@/components/ui/category-badge';
import { Product } from '@/types';
import { Edit, Trash2, Eye, MoreHorizontal, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface ProductsTableProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onView?: (product: Product) => void;
}

export function ProductsTable({ products, onEdit, onDelete, onView }: ProductsTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Cod</TableHead>
            <TableHead className="font-semibold">Produs</TableHead>
            <TableHead className="font-semibold">Categorie</TableHead>
            <TableHead className="font-semibold text-right">Cantitate</TableHead>
            <TableHead className="font-semibold">Locație</TableHead>
            <TableHead className="font-semibold">Expirare</TableHead>
            <TableHead className="font-semibold text-right">Preț</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const isLowStock = product.quantity <= product.minStock;
            const expirationDate = new Date(product.expirationDate);
            const isExpiringSoon =
              expirationDate <= new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

            return (
              <TableRow
                key={product.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <TableCell className="font-mono text-sm">{product.code}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{product.name}</span>
                    {isLowStock && (
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {product.supplier}
                  </span>
                </TableCell>
                <TableCell>
                  <CategoryBadge category={product.category} size="sm" />
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      'font-semibold',
                      isLowStock ? 'text-destructive' : ''
                    )}
                  >
                    {product.quantity}
                  </span>
                  <span className="text-muted-foreground text-sm ml-1">
                    {product.unit}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-sm">{product.location}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'text-sm',
                      isExpiringSoon ? 'text-warning font-medium' : ''
                    )}
                  >
                    {format(expirationDate, 'd MMM yyyy', { locale: ro })}
                  </span>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {product.price.toLocaleString()} RON
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView?.(product)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Vizualizare
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(product)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editare
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete?.(product)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Ștergere
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

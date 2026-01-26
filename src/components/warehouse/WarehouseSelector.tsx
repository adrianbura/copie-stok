import { useWarehouseContext, useAllowedWarehouses, Warehouse } from '@/hooks/useWarehouse';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Warehouse as WarehouseIcon, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WarehouseSelectorProps {
  onSelect?: (warehouse: Warehouse) => void;
  className?: string;
}

export function WarehouseSelector({ onSelect, className }: WarehouseSelectorProps) {
  const { setSelectedWarehouse } = useWarehouseContext();
  const { data: allowedWarehouses = [], isLoading, isError } = useAllowedWarehouses();

  const handleSelect = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    onSelect?.(warehouse);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Eroare la încărcarea depozitelor. Reîncarcă pagina.
        </AlertDescription>
      </Alert>
    );
  }

  if (allowedWarehouses.length === 0) {
    return (
      <div className="text-center py-8 space-y-2">
        <p className="text-muted-foreground">
          Nu ai acces la niciun depozit.
        </p>
        <p className="text-sm text-muted-foreground">
          Contactează administratorul pentru a primi acces.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", className)}>
      {allowedWarehouses.map((warehouse) => (
        <Card
          key={warehouse.id}
          className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md"
          onClick={() => handleSelect(warehouse)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <WarehouseIcon className="h-5 w-5 text-primary" />
              {warehouse.name}
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              {warehouse.code}
            </CardDescription>
          </CardHeader>
          {warehouse.address && (
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {warehouse.address}
              </p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

export function WarehouseIndicator() {
  const { selectedWarehouse, clearSelection } = useWarehouseContext();

  if (!selectedWarehouse) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
      <WarehouseIcon className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">{selectedWarehouse.name}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 hover:bg-primary/20"
        onClick={clearSelection}
        title="Schimbă depozitul"
      >
        ×
      </Button>
    </div>
  );
}

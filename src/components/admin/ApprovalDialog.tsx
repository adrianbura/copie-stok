import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Warehouse, Check } from 'lucide-react';
import { useWarehouses, Warehouse as WarehouseType } from '@/hooks/useWarehouse';
import { PendingApproval } from '@/hooks/usePendingApprovals';

interface ApprovalDialogProps {
  approval: PendingApproval | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (approval: PendingApproval, warehouseIds: string[]) => void;
  isApproving: boolean;
}

export function ApprovalDialog({
  approval,
  open,
  onOpenChange,
  onApprove,
  isApproving,
}: ApprovalDialogProps) {
  const { data: warehouses = [], isLoading: warehousesLoading } = useWarehouses();
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);

  // Reset selection when dialog opens with a new approval
  useEffect(() => {
    if (open && approval) {
      // By default, select all warehouses
      setSelectedWarehouses(warehouses.map(w => w.id));
    }
  }, [open, approval, warehouses]);

  const handleWarehouseToggle = (warehouseId: string) => {
    setSelectedWarehouses(prev => {
      if (prev.includes(warehouseId)) {
        return prev.filter(id => id !== warehouseId);
      } else {
        return [...prev, warehouseId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedWarehouses.length === warehouses.length) {
      setSelectedWarehouses([]);
    } else {
      setSelectedWarehouses(warehouses.map(w => w.id));
    }
  };

  const handleApprove = () => {
    if (approval && selectedWarehouses.length > 0) {
      onApprove(approval, selectedWarehouses);
    }
  };

  if (!approval) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" />
            Aprobă Utilizator
          </DialogTitle>
          <DialogDescription>
            Selectează depozitele la care <strong>{approval.full_name || approval.email}</strong> va avea acces.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Depozite disponibile</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs"
            >
              {selectedWarehouses.length === warehouses.length ? 'Deselectează toate' : 'Selectează toate'}
            </Button>
          </div>

          {warehousesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : warehouses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nu există depozite configurate.
            </p>
          ) : (
            <div className="space-y-3">
              {warehouses.map((warehouse) => (
                <div
                  key={warehouse.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleWarehouseToggle(warehouse.id)}
                >
                  <Checkbox
                    id={`warehouse-${warehouse.id}`}
                    checked={selectedWarehouses.includes(warehouse.id)}
                    onCheckedChange={() => handleWarehouseToggle(warehouse.id)}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <Warehouse className="h-4 w-4 text-primary" />
                    <div>
                      <Label
                        htmlFor={`warehouse-${warehouse.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {warehouse.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">{warehouse.code}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedWarehouses.length === 0 && (
            <p className="text-sm text-destructive text-center">
              Selectează cel puțin un depozit pentru aprobare.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isApproving}>
            Anulează
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isApproving || selectedWarehouses.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            {isApproving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Se aprobă...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Aprobă ({selectedWarehouses.length} {selectedWarehouses.length === 1 ? 'depozit' : 'depozite'})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

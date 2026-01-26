import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Warehouse } from 'lucide-react';
import { Warehouse as WarehouseType } from '@/hooks/useWarehouse';

interface WarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: WarehouseType | null;
  onSave: (data: { code: string; name: string; address?: string }) => Promise<void>;
  isLoading?: boolean;
}

export function WarehouseDialog({ open, onOpenChange, warehouse, onSave, isLoading }: WarehouseDialogProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  const isEdit = !!warehouse;

  useEffect(() => {
    if (warehouse) {
      setCode(warehouse.code);
      setName(warehouse.name);
      setAddress(warehouse.address || '');
    } else {
      setCode('');
      setName('');
      setAddress('');
    }
  }, [warehouse, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    
    await onSave({
      code: code.trim(),
      name: name.trim(),
      address: address.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            {isEdit ? 'Editează Depozit' : 'Depozit Nou'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Modifică datele depozitului selectat.' 
              : 'Completează datele pentru noul depozit.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Cod Depozit *</Label>
            <Input
              id="code"
              placeholder="DEP-03"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-muted-foreground">Cod scurt pentru identificare rapidă</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nume Depozit *</Label>
            <Input
              id="name"
              placeholder="Depozit Pirotehnice SRL"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresă (opțional)</Label>
            <Textarea
              id="address"
              placeholder="Str. Exemplu nr. 10, București"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isLoading}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Anulează
            </Button>
            <Button type="submit" disabled={isLoading || !code.trim() || !name.trim()}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? 'Salvează' : 'Creează'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

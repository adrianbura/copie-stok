import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Warehouse, Plus, Pencil, Trash2, MapPin, Users, Loader2 } from 'lucide-react';
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, Warehouse as WarehouseType } from '@/hooks/useWarehouse';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { WarehouseDialog } from '@/components/admin/WarehouseDialog';
import { AllWarehousesStockDialog } from '@/components/admin/AllWarehousesStockDialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function AdminWarehouses() {
  const { isAdmin } = useAuth();
  const { data: warehouses = [], isLoading } = useWarehouses();
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null);
  const [deleteWarehouse, setDeleteWarehouse] = useState<WarehouseType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get user count per warehouse
  const { data: userCounts = {} } = useQuery({
    queryKey: ['warehouse-user-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_warehouses')
        .select('warehouse_id');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(row => {
        counts[row.warehouse_id] = (counts[row.warehouse_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleCreate = () => {
    setEditingWarehouse(null);
    setDialogOpen(true);
  };

  const handleEdit = (warehouse: WarehouseType) => {
    setEditingWarehouse(warehouse);
    setDialogOpen(true);
  };

  const handleSave = async (data: { code: string; name: string; address?: string }) => {
    if (editingWarehouse) {
      await updateWarehouse.mutateAsync({ id: editingWarehouse.id, ...data });
    } else {
      await createWarehouse.mutateAsync(data);
    }
    setDialogOpen(false);
    setEditingWarehouse(null);
  };

  const handleDelete = async () => {
    if (!deleteWarehouse) return;
    
    setIsDeleting(true);
    try {
      await updateWarehouse.mutateAsync({ 
        id: deleteWarehouse.id, 
        is_active: false 
      });
      setDeleteWarehouse(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Warehouse className="h-6 w-6" />
              Administrare Depozite
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestionează depozitele și locațiile de stocare
            </p>
          </div>
          <div className="flex gap-2">
            <AllWarehousesStockDialog />
            <Button onClick={handleCreate} className="gradient-fire">
              <Plus className="h-4 w-4 mr-2" />
              Depozit Nou
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Warehouse className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{warehouses.length}</p>
                  <p className="text-sm text-muted-foreground">Depozite Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Object.values(userCounts).reduce((a, b) => a + b, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Permisiuni Acordate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <MapPin className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {warehouses.filter(w => w.address).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Cu Adresă Configurată</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warehouses Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista Depozitelor</CardTitle>
            <CardDescription>
              Toate depozitele active din sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : warehouses.length === 0 ? (
              <div className="text-center py-8">
                <Warehouse className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nu există depozite.</p>
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Creează Primul Depozit
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cod</TableHead>
                    <TableHead>Nume</TableHead>
                    <TableHead>Adresă</TableHead>
                    <TableHead className="text-center">Utilizatori</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {warehouse.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{warehouse.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {warehouse.address || '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {userCounts[warehouse.id] || 0} utilizatori
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
                          Activ
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(warehouse)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteWarehouse(warehouse)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <WarehouseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        warehouse={editingWarehouse}
        onSave={handleSave}
        isLoading={createWarehouse.isPending || updateWarehouse.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteWarehouse} onOpenChange={() => setDeleteWarehouse(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dezactivează Depozitul?</AlertDialogTitle>
            <AlertDialogDescription>
              Depozitul <strong>{deleteWarehouse?.name}</strong> va fi dezactivat și nu va mai fi vizibil pentru utilizatori.
              Datele existente (stoc, mișcări, documente) vor fi păstrate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Dezactivează
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

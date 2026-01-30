import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Download, Upload, Shield, AlertTriangle, CheckCircle2, FileJson, Loader2, Building2, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useWarehouseContext } from '@/hooks/useWarehouse';

interface BackupData {
  version: string;
  createdAt: string;
  backupType: 'global' | 'warehouse';
  warehouseId?: string;
  warehouseName?: string;
  warehouseCode?: string;
  products: any[];
  stockMovements: any[];
  warehouseStock: any[];
  warehouses: any[];
  inventoryDocuments: any[];
  companySettings: any;
  alerts: any[];
}

export default function AdminBackup() {
  const { isAdmin, loading } = useAuth();
  const { selectedWarehouse } = useWarehouseContext();
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isCreatingWarehouseBackup, setIsCreatingWarehouseBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [finalConfirmOpen, setFinalConfirmOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupPreview, setBackupPreview] = useState<BackupData | null>(null);
  const [confirmText, setConfirmText] = useState('');

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const createGlobalBackup = async () => {
    setIsCreatingBackup(true);
    try {
      // Fetch all data from tables
      const [
        productsRes,
        movementsRes,
        warehouseStockRes,
        warehousesRes,
        documentsRes,
        companyRes,
        alertsRes,
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('stock_movements').select('*'),
        supabase.from('warehouse_stock').select('*'),
        supabase.from('warehouses').select('*'),
        supabase.from('inventory_documents').select('*'),
        supabase.from('company_settings').select('*').maybeSingle(),
        supabase.from('alerts').select('*'),
      ]);

      // Check for errors
      if (productsRes.error) throw productsRes.error;
      if (movementsRes.error) throw movementsRes.error;
      if (warehouseStockRes.error) throw warehouseStockRes.error;
      if (warehousesRes.error) throw warehousesRes.error;
      if (documentsRes.error) throw documentsRes.error;
      if (companyRes.error) throw companyRes.error;
      if (alertsRes.error) throw alertsRes.error;

      const backupData: BackupData = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        backupType: 'global',
        products: productsRes.data || [],
        stockMovements: movementsRes.data || [],
        warehouseStock: warehouseStockRes.data || [],
        warehouses: warehousesRes.data || [],
        inventoryDocuments: documentsRes.data || [],
        companySettings: companyRes.data,
        alerts: alertsRes.data || [],
      };

      downloadBackup(backupData, 'backup_global');
      
      toast.success('Backup global creat cu succes!', {
        description: `${backupData.products.length} produse, ${backupData.stockMovements.length} mișcări exportate`,
      });
    } catch (error: any) {
      console.error('Error creating backup:', error);
      toast.error('Eroare la crearea backup-ului', {
        description: error.message,
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const createWarehouseBackup = async () => {
    if (!selectedWarehouse) {
      toast.error('Niciun depozit selectat', {
        description: 'Selectați un depozit din meniul principal',
      });
      return;
    }

    setIsCreatingWarehouseBackup(true);
    try {
      // Get products that have stock in this warehouse
      const { data: warehouseStockData, error: stockError } = await supabase
        .from('warehouse_stock')
        .select('*, product:products(*)')
        .eq('warehouse_id', selectedWarehouse.id);

      if (stockError) throw stockError;

      // Get product IDs that have stock in this warehouse
      const productIds = warehouseStockData?.map(ws => ws.product_id) || [];

      // Get movements for this warehouse
      const { data: movementsData, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('warehouse_id', selectedWarehouse.id);

      if (movementsError) throw movementsError;

      // Get documents for this warehouse
      const { data: documentsData, error: documentsError } = await supabase
        .from('inventory_documents')
        .select('*')
        .eq('warehouse', selectedWarehouse.name);

      if (documentsError) throw documentsError;

      // Get products
      const products = warehouseStockData?.map(ws => ws.product).filter(Boolean) || [];

      // Get alerts for products in this warehouse
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .in('product_id', productIds.length > 0 ? productIds : ['00000000-0000-0000-0000-000000000000']);

      if (alertsError) throw alertsError;

      const backupData: BackupData = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        backupType: 'warehouse',
        warehouseId: selectedWarehouse.id,
        warehouseName: selectedWarehouse.name,
        warehouseCode: selectedWarehouse.code,
        products: products,
        stockMovements: movementsData || [],
        warehouseStock: warehouseStockData?.map(ws => ({
          id: ws.id,
          warehouse_id: ws.warehouse_id,
          product_id: ws.product_id,
          quantity: ws.quantity,
          min_stock: ws.min_stock,
          location: ws.location,
          created_at: ws.created_at,
          updated_at: ws.updated_at,
        })) || [],
        warehouses: [selectedWarehouse],
        inventoryDocuments: documentsData || [],
        companySettings: null,
        alerts: alertsData || [],
      };

      downloadBackup(backupData, `backup_${selectedWarehouse.code}`);

      toast.success(`Backup ${selectedWarehouse.code} creat cu succes!`, {
        description: `${products.length} produse, ${movementsData?.length || 0} mișcări exportate`,
      });
    } catch (error: any) {
      console.error('Error creating warehouse backup:', error);
      toast.error('Eroare la crearea backup-ului', {
        description: error.message,
      });
    } finally {
      setIsCreatingWarehouseBackup(false);
    }
  };

  const downloadBackup = (data: BackupData, prefix: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
    a.href = url;
    a.download = `${prefix}_${dateStr}_${timeStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Fișier invalid', {
        description: 'Selectați un fișier JSON valid',
      });
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;

      // Validate structure
      if (!data.version || !data.createdAt || !Array.isArray(data.products)) {
        throw new Error('Structură fișier invalidă');
      }

      if (!data.stockMovements || !data.warehouses) {
        throw new Error('Fișierul nu conține toate datele necesare');
      }

      setSelectedFile(file);
      setBackupPreview(data);
      setConfirmRestoreOpen(true);
    } catch (error: any) {
      console.error('Error parsing backup file:', error);
      toast.error('Fișier backup invalid', {
        description: error.message || 'Nu s-a putut citi fișierul',
      });
      setSelectedFile(null);
      setBackupPreview(null);
    }

    // Reset input
    e.target.value = '';
  };

  const proceedToFinalConfirm = () => {
    setConfirmRestoreOpen(false);
    setFinalConfirmOpen(true);
    setConfirmText('');
  };

  const executeRestore = async () => {
    if (!backupPreview) return;

    setFinalConfirmOpen(false);
    setIsRestoring(true);

    try {
      if (backupPreview.backupType === 'warehouse' && backupPreview.warehouseId) {
        // Warehouse-specific restore - only delete and restore data for this warehouse
        await executeWarehouseRestore(backupPreview);
      } else {
        // Global restore - delete everything and restore
        await executeGlobalRestore(backupPreview);
      }

      toast.success('Restaurare completă!', {
        description: backupPreview.backupType === 'warehouse' 
          ? `Depozit ${backupPreview.warehouseCode} restaurat cu succes`
          : `${backupPreview.products.length} produse, ${backupPreview.stockMovements.length} mișcări restaurate`,
      });

      // Reset state
      setSelectedFile(null);
      setBackupPreview(null);
      setConfirmText('');

    } catch (error: any) {
      console.error('Error restoring backup:', error);
      toast.error('Eroare la restaurare', {
        description: error.message,
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const executeGlobalRestore = async (data: BackupData) => {
    // Delete existing data in correct order (respecting foreign keys)
    const deleteAlerts = await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteAlerts.error) throw deleteAlerts.error;

    const deleteMovements = await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteMovements.error) throw deleteMovements.error;

    const deleteWarehouseStock = await supabase.from('warehouse_stock').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteWarehouseStock.error) throw deleteWarehouseStock.error;

    const deleteDocuments = await supabase.from('inventory_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteDocuments.error) throw deleteDocuments.error;

    const deleteProducts = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteProducts.error) throw deleteProducts.error;

    const deleteWarehouses = await supabase.from('warehouses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteWarehouses.error) throw deleteWarehouses.error;

    // Insert new data in correct order
    if (data.warehouses.length > 0) {
      const { error } = await supabase.from('warehouses').insert(data.warehouses);
      if (error) throw error;
    }

    if (data.products.length > 0) {
      const { error } = await supabase.from('products').insert(data.products);
      if (error) throw error;
    }

    if (data.warehouseStock.length > 0) {
      const { error } = await supabase.from('warehouse_stock').insert(data.warehouseStock);
      if (error) throw error;
    }

    if (data.stockMovements.length > 0) {
      const { error } = await supabase.from('stock_movements').insert(data.stockMovements);
      if (error) throw error;
    }

    if (data.inventoryDocuments.length > 0) {
      const { error } = await supabase.from('inventory_documents').insert(data.inventoryDocuments);
      if (error) throw error;
    }

    if (data.alerts.length > 0) {
      const alertsToInsert = data.alerts.map(a => ({
        ...a,
        acknowledged: false,
        acknowledged_at: null,
        acknowledged_by: null,
      }));
      const { error } = await supabase.from('alerts').insert(alertsToInsert);
      if (error) throw error;
    }

    if (data.companySettings) {
      const { error } = await supabase
        .from('company_settings')
        .update(data.companySettings)
        .eq('id', data.companySettings.id);
      if (error) {
        await supabase.from('company_settings').insert(data.companySettings);
      }
    }
  };

  const executeWarehouseRestore = async (data: BackupData) => {
    const warehouseId = data.warehouseId!;

    // Delete data only for this warehouse
    const deleteMovements = await supabase.from('stock_movements').delete().eq('warehouse_id', warehouseId);
    if (deleteMovements.error) throw deleteMovements.error;

    const deleteWarehouseStock = await supabase.from('warehouse_stock').delete().eq('warehouse_id', warehouseId);
    if (deleteWarehouseStock.error) throw deleteWarehouseStock.error;

    const deleteDocuments = await supabase.from('inventory_documents').delete().eq('warehouse', data.warehouseName);
    if (deleteDocuments.error) throw deleteDocuments.error;

    // Delete alerts for products in this warehouse
    const productIds = data.products.map(p => p.id);
    if (productIds.length > 0) {
      const deleteAlerts = await supabase.from('alerts').delete().in('product_id', productIds);
      if (deleteAlerts.error) throw deleteAlerts.error;
    }

    // Insert products that don't exist yet (upsert)
    if (data.products.length > 0) {
      for (const product of data.products) {
        const { error } = await supabase
          .from('products')
          .upsert(product, { onConflict: 'id' });
        if (error) throw error;
      }
    }

    // Insert warehouse stock
    if (data.warehouseStock.length > 0) {
      const { error } = await supabase.from('warehouse_stock').insert(data.warehouseStock);
      if (error) throw error;
    }

    // Insert movements
    if (data.stockMovements.length > 0) {
      const { error } = await supabase.from('stock_movements').insert(data.stockMovements);
      if (error) throw error;
    }

    // Insert documents
    if (data.inventoryDocuments.length > 0) {
      const { error } = await supabase.from('inventory_documents').insert(data.inventoryDocuments);
      if (error) throw error;
    }

    // Insert alerts
    if (data.alerts.length > 0) {
      const alertsToInsert = data.alerts.map(a => ({
        ...a,
        acknowledged: false,
        acknowledged_at: null,
        acknowledged_by: null,
      }));
      const { error } = await supabase.from('alerts').insert(alertsToInsert);
      if (error) throw error;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Backup & Restaurare</h1>
            <p className="text-muted-foreground">
              Gestionează backup-urile și restaurează datele aplicației
            </p>
          </div>
        </div>

        {/* Backup Options */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Global Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Backup Global
              </CardTitle>
              <CardDescription>
                Exportă TOATE datele din toate depozitele
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
                <p className="font-medium text-xs uppercase text-muted-foreground">Include:</p>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-xs">
                  <li>Toate produsele din catalog</li>
                  <li>Toate depozitele și stocurile</li>
                  <li>Întregul istoric de mișcări</li>
                  <li>Toate documentele</li>
                  <li>Setările companiei</li>
                </ul>
              </div>

              <Button
                onClick={createGlobalBackup}
                disabled={isCreatingBackup}
                className="w-full"
              >
                {isCreatingBackup ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Se creează...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Backup Global
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Warehouse Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Backup Depozit
              </CardTitle>
              <CardDescription>
                Exportă doar datele depozitului selectat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedWarehouse ? (
                <>
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                    <p className="text-xs text-muted-foreground">Depozit curent:</p>
                    <p className="font-semibold">{selectedWarehouse.name}</p>
                    <Badge variant="outline" className="mt-1">{selectedWarehouse.code}</Badge>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
                    <p className="font-medium text-xs uppercase text-muted-foreground">Include:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-xs">
                      <li>Produse cu stoc în acest depozit</li>
                      <li>Mișcări din acest depozit</li>
                      <li>Documente asociate</li>
                    </ul>
                  </div>

                  <Button
                    onClick={createWarehouseBackup}
                    disabled={isCreatingWarehouseBackup}
                    variant="secondary"
                    className="w-full"
                  >
                    {isCreatingWarehouseBackup ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Se creează...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Backup {selectedWarehouse.code}
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Niciun depozit selectat</p>
                  <p className="text-xs">Selectați un depozit din meniul principal</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Restore Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-destructive" />
                Restaurare din Backup
              </CardTitle>
              <CardDescription>
                Încarcă un fișier backup pentru restaurare
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Restaurarea va suprascrie datele curente. Această acțiune este ireversibilă.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="backup-file" className="cursor-pointer">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                    <FileJson className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Selectează fișier</p>
                    <p className="text-xs text-muted-foreground">JSON backup</p>
                  </div>
                </Label>
                <Input
                  id="backup-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isRestoring}
                />
              </div>

              {isRestoring && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Se restaurează...
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recomandări pentru Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Backup regulat</p>
                  <p className="text-xs text-muted-foreground">
                    Creați backup-uri săptămânal sau după modificări importante
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Stocare sigură</p>
                  <p className="text-xs text-muted-foreground">
                    Păstrați fișierele backup pe dispozitive externe sau în cloud
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Verificare periodică</p>
                  <p className="text-xs text-muted-foreground">
                    Testați restaurarea ocazional pentru a verifica integritatea
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* First Confirmation Dialog */}
      <AlertDialog open={confirmRestoreOpen} onOpenChange={setConfirmRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmare Restaurare
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  {backupPreview?.backupType === 'warehouse' 
                    ? `Sunteți pe cale să restaurați datele pentru depozitul ${backupPreview.warehouseCode}.`
                    : 'Sunteți pe cale să restaurați TOATE datele din backup. Aceasta va șterge toate datele curente.'}
                </p>

                {backupPreview && (
                  <div className="rounded-lg bg-muted p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Fișier backup:</span>
                      <Badge variant="outline">{selectedFile?.name}</Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Tip backup:</span>
                      <Badge variant={backupPreview.backupType === 'global' ? 'default' : 'secondary'}>
                        {backupPreview.backupType === 'global' ? 'Global' : `Depozit ${backupPreview.warehouseCode}`}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Creat la: {new Date(backupPreview.createdAt).toLocaleString('ro-RO')}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Produse: <span className="font-medium">{backupPreview.products.length}</span></div>
                      <div>Depozite: <span className="font-medium">{backupPreview.warehouses.length}</span></div>
                      <div>Mișcări: <span className="font-medium">{backupPreview.stockMovements.length}</span></div>
                      <div>Documente: <span className="font-medium">{backupPreview.inventoryDocuments.length}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSelectedFile(null);
              setBackupPreview(null);
            }}>
              Anulează
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={proceedToFinalConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Continuă
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Final Confirmation Dialog */}
      <AlertDialog open={finalConfirmOpen} onOpenChange={setFinalConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmare Finală
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                  <p className="text-sm font-medium text-destructive">
                    {backupPreview?.backupType === 'warehouse'
                      ? `⚠️ ATENȚIE: Datele pentru depozitul ${backupPreview.warehouseCode} vor fi suprascrise!`
                      : '⚠️ ATENȚIE: Toate datele curente vor fi șterse definitiv!'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Această acțiune nu poate fi anulată. Asigurați-vă că aveți un backup al datelor curente dacă sunt importante.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-text">
                    Tastați <span className="font-mono font-bold">RESTAURARE</span> pentru a confirma:
                  </Label>
                  <Input
                    id="confirm-text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="RESTAURARE"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setConfirmText('');
              setSelectedFile(null);
              setBackupPreview(null);
            }}>
              Anulează
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={executeRestore}
              disabled={confirmText !== 'RESTAURARE'}
            >
              Restaurează Datele
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

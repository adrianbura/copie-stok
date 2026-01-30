import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Download, Upload, Shield, AlertTriangle, CheckCircle2, FileJson, Loader2 } from 'lucide-react';
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

interface BackupData {
  version: string;
  createdAt: string;
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
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
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

  const createBackup = async () => {
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
        products: productsRes.data || [],
        stockMovements: movementsRes.data || [],
        warehouseStock: warehouseStockRes.data || [],
        warehouses: warehousesRes.data || [],
        inventoryDocuments: documentsRes.data || [],
        companySettings: companyRes.data,
        alerts: alertsRes.data || [],
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toTimeString().slice(0, 5).replace(':', '-');
      a.href = url;
      a.download = `backup_pyrostock_${dateStr}_${timeStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Backup creat cu succes!', {
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
      // Delete existing data in correct order (respecting foreign keys)
      // First delete dependent tables
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
      if (backupPreview.warehouses.length > 0) {
        const { error } = await supabase.from('warehouses').insert(backupPreview.warehouses);
        if (error) throw error;
      }

      if (backupPreview.products.length > 0) {
        const { error } = await supabase.from('products').insert(backupPreview.products);
        if (error) throw error;
      }

      if (backupPreview.warehouseStock.length > 0) {
        const { error } = await supabase.from('warehouse_stock').insert(backupPreview.warehouseStock);
        if (error) throw error;
      }

      if (backupPreview.stockMovements.length > 0) {
        const { error } = await supabase.from('stock_movements').insert(backupPreview.stockMovements);
        if (error) throw error;
      }

      if (backupPreview.inventoryDocuments.length > 0) {
        const { error } = await supabase.from('inventory_documents').insert(backupPreview.inventoryDocuments);
        if (error) throw error;
      }

      if (backupPreview.alerts.length > 0) {
        // Don't restore acknowledged status - start fresh
        const alertsToInsert = backupPreview.alerts.map(a => ({
          ...a,
          acknowledged: false,
          acknowledged_at: null,
          acknowledged_by: null,
        }));
        const { error } = await supabase.from('alerts').insert(alertsToInsert);
        if (error) throw error;
      }

      // Update company settings if exists
      if (backupPreview.companySettings) {
        const { error } = await supabase
          .from('company_settings')
          .update(backupPreview.companySettings)
          .eq('id', backupPreview.companySettings.id);
        if (error) {
          // Try insert if update fails
          await supabase.from('company_settings').insert(backupPreview.companySettings);
        }
      }

      toast.success('Restaurare completă!', {
        description: `${backupPreview.products.length} produse, ${backupPreview.stockMovements.length} mișcări restaurate`,
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

        <div className="grid gap-6 md:grid-cols-2">
          {/* Create Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Creare Backup
              </CardTitle>
              <CardDescription>
                Exportă toate datele aplicației într-un fișier JSON
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                <p className="font-medium">Backup-ul va include:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Toate produsele din catalog</li>
                  <li>Stocul curent per depozit</li>
                  <li>Istoric intrări/ieșiri</li>
                  <li>Documente (NIR, Avize)</li>
                  <li>Depozitele configurate</li>
                  <li>Setările companiei</li>
                  <li>Alertele active</li>
                </ul>
              </div>

              <Button
                onClick={createBackup}
                disabled={isCreatingBackup}
                className="w-full"
                size="lg"
              >
                {isCreatingBackup ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Se creează backup...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Creează Backup
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Restore Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-accent-foreground" />
                Restaurare din Backup
              </CardTitle>
              <CardDescription>
                Încarcă un fișier backup pentru a restaura datele
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Atenție!</p>
                    <p className="text-muted-foreground">
                      Restaurarea va șterge toate datele curente și le va înlocui cu cele din backup.
                      Această acțiune este ireversibilă.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="backup-file" className="cursor-pointer">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <FileJson className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Click pentru a selecta fișier</p>
                    <p className="text-xs text-muted-foreground">Fișier JSON backup</p>
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
                  Se restaurează datele...
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
                  Sunteți pe cale să restaurați datele din backup. Aceasta va șterge toate datele curente.
                </p>

                {backupPreview && (
                  <div className="rounded-lg bg-muted p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Fișier backup:</span>
                      <Badge variant="outline">{selectedFile?.name}</Badge>
                    </div>
                    <Separator />
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
                    ⚠️ ATENȚIE: Toate datele curente vor fi șterse definitiv!
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

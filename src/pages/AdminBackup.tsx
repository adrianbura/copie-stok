import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Download, Upload, Shield, AlertTriangle, CheckCircle2, FileJson, Loader2, Building2, Globe } from 'lucide-react';
import { useBackup, BackupData } from '@/hooks/useBackup';
import { useWarehouseContext } from '@/hooks/useWarehouse';
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

export default function AdminBackup() {
  const { isAdmin, loading } = useAuth();
  const { selectedWarehouse } = useWarehouseContext();
  const {
    isCreatingBackup,
    isCreatingWarehouseBackup,
    isRestoring,
    createGlobalBackup,
    createWarehouseBackup,
    validateBackupFile,
    executeRestore,
  } = useBackup();

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

  const handleWarehouseBackup = () => {
    if (selectedWarehouse) {
      createWarehouseBackup(selectedWarehouse);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await validateBackupFile(file);
    if (data) {
      setSelectedFile(file);
      setBackupPreview(data);
      setConfirmRestoreOpen(true);
    }

    e.target.value = '';
  };

  const proceedToFinalConfirm = () => {
    setConfirmRestoreOpen(false);
    setFinalConfirmOpen(true);
    setConfirmText('');
  };

  const handleExecuteRestore = async () => {
    if (!backupPreview) return;

    setFinalConfirmOpen(false);
    const success = await executeRestore(backupPreview);
    
    if (success) {
      setSelectedFile(null);
      setBackupPreview(null);
      setConfirmText('');
    }
  };

  const resetRestoreState = () => {
    setSelectedFile(null);
    setBackupPreview(null);
    setConfirmText('');
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

              <Button onClick={createGlobalBackup} disabled={isCreatingBackup} className="w-full">
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

                  <Button onClick={handleWarehouseBackup} disabled={isCreatingWarehouseBackup} variant="secondary" className="w-full">
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
            <AlertDialogCancel onClick={resetRestoreState}>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={proceedToFinalConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
                    Această acțiune nu poate fi anulată.
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
            <AlertDialogCancel onClick={resetRestoreState}>Anulează</AlertDialogCancel>
            <Button variant="destructive" onClick={handleExecuteRestore} disabled={confirmText !== 'RESTAURARE'}>
              Restaurează Datele
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

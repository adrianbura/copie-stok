import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { Trash2, User, Shield } from 'lucide-react';
import { ResetDataDialog } from './ResetDataDialog';

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserSettingsDialog({ open, onOpenChange }: UserSettingsDialogProps) {
  const { profile, isAdmin, isOperator } = useAuth();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const canResetData = isAdmin;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Setări Utilizator
            </DialogTitle>
            <DialogDescription>
              Gestionează setările contului și datele aplicației.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User Info */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Informații cont
              </h4>
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-sm">
                  <span className="text-muted-foreground">Nume:</span>{' '}
                  <span className="font-medium">{profile?.full_name || 'Nesetat'}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Rol:</span>{' '}
                  <span className="font-medium">
                    {isAdmin ? 'Administrator' : isOperator ? 'Operator' : 'Vizualizator'}
                  </span>
                </p>
              </div>
            </div>

            <Separator />

            {/* Danger Zone */}
            {canResetData && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Zonă Periculoasă
                </h4>
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Șterge toate datele din aplicație (produse, mișcări de stoc, alerte). 
                    Această acțiune este ireversibilă.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setResetDialogOpen(true)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Resetare Date
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ResetDataDialog 
        open={resetDialogOpen} 
        onOpenChange={setResetDialogOpen} 
      />
    </>
  );
}

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWarehouseContext } from '@/hooks/useWarehouse';
import { Loader2, Clock, LogOut, Warehouse } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, profile, loading, signOut } = useAuth();
  const { selectedWarehouse, isLoading: warehouseLoading } = useWarehouseContext();

  if (loading || warehouseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user is approved
  if (profile && !profile.is_approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <Clock className="h-5 w-5" />
              Cont în Așteptare
            </CardTitle>
            <CardDescription>
              Contul tău nu a fost încă aprobat de administrator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Cererea ta de înregistrare a fost primită și este în curs de verificare. 
                Vei primi acces în aplicație după ce un administrator îți va aproba contul.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Dacă ai nevoie urgentă de acces, contactează administratorul.
              </p>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>Autentificat ca: <strong>{user.email}</strong></p>
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Deconectare
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if warehouse is selected
  if (!selectedWarehouse) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

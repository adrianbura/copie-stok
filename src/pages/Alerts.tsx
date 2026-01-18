import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAlerts, useAcknowledgeAlert } from '@/hooks/useAlerts';
import { useProductStats } from '@/hooks/useProducts';
import { Bell, AlertTriangle, ShieldAlert, Clock, CheckCircle, Package, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { AlertType } from '@/types';

const alertIcons: Record<AlertType, typeof AlertTriangle> = {
  low_stock: AlertTriangle,
  expiry: Clock,
  compliance: ShieldAlert,
};

const alertLabels: Record<AlertType, string> = {
  low_stock: 'Stoc Scăzut',
  expiry: 'Expirare Produs',
  compliance: 'Conformitate',
};

export default function Alerts() {
  const { data: alerts, isLoading } = useAlerts();
  const { lowStockCount } = useProductStats();
  const acknowledgeAlert = useAcknowledgeAlert();

  const activeAlerts = alerts?.filter((a) => !a.acknowledged) || [];
  const acknowledgedAlerts = alerts?.filter((a) => a.acknowledged) || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Bell className="h-8 w-8 text-warning" />
              Alerte
            </h1>
            <p className="text-muted-foreground mt-1">Monitorizare și notificări pentru situații critice</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-sm">{activeAlerts.length} active</Badge>
            <Badge variant="secondary" className="text-sm">{acknowledgedAlerts.length} rezolvate</Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className={cn('border-l-4', lowStockCount > 0 ? 'border-l-warning' : 'border-l-success')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', lowStockCount > 0 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success')}>
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stoc Scăzut</p>
                  <p className="text-2xl font-bold">{lowStockCount}</p>
                  <p className="text-xs text-muted-foreground">produse sub limită</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expirare în 6 luni</p>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">produse</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Certificate</p>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground">expiră în curând</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alerte Active ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : activeAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-success/50" />
                <p className="mt-4 text-muted-foreground">Nu există alerte active.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => {
                  const Icon = alertIcons[alert.type] || AlertTriangle;
                  return (
                    <div key={alert.id} className={cn('flex items-center gap-4 p-4 rounded-lg border', alert.severity === 'critical' ? 'bg-destructive/5 border-destructive/30' : 'bg-warning/5 border-warning/30')}>
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0', alert.severity === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning')}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{alertLabels[alert.type]}</span>
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">{alert.severity === 'critical' ? 'Critic' : 'Atenție'}</Badge>
                        </div>
                        <p className="font-medium mt-1">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{format(new Date(alert.created_at), "d MMMM yyyy, HH:mm", { locale: ro })}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => acknowledgeAlert.mutate(alert.id)} disabled={acknowledgeAlert.isPending}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirmă
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockAlerts, getLowStockProducts, getExpiringProducts } from '@/data/mockData';
import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const alertIcons = {
  low_stock: AlertTriangle,
  expiring_product: Clock,
  certificate_expiry: ShieldAlert,
};

const alertLabels = {
  low_stock: 'Stoc Scăzut',
  expiring_product: 'Expirare Produs',
  certificate_expiry: 'Expirare Certificat',
};

export default function Alerts() {
  const [alerts, setAlerts] = useState(mockAlerts);
  const lowStockProducts = getLowStockProducts();
  const expiringProducts = getExpiringProducts(180);

  const activeAlerts = alerts.filter((a) => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter((a) => a.acknowledged);

  const handleAcknowledge = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Bell className="h-8 w-8 text-warning" />
              Alerte
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitorizare și notificări pentru situații critice
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-sm">
              {activeAlerts.length} active
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {acknowledgedAlerts.length} rezolvate
            </Badge>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            className={cn(
              'border-l-4',
              lowStockProducts.length > 0 ? 'border-l-warning' : 'border-l-success'
            )}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl',
                    lowStockProducts.length > 0
                      ? 'bg-warning/10 text-warning'
                      : 'bg-success/10 text-success'
                  )}
                >
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stoc Scăzut</p>
                  <p className="text-2xl font-bold">{lowStockProducts.length}</p>
                  <p className="text-xs text-muted-foreground">produse sub limită</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              'border-l-4',
              expiringProducts.length > 0 ? 'border-l-warning' : 'border-l-success'
            )}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl',
                    expiringProducts.length > 0
                      ? 'bg-warning/10 text-warning'
                      : 'bg-success/10 text-success'
                  )}
                >
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expirare în 6 luni</p>
                  <p className="text-2xl font-bold">{expiringProducts.length}</p>
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
                  <p className="text-2xl font-bold">2</p>
                  <p className="text-xs text-muted-foreground">expiră în curând</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alerte Active ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-success/50" />
                <p className="mt-4 text-muted-foreground">
                  Nu există alerte active. Toate sistemele funcționează normal.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => {
                  const Icon = alertIcons[alert.type];
                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-lg border',
                        alert.severity === 'critical'
                          ? 'bg-destructive/5 border-destructive/30'
                          : 'bg-warning/5 border-warning/30'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0',
                          alert.severity === 'critical'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-warning/10 text-warning'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {alertLabels[alert.type]}
                          </span>
                          <Badge
                            variant={
                              alert.severity === 'critical' ? 'destructive' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {alert.severity === 'critical' ? 'Critic' : 'Atenție'}
                          </Badge>
                        </div>
                        <p className="font-medium mt-1">{alert.productName}</p>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(alert.date), "d MMMM yyyy, HH:mm", {
                            locale: ro,
                          })}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
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

        {/* Acknowledged Alerts */}
        {acknowledgedAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5" />
                Alerte Rezolvate ({acknowledgedAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {acknowledgedAlerts.map((alert) => {
                  const Icon = alertIcons[alert.type];
                  return (
                    <div
                      key={alert.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{alert.productName}</p>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

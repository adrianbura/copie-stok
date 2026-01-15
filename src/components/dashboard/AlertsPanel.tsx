import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockAlerts } from '@/data/mockData';
import { AlertTriangle, ShieldAlert, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

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

export function AlertsPanel() {
  const activeAlerts = mockAlerts.filter((alert) => !alert.acknowledged);

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Alerte Active
        </CardTitle>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
          {activeAlerts.length}
        </span>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nu există alerte active
            </p>
          ) : (
            activeAlerts.map((alert) => {
              const Icon = alertIcons[alert.type];
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border',
                    alert.severity === 'critical'
                      ? 'bg-destructive/5 border-destructive/30'
                      : 'bg-warning/5 border-warning/30'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0',
                      alert.severity === 'critical'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-warning/10 text-warning'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {alertLabels[alert.type]}
                    </p>
                    <p className="text-sm font-medium mt-0.5">{alert.productName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {activeAlerts.length > 0 && (
          <Button asChild variant="outline" className="w-full mt-4">
            <Link to="/alerts">Vezi toate alertele</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

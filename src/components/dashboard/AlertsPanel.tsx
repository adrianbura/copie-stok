import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUnacknowledgedAlerts, useAcknowledgeAlert } from '@/hooks/useAlerts';
import { useWarehouseContext } from '@/hooks/useWarehouse';
import { AlertTriangle, ShieldAlert, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
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

export function AlertsPanel() {
  const { selectedWarehouse } = useWarehouseContext();
  const { data: activeAlerts, isLoading } = useUnacknowledgedAlerts(selectedWarehouse?.id);

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Alerte Active
        </CardTitle>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
          {activeAlerts?.length || 0}
        </span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {!activeAlerts || activeAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nu există alerte active
              </p>
            ) : (
              activeAlerts.map((alert) => {
                const Icon = alertIcons[alert.type] || AlertTriangle;
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
                        {alertLabels[alert.type] || alert.type}
                      </p>
                      <p className="text-sm font-medium mt-0.5">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        {activeAlerts && activeAlerts.length > 0 && (
          <Button asChild variant="outline" className="w-full mt-4">
            <Link to="/alerts">Vezi toate alertele</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
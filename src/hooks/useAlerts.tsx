import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Alert } from '@/types';
import { toast } from 'sonner';

export function useAlerts(warehouseId?: string | null) {
  return useQuery({
    queryKey: ['alerts', warehouseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          product:products(id, code, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // If warehouse is selected, filter alerts to only show those for products in that warehouse
      if (warehouseId) {
        const { data: warehouseStock } = await supabase
          .from('warehouse_stock')
          .select('product_id')
          .eq('warehouse_id', warehouseId);
        
        const warehouseProductIds = new Set(warehouseStock?.map(ws => ws.product_id) || []);
        
        return (data as (Alert & { product: { id: string; code: string; name: string } | null })[])
          .filter(alert => !alert.product_id || warehouseProductIds.has(alert.product_id));
      }
      
      return data as (Alert & { product: { id: string; code: string; name: string } | null })[];
    },
  });
}

export function useUnacknowledgedAlerts(warehouseId?: string | null) {
  return useQuery({
    queryKey: ['alerts', 'unacknowledged', warehouseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          product:products(id, code, name)
        `)
        .eq('acknowledged', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // If warehouse is selected, filter alerts to only show those for products in that warehouse
      if (warehouseId) {
        const { data: warehouseStock } = await supabase
          .from('warehouse_stock')
          .select('product_id')
          .eq('warehouse_id', warehouseId);
        
        const warehouseProductIds = new Set(warehouseStock?.map(ws => ws.product_id) || []);
        
        return (data as (Alert & { product: { id: string; code: string; name: string } | null })[])
          .filter(alert => !alert.product_id || warehouseProductIds.has(alert.product_id));
      }
      
      return data as (Alert & { product: { id: string; code: string; name: string } | null })[];
    },
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase
        .from('alerts')
        .update({
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Alertă confirmată!');
    },
    onError: (error) => {
      console.error('Error acknowledging alert:', error);
      toast.error('Eroare la confirmarea alertei');
    },
  });
}

export function useAlertStats(warehouseId?: string | null) {
  const { data: alerts } = useAlerts(warehouseId);
  
  const unacknowledgedCount = alerts?.filter(a => !a.acknowledged).length ?? 0;
  
  return {
    totalAlerts: alerts?.length ?? 0,
    unacknowledgedCount,
  };
}
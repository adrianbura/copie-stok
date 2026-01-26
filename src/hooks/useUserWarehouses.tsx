import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface UserWarehouse {
  id: string;
  user_id: string;
  warehouse_id: string;
  granted_at: string;
  granted_by: string | null;
}

export function useUserWarehouses(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-warehouses', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      
      const { data, error } = await supabase
        .from('user_warehouses')
        .select('*')
        .eq('user_id', targetUserId);

      if (error) throw error;
      return data as UserWarehouse[];
    },
    enabled: !!targetUserId,
  });
}

export function useAllowedWarehouseIds() {
  const { user, isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['allowed-warehouse-ids', user?.id, isAdmin],
    queryFn: async () => {
      // Admins have access to all warehouses
      if (isAdmin) {
        return null; // null means all warehouses
      }

      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_warehouses')
        .select('warehouse_id')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map(uw => uw.warehouse_id);
    },
    enabled: !!user?.id,
  });
}

export function useAssignUserWarehouses() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, warehouseIds }: { userId: string; warehouseIds: string[] }) => {
      // First delete all existing assignments for this user
      const { error: deleteError } = await supabase
        .from('user_warehouses')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Then insert new assignments
      if (warehouseIds.length > 0) {
        const { error: insertError } = await supabase
          .from('user_warehouses')
          .insert(
            warehouseIds.map(warehouseId => ({
              user_id: userId,
              warehouse_id: warehouseId,
              granted_by: user?.id,
            }))
          );

        if (insertError) throw insertError;
      }

      return { userId, warehouseIds };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-warehouses', data.userId] });
      toast.success('Permisiunile de acces au fost actualizate!');
    },
    onError: (error) => {
      console.error('Error assigning warehouses:', error);
      toast.error('Eroare la actualizarea permisiunilor');
    },
  });
}

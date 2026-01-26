import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface PendingApproval {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
}

export function usePendingApprovals() {
  const { isAdmin, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: approvals = [], isLoading, error } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_approvals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PendingApproval[];
    },
    enabled: isAdmin,
  });

  const approveUser = useMutation({
    mutationFn: async ({ approval, warehouseIds }: { approval: PendingApproval; warehouseIds: string[] }) => {
      // Update pending approval status first
      const { error: approvalError } = await supabase
        .from('pending_approvals')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', approval.id);

      if (approvalError) throw approvalError;

      // Update profile to approved
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('user_id', approval.user_id);

      if (profileError) {
        // Rollback the approval status if profile update fails
        await supabase
          .from('pending_approvals')
          .update({ status: 'pending', approved_at: null, approved_by: null })
          .eq('id', approval.id);
        throw profileError;
      }

      // Assign warehouse access
      if (warehouseIds.length > 0) {
        const { error: warehouseError } = await supabase
          .from('user_warehouses')
          .insert(
            warehouseIds.map(warehouseId => ({
              user_id: approval.user_id,
              warehouse_id: warehouseId,
              granted_by: user?.id,
            }))
          );

        if (warehouseError) {
          console.error('Error assigning warehouses:', warehouseError);
          // Don't rollback - user is approved but we log the warehouse assignment error
        }
      }

      return { approval, warehouseIds };
    },
    onSuccess: ({ approval, warehouseIds }) => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['user-warehouses', approval.user_id] });
      const warehouseText = warehouseIds.length === 1 
        ? '1 depozit' 
        : `${warehouseIds.length} depozite`;
      toast.success(`Utilizatorul ${approval.full_name || approval.email} a fost aprobat cu acces la ${warehouseText}!`);
    },
    onError: (error) => {
      console.error('Error approving user:', error);
      toast.error('Eroare la aprobarea utilizatorului');
    },
  });

  const rejectUser = useMutation({
    mutationFn: async (approval: PendingApproval) => {
      // Update pending approval status to rejected
      const { error: approvalError } = await supabase
        .from('pending_approvals')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
        })
        .eq('id', approval.id);

      if (approvalError) throw approvalError;

      return approval;
    },
    onSuccess: (approval) => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      toast.success(`Utilizatorul ${approval.full_name || approval.email} a fost respins.`);
    },
    onError: (error) => {
      console.error('Error rejecting user:', error);
      toast.error('Eroare la respingerea utilizatorului');
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (approval: PendingApproval) => {
      // Call the edge function to delete user completely (including auth.users)
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ user_id: approval.user_id }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      return approval;
    },
    onSuccess: (approval) => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      toast.success(`Utilizatorul ${approval.full_name || approval.email} a fost eliminat complet.`);
    },
    onError: (error) => {
      console.error('Error deleting user:', error);
      toast.error('Eroare la eliminarea utilizatorului');
    },
  });

  return {
    approvals,
    isLoading,
    error,
    approveUser,
    rejectUser,
    deleteUser,
    pendingCount: approvals.filter(a => a.status === 'pending').length,
  };
}

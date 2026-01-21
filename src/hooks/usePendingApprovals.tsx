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
  const { isAdmin } = useAuth();
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
    mutationFn: async (approval: PendingApproval) => {
      // Update pending approval status first
      const { error: approvalError } = await supabase
        .from('pending_approvals')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', approval.id);

      if (approvalError) throw approvalError;

      // Update profile to approved - this is the critical step for login access
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('user_id', approval.user_id);

      if (profileError) {
        // Rollback the approval status if profile update fails
        await supabase
          .from('pending_approvals')
          .update({ status: 'pending', approved_at: null })
          .eq('id', approval.id);
        throw profileError;
      }

      return approval;
    },
    onSuccess: (approval) => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      toast.success(`Utilizatorul ${approval.full_name || approval.email} a fost aprobat!`);
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
      // Delete from pending_approvals
      const { error: approvalError } = await supabase
        .from('pending_approvals')
        .delete()
        .eq('id', approval.id);

      if (approvalError) throw approvalError;

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', approval.user_id);

      if (profileError) throw profileError;

      // Delete user roles
      const { error: rolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', approval.user_id);

      if (rolesError) throw rolesError;

      return approval;
    },
    onSuccess: (approval) => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      toast.success(`Utilizatorul ${approval.full_name || approval.email} a fost eliminat.`);
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

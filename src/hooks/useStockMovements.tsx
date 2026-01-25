import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StockMovement, MovementType } from '@/types';
import { toast } from 'sonner';

export interface StockMovementWithDetails {
  id: string;
  product_id: string;
  type: MovementType;
  quantity: number;
  reference: string | null;
  notes: string | null;
  date: string;
  created_at: string;
  created_by: string | null;
  product: { id: string; code: string; name: string; category: string };
  operator_name?: string | null;
}

export function useStockMovements() {
  return useQuery({
    queryKey: ['stock_movements'],
    queryFn: async () => {
      // Fetch movements with product info
      const { data: movements, error: movementsError } = await supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(id, code, name, category)
        `)
        .order('date', { ascending: false });
      
      if (movementsError) throw movementsError;

      // Fetch operator names using security definer function (bypasses RLS)
      const { data: profiles, error: profilesError } = await supabase
        .rpc('get_operator_names');
      
      if (profilesError) throw profilesError;

      // Create a map of user_id to full_name
      const profileMap = new Map(profiles?.map((p: { user_id: string; full_name: string }) => [p.user_id, p.full_name]) || []);

      // Combine data
      return (movements || []).map(m => ({
        ...m,
        operator_name: m.created_by ? profileMap.get(m.created_by) || null : null
      })) as StockMovementWithDetails[];
    },
  });
}

export function useRecentMovements(limit: number = 5) {
  return useQuery({
    queryKey: ['stock_movements', 'recent', limit],
    queryFn: async () => {
      const { data: movements, error: movementsError } = await supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(id, code, name, category)
        `)
        .order('date', { ascending: false })
        .limit(limit);
      
      if (movementsError) throw movementsError;

      // Fetch operator names using security definer function (bypasses RLS)
      const { data: profiles, error: profilesError } = await supabase
        .rpc('get_operator_names');
      
      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map((p: { user_id: string; full_name: string }) => [p.user_id, p.full_name]) || []);

      return (movements || []).map(m => ({
        ...m,
        operator_name: m.created_by ? profileMap.get(m.created_by) || null : null
      })) as StockMovementWithDetails[];
    },
  });
}

interface CreateMovementInput {
  product_id: string;
  type: MovementType;
  quantity: number;
  reference?: string;
  notes?: string;
  date?: string;
  warehouse_id?: string;
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (movement: CreateMovementInput) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('stock_movements')
        .insert({
          ...movement,
          date: movement.date || new Date().toISOString(),
          created_by: user?.id || null,
          warehouse_id: movement.warehouse_id || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse_stock'] });
      toast.success('Mișcare de stoc înregistrată cu succes!');
    },
    onError: (error) => {
      console.error('Error creating stock movement:', error);
      toast.error('Eroare la înregistrarea mișcării de stoc');
    },
  });
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StockMovement, MovementType } from '@/types';
import { toast } from 'sonner';

export function useStockMovements() {
  return useQuery({
    queryKey: ['stock_movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(id, code, name, category)
        `)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as (StockMovement & { product: { id: string; code: string; name: string; category: string } })[];
    },
  });
}

export function useRecentMovements(limit: number = 5) {
  return useQuery({
    queryKey: ['stock_movements', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(id, code, name, category)
        `)
        .order('date', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as (StockMovement & { product: { id: string; code: string; name: string; category: string } })[];
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
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (movement: CreateMovementInput) => {
      const { data, error } = await supabase
        .from('stock_movements')
        .insert({
          ...movement,
          date: movement.date || new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Mișcare de stoc înregistrată cu succes!');
    },
    onError: (error) => {
      console.error('Error creating stock movement:', error);
      toast.error('Eroare la înregistrarea mișcării de stoc');
    },
  });
}
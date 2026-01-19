import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, PyroCategory } from '@/types';
import { toast } from 'sonner';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!id,
  });
}

interface CreateProductInput {
  code: string;
  name: string;
  category: PyroCategory;
  quantity?: number;
  min_stock?: number;
  unit_price?: number;
  supplier?: string | null;
  location?: string | null;
  batch_number?: string | null;
  expiry_date?: string | null;
  net_weight?: number | null;
  hazard_class?: string | null;
  certification?: string | null;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: CreateProductInput) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produs adăugat cu succes!');
    },
    onError: (error) => {
      console.error('Error creating product:', error);
      toast.error('Eroare la adăugarea produsului');
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produs actualizat cu succes!');
    },
    onError: (error) => {
      console.error('Error updating product:', error);
      toast.error('Eroare la actualizarea produsului');
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produs șters cu succes!');
    },
    onError: (error) => {
      console.error('Error deleting product:', error);
      toast.error('Eroare la ștergerea produsului');
    },
  });
}

export function useProductStats() {
  const { data: products } = useProducts();
  
  const totalProducts = products?.length ?? 0;
  
  const totalStockValue = products?.reduce((total, product) => {
    return total + (product.quantity * Number(product.unit_price));
  }, 0) ?? 0;
  
  const lowStockProducts = products?.filter(
    product => product.quantity <= product.min_stock
  ) ?? [];
  
  const stockByCategory = products?.reduce((acc, product) => {
    const category = product.category as PyroCategory;
    acc[category] = (acc[category] || 0) + product.quantity;
    return acc;
  }, {} as Record<PyroCategory, number>) ?? {} as Record<PyroCategory, number>;
  
  return {
    totalProducts,
    totalStockValue,
    lowStockProducts,
    lowStockCount: lowStockProducts.length,
    stockByCategory,
  };
}
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
      queryClient.invalidateQueries({ queryKey: ['warehouse_stock'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse_stock_products'] });
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

// Hook for warehouse-specific product stats
export function useWarehouseProductStats(warehouseId?: string | null) {
  const { data: products } = useProducts();
  
  const { data: warehouseStock } = useQuery({
    queryKey: ['warehouse_stock', warehouseId],
    queryFn: async () => {
      if (!warehouseId) return [];
      
      const { data, error } = await supabase
        .from('warehouse_stock')
        .select(`
          *,
          product:products(id, code, name, category, unit_price)
        `)
        .eq('warehouse_id', warehouseId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!warehouseId,
  });
  
  // If no warehouse selected, return global stats
  if (!warehouseId || !warehouseStock) {
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
      warehouseStock: [],
    };
  }
  
  // Warehouse-specific stats
  const totalProducts = warehouseStock.filter(ws => ws.quantity > 0).length;
  
  const totalStockValue = warehouseStock.reduce((total, ws) => {
    const unitPrice = Number(ws.product?.unit_price || 0);
    return total + (ws.quantity * unitPrice);
  }, 0);
  
  const lowStockProducts = warehouseStock.filter(
    ws => ws.quantity <= ws.min_stock && ws.quantity > 0
  );
  
  const stockByCategory = warehouseStock.reduce((acc, ws) => {
    const category = ws.product?.category as PyroCategory;
    if (category) {
      acc[category] = (acc[category] || 0) + ws.quantity;
    }
    return acc;
  }, {} as Record<PyroCategory, number>);
  
  return {
    totalProducts,
    totalStockValue,
    lowStockProducts,
    lowStockCount: lowStockProducts.length,
    stockByCategory,
    warehouseStock,
  };
}

// Hook to get products available in a specific warehouse
export function useWarehouseProducts(warehouseId?: string | null) {
  const { data: allProducts } = useProducts();
  
  const { data: warehouseStock, isLoading } = useQuery({
    queryKey: ['warehouse_stock_products', warehouseId],
    queryFn: async () => {
      if (!warehouseId) return [];
      
      const { data, error } = await supabase
        .from('warehouse_stock')
        .select(`
          quantity,
          min_stock,
          location,
          product:products(*)
        `)
        .eq('warehouse_id', warehouseId)
        .gt('quantity', 0);
      
      if (error) throw error;
      return data;
    },
    enabled: !!warehouseId,
  });
  
  // If warehouse is selected, return only products with stock in that warehouse
  if (warehouseId && warehouseStock) {
    const products = warehouseStock
      .filter((ws: any) => ws.product)
      .map((ws: any) => ({
        ...ws.product,
        quantity: ws.quantity,
        min_stock: ws.min_stock,
        location: ws.location || ws.product.location,
      })) as Product[];
    
    return { data: products, isLoading };
  }
  
  // Fallback to all products if no warehouse selected
  return { data: allProducts, isLoading: false };
}
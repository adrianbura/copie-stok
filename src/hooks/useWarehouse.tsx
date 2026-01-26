import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WarehouseStock {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  min_stock: number;
  location: string | null;
  created_at: string;
  updated_at: string;
}

interface WarehouseContextType {
  selectedWarehouse: Warehouse | null;
  setSelectedWarehouse: (warehouse: Warehouse | null) => void;
  warehouses: Warehouse[];
  isLoading: boolean;
  clearSelection: () => void;
}

const WAREHOUSE_STORAGE_KEY = 'pyrostock_selected_warehouse';

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [selectedWarehouse, setSelectedWarehouseState] = useState<Warehouse | null>(null);
  const { data: warehouses = [], isLoading } = useWarehouses();

  // Load selected warehouse from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(WAREHOUSE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSelectedWarehouseState(parsed);
      } catch (e) {
        console.error('Error parsing stored warehouse:', e);
        localStorage.removeItem(WAREHOUSE_STORAGE_KEY);
      }
    }
  }, []);

  // Validate stored warehouse exists when warehouses load
  // Only clear if we have loaded warehouses AND the warehouse was deleted (not just not in cache yet)
  useEffect(() => {
    if (warehouses.length > 0 && selectedWarehouse) {
      const exists = warehouses.find(w => w.id === selectedWarehouse.id);
      if (exists) {
        // Update stored data if warehouse was renamed
        if (exists.name !== selectedWarehouse.name || exists.code !== selectedWarehouse.code) {
          setSelectedWarehouseState(exists);
          localStorage.setItem(WAREHOUSE_STORAGE_KEY, JSON.stringify(exists));
        }
      }
      // Note: We don't clear selection if warehouse isn't found - it might just be a new one
      // that hasn't been refetched yet. The warehouse will be validated on actual use.
    }
  }, [warehouses, selectedWarehouse]);

  const setSelectedWarehouse = (warehouse: Warehouse | null) => {
    setSelectedWarehouseState(warehouse);
    if (warehouse) {
      localStorage.setItem(WAREHOUSE_STORAGE_KEY, JSON.stringify(warehouse));
    } else {
      localStorage.removeItem(WAREHOUSE_STORAGE_KEY);
    }
  };

  const clearSelection = () => {
    setSelectedWarehouseState(null);
    localStorage.removeItem(WAREHOUSE_STORAGE_KEY);
  };

  return (
    <WarehouseContext.Provider
      value={{
        selectedWarehouse,
        setSelectedWarehouse,
        warehouses,
        isLoading,
        clearSelection,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouseContext() {
  const context = useContext(WarehouseContext);
  if (context === undefined) {
    return {
      selectedWarehouse: null,
      setSelectedWarehouse: () => {},
      warehouses: [],
      isLoading: true,
      clearSelection: () => {},
    };
  }
  return context;
}

// Query hooks - returns all active warehouses (for admins and selectors)
export function useWarehouses() {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('is_active', true)
        .order('code', { ascending: true });
      
      if (error) throw error;
      return data as Warehouse[];
    },
    staleTime: 0, // Always refetch to get latest warehouses
    refetchOnMount: true,
  });
}

// Returns warehouses filtered by user permissions
export function useAllowedWarehouses() {
  const { data: allWarehouses = [], isLoading: warehousesLoading } = useWarehouses();
  
  return useQuery({
    queryKey: ['allowed-warehouses', allWarehouses.map(w => w.id)],
    queryFn: async () => {
      // First check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Check admin status
      const { data: isAdminData } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      
      if (isAdminData) {
        return allWarehouses;
      }

      // Get user's allowed warehouse IDs
      const { data: userWarehouses, error } = await supabase
        .from('user_warehouses')
        .select('warehouse_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const allowedIds = userWarehouses.map(uw => uw.warehouse_id);
      return allWarehouses.filter(w => allowedIds.includes(w.id));
    },
    enabled: !warehousesLoading && allWarehouses.length > 0,
  });
}

export function useWarehouseStock(warehouseId: string | null) {
  return useQuery({
    queryKey: ['warehouse_stock', warehouseId],
    queryFn: async () => {
      if (!warehouseId) return [];
      
      const { data, error } = await supabase
        .from('warehouse_stock')
        .select(`
          *,
          product:products(*)
        `)
        .eq('warehouse_id', warehouseId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!warehouseId,
  });
}

export function useProductWarehouseStock(productId: string | null, warehouseId: string | null) {
  return useQuery({
    queryKey: ['warehouse_stock', warehouseId, productId],
    queryFn: async () => {
      if (!warehouseId || !productId) return null;
      
      const { data, error } = await supabase
        .from('warehouse_stock')
        .select('*')
        .eq('warehouse_id', warehouseId)
        .eq('product_id', productId)
        .maybeSingle();
      
      if (error) throw error;
      return data as WarehouseStock | null;
    },
    enabled: !!warehouseId && !!productId,
  });
}

// Mutation hooks
export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (warehouse: { code: string; name: string; address?: string }) => {
      const { data, error } = await supabase
        .from('warehouses')
        .insert(warehouse)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Depozit creat cu succes!');
    },
    onError: (error) => {
      console.error('Error creating warehouse:', error);
      toast.error('Eroare la crearea depozitului');
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; code?: string; name?: string; address?: string; is_active?: boolean }) => {
      const { error } = await supabase
        .from('warehouses')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success('Depozit actualizat cu succes!');
    },
    onError: (error) => {
      console.error('Error updating warehouse:', error);
      toast.error('Eroare la actualizarea depozitului');
    },
  });
}

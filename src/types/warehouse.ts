// Re-export from useWarehouse hook for backward compatibility
// This avoids duplicate type definitions
export type { Warehouse, WarehouseStock } from '@/hooks/useWarehouse';

// Extended type for warehouse stock with product details
export interface WarehouseStockWithProduct {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  min_stock: number;
  location: string | null;
  created_at: string;
  updated_at: string;
  product: {
    id: string;
    code: string;
    name: string;
    category: string;
    unit_price: number;
    supplier: string | null;
    batch_number: string | null;
    expiry_date: string | null;
  };
}

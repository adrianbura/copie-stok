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

export interface WarehouseStockWithProduct extends WarehouseStock {
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

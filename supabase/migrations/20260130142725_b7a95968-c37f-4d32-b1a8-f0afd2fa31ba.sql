-- Add warehouse_id column to products table for warehouse isolation
ALTER TABLE public.products 
ADD COLUMN warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE;

-- Create index for faster queries filtered by warehouse
CREATE INDEX idx_products_warehouse_id ON public.products(warehouse_id);

-- Create unique constraint for code + warehouse combination
-- This allows same code in different warehouses
ALTER TABLE public.products ADD CONSTRAINT unique_product_code_per_warehouse UNIQUE (code, warehouse_id);

-- Drop the old unique constraint on code if it exists (allow same code in different warehouses)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_code_key') THEN
    ALTER TABLE public.products DROP CONSTRAINT products_code_key;
  END IF;
END $$;
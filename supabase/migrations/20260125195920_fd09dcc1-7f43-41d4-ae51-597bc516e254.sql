-- Create warehouses table
CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

-- RLS policies for warehouses
CREATE POLICY "Authenticated users can view warehouses"
ON public.warehouses FOR SELECT
USING (is_authenticated());

CREATE POLICY "Admins can manage warehouses"
ON public.warehouses FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create warehouse_stock table (stock per product per warehouse)
CREATE TABLE public.warehouse_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 10,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(warehouse_id, product_id)
);

-- Enable RLS
ALTER TABLE public.warehouse_stock ENABLE ROW LEVEL SECURITY;

-- RLS policies for warehouse_stock
CREATE POLICY "Authenticated users can view warehouse stock"
ON public.warehouse_stock FOR SELECT
USING (is_authenticated());

CREATE POLICY "Operators and admins can insert warehouse stock"
ON public.warehouse_stock FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operator'));

CREATE POLICY "Operators and admins can update warehouse stock"
ON public.warehouse_stock FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operator'));

CREATE POLICY "Operators and admins can delete warehouse stock"
ON public.warehouse_stock FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'operator'));

-- Add warehouse_id to stock_movements
ALTER TABLE public.stock_movements ADD COLUMN warehouse_id UUID REFERENCES public.warehouses(id);

-- Create trigger to update warehouse_stock on movement
CREATE OR REPLACE FUNCTION public.update_warehouse_stock_on_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only process if warehouse_id is set
  IF NEW.warehouse_id IS NOT NULL THEN
    -- Ensure warehouse_stock record exists
    INSERT INTO public.warehouse_stock (warehouse_id, product_id, quantity)
    VALUES (NEW.warehouse_id, NEW.product_id, 0)
    ON CONFLICT (warehouse_id, product_id) DO NOTHING;
    
    -- Update quantity based on movement type
    IF NEW.type = 'entry' THEN
      UPDATE public.warehouse_stock 
      SET quantity = quantity + NEW.quantity,
          updated_at = now()
      WHERE warehouse_id = NEW.warehouse_id AND product_id = NEW.product_id;
    ELSIF NEW.type = 'exit' THEN
      UPDATE public.warehouse_stock 
      SET quantity = quantity - NEW.quantity,
          updated_at = now()
      WHERE warehouse_id = NEW.warehouse_id AND product_id = NEW.product_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER update_warehouse_stock_trigger
AFTER INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_warehouse_stock_on_movement();

-- Insert default warehouses
INSERT INTO public.warehouses (code, name, address) VALUES
('DEP-01', 'Depozit Principal', 'Adresa depozitului principal'),
('DEP-02', 'Depozit Secundar', 'Adresa depozitului secundar');

-- Add updated_at trigger for warehouses
CREATE TRIGGER update_warehouses_updated_at
BEFORE UPDATE ON public.warehouses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for warehouse_stock
CREATE TRIGGER update_warehouse_stock_updated_at
BEFORE UPDATE ON public.warehouse_stock
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Drop existing delete policies
DROP POLICY IF EXISTS "Only admins can delete products" ON public.products;
DROP POLICY IF EXISTS "Only admins can delete movements" ON public.stock_movements;

-- Create new delete policies that allow operators and admins
CREATE POLICY "Operators and admins can delete products" 
ON public.products 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'operator'::user_role));

CREATE POLICY "Operators and admins can delete movements" 
ON public.stock_movements 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'operator'::user_role));
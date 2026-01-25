-- Drop old policy and create public read policy for warehouses
DROP POLICY IF EXISTS "Authenticated users can view warehouses" ON public.warehouses;

CREATE POLICY "Anyone can view active warehouses"
ON public.warehouses FOR SELECT
USING (is_active = true);
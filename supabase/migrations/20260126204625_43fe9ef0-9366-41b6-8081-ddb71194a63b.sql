-- Create user_warehouses table to track which warehouses each user can access
CREATE TABLE public.user_warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  granted_by UUID,
  UNIQUE(user_id, warehouse_id)
);

-- Enable RLS
ALTER TABLE public.user_warehouses ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all user warehouse assignments
CREATE POLICY "Admins can view all user warehouses"
  ON public.user_warehouses
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role));

-- Policy: Users can view their own warehouse assignments
CREATE POLICY "Users can view their own warehouses"
  ON public.user_warehouses
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Admins can insert user warehouse assignments
CREATE POLICY "Admins can insert user warehouses"
  ON public.user_warehouses
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Policy: Admins can delete user warehouse assignments
CREATE POLICY "Admins can delete user warehouses"
  ON public.user_warehouses
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::user_role));

-- Policy: Admins can update user warehouse assignments
CREATE POLICY "Admins can update user warehouses"
  ON public.user_warehouses
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::user_role));

-- Create a function to check if user has access to a warehouse
CREATE OR REPLACE FUNCTION public.user_has_warehouse_access(_user_id uuid, _warehouse_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_warehouses
    WHERE user_id = _user_id
      AND warehouse_id = _warehouse_id
  ) OR has_role(_user_id, 'admin'::user_role)
$$;

-- Grant admins access to all warehouses automatically (they don't need entries in user_warehouses)
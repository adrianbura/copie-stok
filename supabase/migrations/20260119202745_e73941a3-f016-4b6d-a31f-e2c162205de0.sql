-- Create a security definer function to get operator names for movements
-- This bypasses RLS to allow reading profile names for display purposes
CREATE OR REPLACE FUNCTION public.get_operator_names()
RETURNS TABLE (user_id uuid, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT profiles.user_id, profiles.full_name
  FROM public.profiles
$$;
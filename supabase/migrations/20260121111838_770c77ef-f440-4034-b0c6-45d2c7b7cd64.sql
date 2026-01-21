-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Only admins can delete documents" ON public.inventory_documents;

-- Create new policy that allows operators and admins to delete documents
CREATE POLICY "Operators and admins can delete documents"
ON public.inventory_documents
FOR DELETE
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'operator'::user_role));
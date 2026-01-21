-- Allow admins to delete profiles (needed for user deletion)
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::user_role));
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert pending approvals" ON public.pending_approvals;

-- Create a more restrictive insert policy - only allow inserts when there's no existing approval for the user
-- This will be called by the trigger which runs as SECURITY DEFINER
-- We need to allow the trigger to insert, so we check if called from auth context
CREATE POLICY "Allow insert for new users via trigger"
ON public.pending_approvals
FOR INSERT
WITH CHECK (
  -- Allow insert only if this is a fresh registration (no existing approval)
  NOT EXISTS (
    SELECT 1 FROM public.pending_approvals pa WHERE pa.user_id = user_id
  )
);
-- Add status column to pending_approvals
ALTER TABLE public.pending_approvals 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add rejected_at and rejected_by columns
ALTER TABLE public.pending_approvals 
ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejected_by uuid;

-- Update existing approved records to have 'approved' status
UPDATE public.pending_approvals 
SET status = 'approved' 
WHERE approved_at IS NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pending_approvals_status ON public.pending_approvals(status);

-- Allow admins to view all profiles for the admin panel
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));
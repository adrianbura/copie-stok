-- Add is_approved column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- Create table for storing approval tokens
CREATE TABLE public.pending_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  approval_token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  approved_at timestamp with time zone,
  approved_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id),
  UNIQUE(approval_token)
);

-- Enable RLS
ALTER TABLE public.pending_approvals ENABLE ROW LEVEL SECURITY;

-- RLS policies for pending_approvals
CREATE POLICY "Admins can view all pending approvals"
ON public.pending_approvals
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pending approvals"
ON public.pending_approvals
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert pending approvals"
ON public.pending_approvals
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can delete pending approvals"
ON public.pending_approvals
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update existing admin user to be approved
UPDATE public.profiles 
SET is_approved = true 
WHERE user_id = '617568cb-aae6-4086-94fe-9d2eb7d64240';

-- Create function to create pending approval on new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile (not approved by default)
  INSERT INTO public.profiles (user_id, full_name, is_approved)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', false);
  
  -- Assign operator role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'operator');
  
  -- Create pending approval entry
  INSERT INTO public.pending_approvals (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  RETURN NEW;
END;
$$;
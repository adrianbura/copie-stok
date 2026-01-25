-- Create company_settings table for storing company information
CREATE TABLE public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'FIRMA MEA SRL',
  registration_number TEXT DEFAULT 'J40/XXXXX/20XX',
  cui TEXT DEFAULT 'RO XXXXXXXX',
  address TEXT DEFAULT 'București, Sector X',
  phone TEXT,
  email TEXT,
  bank_name TEXT,
  bank_account TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view company settings" 
ON public.company_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update company settings" 
ON public.company_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can insert company settings" 
ON public.company_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Insert default settings
INSERT INTO public.company_settings (company_name, registration_number, cui, address)
VALUES ('ARTIFICII GROUP SRL', 'J40/XXXXX/20XX', 'RO XXXXXXXX', 'București, Sector X');

-- Add updated_at trigger
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
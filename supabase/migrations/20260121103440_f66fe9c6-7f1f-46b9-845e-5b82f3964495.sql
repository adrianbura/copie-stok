-- Create inventory_documents table for storing entry/exit document history
CREATE TABLE public.inventory_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('entry', 'exit')),
  document_number TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  warehouse TEXT,
  partner TEXT, -- supplier for entries, beneficiary for exits
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of {product_id, code, name, category, quantity, unit_price}
  total_value NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  CONSTRAINT unique_document_number_per_type UNIQUE (type, document_number)
);

-- Enable Row Level Security
ALTER TABLE public.inventory_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view documents" 
ON public.inventory_documents 
FOR SELECT 
USING (true);

CREATE POLICY "Operators and admins can insert documents" 
ON public.inventory_documents 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'operator'::user_role));

CREATE POLICY "Only admins can update documents" 
ON public.inventory_documents 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Only admins can delete documents" 
ON public.inventory_documents 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create index for faster queries
CREATE INDEX idx_inventory_documents_type ON public.inventory_documents(type);
CREATE INDEX idx_inventory_documents_date ON public.inventory_documents(date DESC);
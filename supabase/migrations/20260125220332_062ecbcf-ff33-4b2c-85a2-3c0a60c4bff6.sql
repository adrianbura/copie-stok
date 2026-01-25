-- Drop the old global unique constraint
ALTER TABLE public.inventory_documents 
DROP CONSTRAINT IF EXISTS unique_document_number_per_type;

-- Add new warehouse-scoped unique constraint
-- This allows each warehouse to have its own NIR-2026-0001, NIR-2026-0002, etc.
ALTER TABLE public.inventory_documents 
ADD CONSTRAINT unique_document_number_per_warehouse_type 
UNIQUE (document_number, type, warehouse);

-- Add index for better query performance when filtering by warehouse
CREATE INDEX IF NOT EXISTS idx_inventory_documents_warehouse_type_number 
ON public.inventory_documents (warehouse, type, document_number);
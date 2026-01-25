import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DocumentItem {
  product_id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  unit_price?: number;
}

export interface InventoryDocument {
  id: string;
  type: 'entry' | 'exit';
  document_number: string;
  date: string;
  warehouse: string | null;
  partner: string | null;
  notes: string | null;
  items: DocumentItem[];
  total_value: number;
  created_at: string;
  created_by: string | null;
  operator_name?: string;
}

interface CreateDocumentInput {
  type: 'entry' | 'exit';
  document_number: string;
  date: string;
  warehouse?: string;
  partner?: string;
  notes?: string;
  items: DocumentItem[];
  total_value?: number;
}

// Helper to parse items from database
function parseItems(items: unknown): DocumentItem[] {
  if (!items) return [];
  if (Array.isArray(items)) return items as DocumentItem[];
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Fetch all documents by type
export function useInventoryDocuments(type: 'entry' | 'exit', warehouseId?: string | null) {
  return useQuery({
    queryKey: ['inventory_documents', type, warehouseId],
    queryFn: async () => {
      let query = supabase
        .from('inventory_documents')
        .select('*')
        .eq('type', type);
      
      // Filter by warehouse if provided
      if (warehouseId) {
        query = query.eq('warehouse', warehouseId);
      }
      
      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;

      // Get operator names
      const { data: operators } = await supabase.rpc('get_operator_names');
      const operatorMap = new Map(operators?.map(op => [op.user_id, op.full_name]) || []);

      return (data || []).map(doc => ({
        ...doc,
        items: parseItems(doc.items),
        operator_name: doc.created_by ? operatorMap.get(doc.created_by) || 'Necunoscut' : 'Sistem',
      })) as InventoryDocument[];
    },
  });
}

// Fetch a single document by ID
export function useInventoryDocument(id: string | null) {
  return useQuery({
    queryKey: ['inventory_document', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('inventory_documents')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Get operator name
      const { data: operators } = await supabase.rpc('get_operator_names');
      const operatorMap = new Map(operators?.map(op => [op.user_id, op.full_name]) || []);

      return {
        ...data,
        items: parseItems(data.items),
        operator_name: data.created_by ? operatorMap.get(data.created_by) || 'Necunoscut' : 'Sistem',
      } as InventoryDocument;
    },
    enabled: !!id,
  });
}

// Create a new document
export function useCreateInventoryDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDocumentInput) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('inventory_documents')
        .insert([{
          type: input.type,
          document_number: input.document_number,
          date: input.date,
          warehouse: input.warehouse || null,
          partner: input.partner || null,
          notes: input.notes || null,
          items: JSON.stringify(input.items),
          total_value: input.total_value || 0,
          created_by: user?.id || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory_documents', variables.type] });
    },
    onError: (error) => {
      console.error('Error creating document:', error);
      toast.error('Eroare la salvarea documentului');
    },
  });
}

// Generate next document number
export function useNextDocumentNumber(type: 'entry' | 'exit') {
  return useQuery({
    queryKey: ['next_document_number', type],
    queryFn: async () => {
      const prefix = type === 'entry' ? 'NIR' : 'AV';
      const year = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('inventory_documents')
        .select('document_number')
        .eq('type', type)
        .like('document_number', `${prefix}-${year}-%`)
        .order('document_number', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastNumber = data[0].document_number;
        const match = lastNumber.match(/-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      return `${prefix}-${year}-${String(nextNumber).padStart(4, '0')}`;
    },
    staleTime: 0, // Always fetch fresh data
  });
}

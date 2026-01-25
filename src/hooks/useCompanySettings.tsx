import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CompanySettings {
  id: string;
  company_name: string;
  registration_number: string | null;
  cui: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  bank_name: string | null;
  bank_account: string | null;
  created_at: string;
  updated_at: string;
}

export function useCompanySettings() {
  return useQuery({
    queryKey: ['company_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as CompanySettings | null;
    },
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<CompanySettings> & { id: string }) => {
      const { data, error } = await supabase
        .from('company_settings')
        .update({
          company_name: settings.company_name,
          registration_number: settings.registration_number,
          cui: settings.cui,
          address: settings.address,
          phone: settings.phone,
          email: settings.email,
          bank_name: settings.bank_name,
          bank_account: settings.bank_account,
        })
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company_settings'] });
      toast.success('Setările companiei au fost salvate');
    },
    onError: (error) => {
      console.error('Error updating company settings:', error);
      toast.error('Eroare la salvarea setărilor');
    },
  });
}

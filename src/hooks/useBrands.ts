import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Brand {
  id: string; name: string; slug: string; logo_url: string | null;
  description: string | null; is_active: boolean; price_unstable: boolean;
  sort: number; created_at: string; updated_at: string;
}
export function useBrands({ activeOnly = true }: { activeOnly?: boolean } = {}) {
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ['catalog', 'brands', activeOnly], staleTime: 60_000, retry: false,
    queryFn: async () => {
      let request = supabase.from('brands').select('*').order('sort', { ascending: true });
      if (activeOnly) request = request.eq('is_active', true);
      const { data, error } = await request;
      if (error) throw error;
      return (data ?? []) as Brand[];
    } });
  return { brands: query.data ?? null, loading: query.isPending, refresh: async () => { await cache.invalidateQueries({ queryKey: ["catalog"] }); return query.refetch(); } };
}

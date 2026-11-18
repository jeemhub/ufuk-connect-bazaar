import { supabase } from '@/integrations/supabase/client';
import { collectCatalogPages } from './catalogPagination';
import type { DbProductRow } from '@/hooks/useProducts';

// Cards never download descriptions or datasheets. Prices remain masked by the view.
export const CARD_COLUMNS = 'id,sku,name_ar,name_en,name_data,brand,category_id,subcategory,price_iqd,price_wholesale_iqd,price_dealer_iqd,price_unstable,stock,image_url,is_active';
export const INDEX_COLUMNS = 'id,sku,name_ar,name_en,name_data,brand,category_id,subcategory';
export type CatalogIndexRow = Pick<DbProductRow, 'id' | 'sku' | 'name_ar' | 'name_en' | 'name_data' | 'brand' | 'category_id' | 'subcategory'>;
export interface CatalogFilter {
  categoryId?: string; brand?: string; stock?: string; subcategory?: string;
  minimum?: number; maximum?: number; ids?: string[]; excludeId?: string;
  sort?: string; featured?: boolean;
}

export async function fetchCategoryKeys() {
  const { data, error } = await supabase.from('categories').select('id,key');
  if (error) throw error;
  return Object.fromEntries((data ?? []).map(c => [c.id, c.key])) as Record<string, string>;
}

export async function fetchCatalogIndex() {
  return collectCatalogPages<CatalogIndexRow>(async (after, limit) => {
    let query = supabase.from('products_public' as never).select(INDEX_COLUMNS).order('id').limit(limit);
    if (after) query = query.gt('id', after);
    const { data, error } = await query;
    return { data: data as unknown as CatalogIndexRow[] | null, error };
  });
}

export async function fetchCatalogPage(filter: CatalogFilter, page = 1, pageSize = 24) {
  const start = (Math.max(1, page) - 1) * pageSize;
  const base = (columns: string, count = false) => {
    let query = supabase.from('products_public' as never).select(columns, count ? { count: 'exact' } : {});
    if (filter.categoryId) query = query.eq('category_id', filter.categoryId);
    if (filter.brand) query = query.eq('brand', filter.brand);
    if (filter.subcategory) query = query.eq('subcategory', filter.subcategory);
    if (filter.stock === 'in' || filter.featured) query = query.gt('stock', 0);
    if (filter.stock === 'out') query = query.lte('stock', 0);
    if (filter.minimum !== undefined || filter.maximum !== undefined || filter.featured) query = query.gt('price_iqd', 0);
    if (filter.minimum !== undefined) query = query.gte('price_iqd', filter.minimum);
    if (filter.maximum !== undefined) query = query.lte('price_iqd', filter.maximum);
    if (filter.excludeId) query = query.neq('id', filter.excludeId);
    return query;
  };
  const ordered = (query: ReturnType<typeof base>) => {
    if (filter.sort === 'price_low' || filter.sort === 'price_high') {
      query = query.order('price_iqd', { ascending: filter.sort === 'price_low', nullsFirst: false });
    } else query = query.order('created_at', { ascending: false });
    return query.order('id');
  };

  // Exact Arabic/synonym/spec matching uses a small shared name index. Bound each
  // IN request to avoid URL limits; fetch only sort keys until the final 24 cards.
  if (filter.ids !== undefined) {
    const ids = [...new Set(filter.ids)];
    if (!ids.length) return { rows: [] as DbProductRow[], total: 0 };
    type Match = { id: string; price_iqd: number | null; created_at: string };
    const matches: Match[] = [];
    for (let from = 0; from < ids.length; from += 100) {
      const { data, error } = await base('id,price_iqd,created_at').in('id', ids.slice(from, from + 100));
      if (error) throw error;
      matches.push(...(data as unknown as Match[] ?? []));
    }
    matches.sort((a, b) => {
      if (filter.sort === 'price_low' || filter.sort === 'price_high') {
        // Zero and masked prices sort last for ascending, as before.
        const x = filter.sort === 'price_low' ? a.price_iqd || Infinity : a.price_iqd || 0;
        const y = filter.sort === 'price_low' ? b.price_iqd || Infinity : b.price_iqd || 0;
        if (x !== y) return filter.sort === 'price_low' ? x - y : y - x;
      } else if (a.created_at !== b.created_at) return b.created_at.localeCompare(a.created_at);
      return a.id.localeCompare(b.id);
    });
    const selected = matches.slice(start, start + pageSize).map(row => row.id);
    if (!selected.length) return { rows: [] as DbProductRow[], total: matches.length };
    const { data, error } = await base(CARD_COLUMNS).in('id', selected);
    if (error) throw error;
    const rows = data as unknown as DbProductRow[] ?? [];
    const rank = new Map(selected.map((id, i) => [id, i]));
    rows.sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
    return { rows, total: matches.length };
  }
  const { data, error, count } = await ordered(base(CARD_COLUMNS, true)).range(start, start + pageSize - 1);
  if (error) throw error;
  return { rows: data as unknown as DbProductRow[] ?? [], total: count ?? 0 };
}

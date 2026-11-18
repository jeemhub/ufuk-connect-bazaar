import { useAuth } from "@/auth/AuthProvider";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Brand, CategoryKey } from "@/data/mockData";
import { collectCatalogPages } from "@/lib/catalogPagination";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CARD_COLUMNS, fetchCategoryKeys, fetchCatalogIndex, fetchCatalogPage, type CatalogFilter } from "@/lib/catalogRequests";

export interface DbProductRow {
  id: string;
  sku: string | null;
  name_ar: string;
  name_en: string;
  name_data?: string | null;
  desc_ar: string | null;
  desc_en: string | null;
  brand: string;
  category_id: string | null;
  subcategory: string | null;
  price_iqd: number | null;
  price_unstable?: boolean;
  price_wholesale_iqd?: number | null;
  price_dealer_iqd?: number | null;
  stock: number;
  image_url: string | null;
  datasheet_url: string | null;
  datasheet_name: string | null;
  is_active: boolean;
  categories?: { key: string } | null;
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=800&q=80";

export function dbToProduct(r: DbProductRow, categoryKey?: string): Product {
  return {
    id: r.id,
    sku: r.sku ?? "",
    nameAr: r.name_ar,
    nameEn: r.name_en,
    nameData: r.name_data ?? undefined,
    descAr: r.desc_ar ?? undefined,
    descEn: r.desc_en ?? undefined,
    brand: (r.brand as Brand) ?? ("" as Brand),
    category: ((r.categories?.key ?? categoryKey) as CategoryKey) ?? ("" as CategoryKey),
    subcategory: r.subcategory ?? "",
    priceUnstable: r.price_unstable === true,
    priceIqd: r.price_unstable ? 0 : Number(r.price_iqd ?? 0),
    priceWholesaleIqd: !r.price_unstable && r.price_wholesale_iqd != null ? Number(r.price_wholesale_iqd) : null,
    priceDealerIqd: !r.price_unstable && r.price_dealer_iqd != null ? Number(r.price_dealer_iqd) : null,
    stock: r.stock ?? 0,
    image: r.image_url || FALLBACK_IMG,
    datasheetUrl: r.datasheet_url ?? undefined,
    datasheetName: r.datasheet_name ?? undefined,
  };
}

export function useCategoryKeys() {
  return useQuery({ queryKey: ["catalog", "categories"], queryFn: fetchCategoryKeys, staleTime: 300_000, retry: false });
}

function useCatalogScope() {
  const { pricingTier, user, loading, isBlocked } = useAuth();
  return { scope: [user?.id ?? "anonymous", pricingTier, !!isBlocked], ready: !loading };
}

export function useCatalogIndex(enabled = true) {
  const { scope, ready } = useCatalogScope();
  return useQuery({ queryKey: ["catalog", "index", ...scope], queryFn: fetchCatalogIndex,
    enabled: enabled && ready, staleTime: 300_000, gcTime: 600_000, retry: false });
}

export function useCatalogPage(filter: CatalogFilter, page = 1, pageSize = 24, enabled = true) {
  const { scope, ready } = useCatalogScope();
  const categories = useCategoryKeys();
  const query = useQuery({ queryKey: ["catalog", "page", ...scope, filter, page, pageSize],
    queryFn: () => fetchCatalogPage(filter, page, pageSize), enabled: ready && enabled,
    staleTime: 60_000, gcTime: 300_000, retry: false });
  return { products: (query.data?.rows ?? []).map(row => dbToProduct(row, row.category_id ? categories.data?.[row.category_id] : undefined)),
    total: query.data?.total ?? 0, loading: enabled && (!ready || query.isPending || categories.isPending),
    error: query.error?.message ?? categories.error?.message ?? null, refetch: query.refetch };
}

// Shared cache is scoped by account and pricing tier; never reuse another account's prices.
export function useProducts(opts?: { activeOnly?: boolean; ids?: string[]; category?: string; brand?: string; limit?: number; inStock?: boolean; featured?: boolean; excludeId?: string; enabled?: boolean }) {
  const { scope, ready } = useCatalogScope();
  const categories = useCategoryKeys();
  const categoryId = Object.keys(categories.data ?? {}).find(id => categories.data?.[id] === opts?.category);
  const enabled = opts?.enabled !== false && ready && (!opts?.category || !!categoryId);
  const query = useQuery({ queryKey: ["catalog", "products", ...scope, opts], enabled,
    staleTime: 60_000, gcTime: 300_000, retry: false,
    queryFn: async () => {
      if (opts?.ids?.length === 0) return [];
      if (opts?.limit || opts?.ids) return (await fetchCatalogPage({ ids: opts.ids, categoryId, brand: opts?.brand,
        stock: opts?.inStock ? "in" : undefined, featured: opts?.featured, excludeId: opts?.excludeId }, 1, opts?.limit ?? opts?.ids?.length ?? 24)).rows;
      return collectCatalogPages<DbProductRow>(async (after, limit) => {
        let request = supabase.from("products_public" as never).select(CARD_COLUMNS).order("id").limit(limit);
        if (categoryId) request = request.eq("category_id", categoryId);
        if (opts?.brand) request = request.eq("brand", opts.brand);
        if (after) request = request.gt("id", after);
        const { data, error } = await request;
        return { data: data as unknown as DbProductRow[] | null, error };
      });
    } });
  return { products: (query.data ?? []).map(row => dbToProduct(row, row.category_id ? categories.data?.[row.category_id] : undefined)),
    loading: opts?.enabled !== false && (!ready || query.isPending || categories.isPending),
    error: query.error?.message ?? categories.error?.message ?? null, refetch: query.refetch };
}

export function useProduct(id: string | undefined) {
  const { scope, ready } = useCatalogScope();
  const categories = useCategoryKeys();
  const query = useQuery({ queryKey: ["catalog", "product", ...scope, id], enabled: !!id && ready,
    staleTime: 60_000, gcTime: 300_000, retry: false, queryFn: async () => {
      const { data, error } = await supabase.from("products_public" as never).select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as unknown as DbProductRow | null;
    } });
  const row = query.data;
  return { product: row ? dbToProduct(row, row.category_id ? categories.data?.[row.category_id] : undefined) : null,
    loading: !!id && (!ready || query.isPending || categories.isPending), error: query.error?.message ?? null };
}

/**
 * Admin product list: reads the underlying table with all 3 prices.
 */
export interface AdminProductRow extends DbProductRow {
  price_wholesale_iqd: number;
  price_dealer_iqd: number;
}

export function useAdminProducts() {
  const cache = useQueryClient();
  const [rows, setRows] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    setLoading(true);
    // Fetch in pages: PostgREST caps a single request at 1000 rows.
    const pageSize = 1000;
    const all: AdminProductRow[] = [];
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(key)")
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) break;
      const chunk = (data as unknown as AdminProductRow[]) ?? [];
      all.push(...chunk);
      if (chunk.length < pageSize) break;
    }
    setRows(all);
    void cache.invalidateQueries({ queryKey: ["catalog"] });
    setLoading(false);
  };


  useEffect(() => { refetch(); }, []);
  return { rows, loading, refetch };
}

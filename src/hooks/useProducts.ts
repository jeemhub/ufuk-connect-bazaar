import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Brand, CategoryKey } from "@/data/mockData";

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
  price_iqd: number;
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
    priceIqd: Number(r.price_iqd ?? 0),
    priceWholesaleIqd: r.price_wholesale_iqd != null ? Number(r.price_wholesale_iqd) : null,
    priceDealerIqd: r.price_dealer_iqd != null ? Number(r.price_dealer_iqd) : null,
    stock: r.stock ?? 0,
    image: r.image_url || FALLBACK_IMG,
    datasheetUrl: r.datasheet_url ?? undefined,
    datasheetName: r.datasheet_name ?? undefined,
  };
}

async function fetchCategoryKeyMap(): Promise<Record<string, string>> {
  const { data } = await supabase.from("categories").select("id,key");
  const m: Record<string, string> = {};
  (data ?? []).forEach((c: { id: string; key: string }) => { m[c.id] = c.key; });
  return m;
}

/**
 * Customer-facing product list: reads from products_public view
 * which only exposes ONE price (the one the user is allowed to see).
 */
export function useProducts(opts?: { activeOnly?: boolean }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    const [{ data, error }, catMap] = await Promise.all([
      supabase.from("products_public" as never).select("*").order("created_at", { ascending: false }),
      fetchCategoryKeyMap(),
    ]);
    if (error) setError(error.message);
    else {
      const rows = (data as unknown as DbProductRow[]) ?? [];
      setProducts(rows.map((r) => dbToProduct(r, r.category_id ? catMap[r.category_id] : undefined)));
    }
    setLoading(false);
  };

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.activeOnly]);

  return { products, loading, error, refetch };
}

export function useProduct(id: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [{ data }, catMap] = await Promise.all([
        supabase.from("products_public" as never).select("*").eq("id", id).maybeSingle(),
        fetchCategoryKeyMap(),
      ]);
      const row = data as unknown as DbProductRow | null;
      setProduct(row ? dbToProduct(row, row.category_id ? catMap[row.category_id] : undefined) : null);
      setLoading(false);
    })();
  }, [id]);

  return { product, loading };
}

/**
 * Admin product list: reads the underlying table with all 3 prices.
 */
export interface AdminProductRow extends DbProductRow {
  price_wholesale_iqd: number;
  price_dealer_iqd: number;
}

export function useAdminProducts() {
  const [rows, setRows] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*, categories(key)")
      .order("created_at", { ascending: false });
    setRows((data as unknown as AdminProductRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { refetch(); }, []);
  return { rows, loading, refetch };
}

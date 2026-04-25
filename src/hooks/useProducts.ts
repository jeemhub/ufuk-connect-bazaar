import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Brand, CategoryKey } from "@/data/mockData";

export interface DbProductRow {
  id: string;
  sku: string | null;
  name_ar: string;
  name_en: string;
  desc_ar: string | null;
  desc_en: string | null;
  brand: string;
  category_id: string | null;
  subcategory: string | null;
  price_iqd: number;
  stock: number;
  image_url: string | null;
  datasheet_url: string | null;
  datasheet_name: string | null;
  is_active: boolean;
  categories?: { key: string } | null;
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=800&q=80";

export function dbToProduct(r: DbProductRow): Product {
  return {
    id: r.id,
    sku: r.sku ?? "",
    nameAr: r.name_ar,
    nameEn: r.name_en,
    descAr: r.desc_ar ?? undefined,
    descEn: r.desc_en ?? undefined,
    brand: (r.brand as Brand) ?? "MikroTik",
    category: ((r.categories?.key as CategoryKey) ?? "networking"),
    subcategory: r.subcategory ?? "",
    priceIqd: Number(r.price_iqd ?? 0),
    stock: r.stock ?? 0,
    image: r.image_url || FALLBACK_IMG,
    datasheetUrl: r.datasheet_url ?? undefined,
    datasheetName: r.datasheet_name ?? undefined,
  };
}

export function useProducts(opts?: { activeOnly?: boolean }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    let q = supabase
      .from("products")
      .select("*, categories(key)")
      .order("created_at", { ascending: false });
    if (opts?.activeOnly) q = q.eq("is_active", true);
    const { data, error } = await q;
    if (error) setError(error.message);
    else setProducts((data as unknown as DbProductRow[]).map(dbToProduct));
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
      const { data } = await supabase
        .from("products")
        .select("*, categories(key)")
        .eq("id", id)
        .maybeSingle();
      setProduct(data ? dbToProduct(data as unknown as DbProductRow) : null);
      setLoading(false);
    })();
  }, [id]);

  return { product, loading };
}

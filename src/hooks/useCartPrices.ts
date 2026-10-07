import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { dbToProduct, type DbProductRow } from "./useProducts";
import { applicablePrice } from "@/lib/catalog";

type CartPrice = { price: number; unstable: boolean };

// Never display persisted cart prices: refresh the protected view whenever the cart opens.
export function useCartPrices(ids: string[], open: boolean) {
  const { pricingTier, user } = useAuth();
  const idsKey = JSON.stringify([...ids].sort());
  const key = `${user?.id ?? "guest"}:${pricingTier}:${idsKey}`;
  const [result, setResult] = useState<{ key: string; prices: Record<string, CartPrice> } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!open) { setResult(null); return; }
    let cancelled = false;
    const refresh = async () => {
      setLoading(true);
      setResult(null);
      try {
        const productIds: string[] = JSON.parse(idsKey);
        if (productIds.length === 0) { if (!cancelled) setResult({ key, prices: {} }); return; }
        const { data, error } = await supabase.from("products_public" as never).select("*").in("id", productIds);
        if (error) { if (!cancelled) setResult({ key, prices: {} }); return; }
        const prices: Record<string, CartPrice> = {};
        for (const row of (data ?? []) as unknown as DbProductRow[]) {
          const product = dbToProduct(row);
          prices[row.id] = { price: applicablePrice(product, pricingTier), unstable: product.priceUnstable === true };
        }
        if (!cancelled) setResult({ key, prices });
      } catch { if (!cancelled) setResult({ key, prices: {} }); } finally { if (!cancelled) setLoading(false); }
    };
    void refresh();
    window.addEventListener("focus", refresh);
    return () => { cancelled = true; window.removeEventListener("focus", refresh); };
  }, [open, idsKey, key, pricingTier]);
  return { prices: result?.key === key ? result.prices : {}, loading: loading || (open && result?.key !== key) };
}

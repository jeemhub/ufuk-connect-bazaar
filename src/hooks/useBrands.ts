import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  sort: number;
  created_at: string;
  updated_at: string;
}

export function useBrands(opts: { activeOnly?: boolean } = {}) {
  const { activeOnly = true } = opts;
  const [brands, setBrands] = useState<Brand[] | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    let q = supabase.from("brands").select("*").order("sort", { ascending: true });
    if (activeOnly) q = q.eq("is_active", true);
    const { data } = await q;
    setBrands((data as Brand[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOnly]);

  return { brands, loading, refresh };
}

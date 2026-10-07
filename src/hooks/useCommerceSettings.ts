import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ShippingZone { city: string; fee: number | null; duration: string; enabled: boolean }
export interface CommerceSettings {
  address: string; hours: string; mapUrl: string; reviewsUrl: string; rating: string;
  whatsapp: string; warranty: string; payments: string; delivery: string; zones: ShippingZone[];
}
export const defaultCommerce: CommerceSettings = {
  address: "البصرة، العراق", hours: "", mapUrl: "", reviewsUrl: "", rating: "",
  whatsapp: "9647716992955", warranty: "", payments: "", delivery: "", zones: [],
};
export function safeHttps(url: string) {
  try { const parsed = new URL(url); return parsed.protocol === "https:" ? parsed.href : undefined; } catch { return undefined; }
}
export function parseCommerceSettings(raw: string): CommerceSettings {
  const settings = { ...defaultCommerce, zones: [] as ShippingZone[] };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return settings;
    for (const key of Object.keys(defaultCommerce).filter(key => key !== "zones") as (Exclude<keyof CommerceSettings,"zones">)[]) {
      if (typeof parsed[key] === "string") settings[key] = parsed[key];
    }
    if (Array.isArray(parsed.zones)) settings.zones = parsed.zones.filter((z: ShippingZone) => z && typeof z.city === "string" && z.city.trim() && typeof z.duration === "string" && typeof z.enabled === "boolean" && (z.fee === null || Number.isSafeInteger(z.fee) && z.fee >= 0)).map((z: ShippingZone) => ({...z,city:z.city.trim()}));
  } catch { /* Keep confirmed defaults if a stored row is invalid. */ }
  return settings;
}
export function useCommerceSettings() {
  const query = useQuery({ queryKey: ["commerce-settings"], staleTime: 60_000, queryFn: async () => {
    const { data, error } = await supabase.from("site_pages").select("content_ar").eq("key", "commerce-settings").maybeSingle();
    if (error) throw error;
    return parseCommerceSettings(data?.content_ar || "{}");
  }});
  return { ...query, settings: query.data ?? defaultCommerce };
}
export interface ProductDetails { specs?: Record<string, string>; warranty?: string; manualUrl?: string }
export function useProductDetails() {
  return useQuery({ queryKey: ["product-details"], staleTime: 60_000, queryFn: async () => {
    const { data, error } = await supabase.from("site_pages").select("content_ar").eq("key", "product-details").maybeSingle();
    if (error) throw error;
    try {
      const parsed = JSON.parse(data?.content_ar || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      return Object.fromEntries(Object.entries(parsed).filter(([,value]) => value && typeof value === "object" && !Array.isArray(value)).map(([id,value]) => {
        const details = value as ProductDetails;
        return [id, {warranty:typeof details.warranty === "string" ? details.warranty : undefined,manualUrl:typeof details.manualUrl === "string" ? details.manualUrl : undefined,
          specs:details.specs && typeof details.specs === "object" ? Object.fromEntries(Object.entries(details.specs).filter(([,v])=>typeof v === "string")) : undefined}];
      })) as Record<string,ProductDetails>;
    } catch { return {}; }
  }});
}

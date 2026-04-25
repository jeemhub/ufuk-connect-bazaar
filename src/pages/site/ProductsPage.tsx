import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import { categories } from "@/data/mockData";
import { ProductCard } from "@/components/site/ProductCard";
import { useProducts } from "@/hooks/useProducts";

const brands = ["MikroTik", "Ruijie", "Must", "Ubiquiti", "TP-Link"];

export default function ProductsPage() {
  const { t, lang } = useLanguage();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [sort, setSort] = useState("newest");
  const category = params.get("category") || "all";
  const { products, loading } = useProducts({ activeOnly: true });

  useEffect(() => { document.title = `${t("nav_shop")} · ${t("brand")}`; }, [t]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (brand !== "all" && p.brand !== brand) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.nameAr.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      }
      return true;
    });
    if (sort === "price_low") list = [...list].sort((a, b) => a.priceIqd - b.priceIqd);
    if (sort === "price_high") list = [...list].sort((a, b) => b.priceIqd - a.priceIqd);
    return list;
  }, [search, brand, category, sort, products]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">{t("nav_shop")}</h1>
        <p className="mt-2 text-muted-foreground">{t("brand_tagline")}</p>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="ps-9" placeholder={t("search_placeholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={(v) => { const next = new URLSearchParams(params); if (v === "all") next.delete("category"); else next.set("category", v); setParams(next); }}>
          <SelectTrigger><SelectValue placeholder={t("filter_category")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_categories")}</SelectItem>
            {categories.map((c) => <SelectItem key={c.key} value={c.key}>{lang === "ar" ? c.ar : c.en}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger><SelectValue placeholder={t("filter_brand")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_brands")}</SelectItem>
            {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>{filtered.length} {t("nav_shop")}</span>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("sort_newest")}</SelectItem>
            <SelectItem value="price_low">{t("sort_price_low")}</SelectItem>
            <SelectItem value="price_high">{t("sort_price_high")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="surface-card p-12 text-center text-muted-foreground">{t("no_products")}</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}

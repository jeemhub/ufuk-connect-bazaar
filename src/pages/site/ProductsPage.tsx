import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import { categories } from "@/data/mockData";
import { ProductCard } from "@/components/site/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { useBrands } from "@/hooks/useBrands";

export default function ProductsPage() {
  const { t, lang } = useLanguage();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const category = params.get("category") || "all";
  const brand = params.get("brand") || "all";

  const setCategory = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === "all") next.delete("category"); else next.set("category", v);
    setParams(next, { replace: true });
  };
  const setBrand = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === "all") next.delete("brand"); else next.set("brand", v);
    setParams(next, { replace: true });
  };
  const clearFilters = () => {
    setParams(new URLSearchParams(), { replace: true });
    setSearch("");
    setSort("newest");
  };
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

  const hasFilters = category !== "all" || brand !== "all" || !!search || sort !== "newest";

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,hsl(var(--primary)/0.15),transparent_50%),radial-gradient(circle_at_80%_70%,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <Badge variant="outline" className="mb-4 rounded-full border-primary/30 bg-primary/5 text-primary">
            {t("nav_shop")}
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">{t("brand")}</h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">{t("brand_tagline")}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {/* Category pills */}
        <div className="mb-6 -mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-center gap-2">
            <button
              onClick={() => setCategory("all")}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
                category === "all"
                  ? "border-primary bg-gradient-brand text-primary-foreground shadow-md"
                  : "border-border bg-card text-foreground/70 hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {t("all_categories")}
            </button>
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold transition-all ${
                  category === c.key
                    ? "border-primary bg-gradient-brand text-primary-foreground shadow-md"
                    : "border-border bg-card text-foreground/70 hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {lang === "ar" ? c.ar : c.en}
              </button>
            ))}
          </div>
        </div>

        {/* Sticky filter bar */}
        <div className="sticky top-16 z-30 -mx-4 mb-6 border-y border-border/60 bg-background/85 px-4 py-3 backdrop-blur-md md:mx-0 md:rounded-2xl md:border md:px-4 md:shadow-sm">
          <div className="grid gap-2 md:grid-cols-[1fr_180px_180px_180px] md:items-center">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="rounded-xl ps-9" placeholder={t("search_placeholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="clear"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("filter_brand")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_brands")}</SelectItem>
                {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="rounded-xl">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("sort_newest")}</SelectItem>
                <SelectItem value="price_low">{t("sort_price_low")}</SelectItem>
                <SelectItem value="price_high">{t("sort_price_high")}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="rounded-xl"
            >
              <X className="me-1 h-4 w-4" />
              {lang === "ar" ? "مسح الفلاتر" : "Clear filters"}
            </Button>
          </div>
        </div>

        {/* Results meta */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{filtered.length}</span>{" "}
            {lang === "ar" ? "منتج" : filtered.length === 1 ? "product" : "products"}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border/60 bg-card">
                <div className="aspect-square animate-pulse bg-muted" />
                <div className="space-y-2 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-base font-semibold">{t("no_products")}</p>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-2 rounded-xl">
                {lang === "ar" ? "مسح الفلاتر" : "Clear filters"}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

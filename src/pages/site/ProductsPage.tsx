import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Seo, SITE_NAME } from "@/components/seo/Seo";
import { titleSpecs } from "@/lib/catalog";
import { useProductDetails } from "@/hooks/useCommerceSettings";
import { Label } from "@/components/ui/label";
import { expandTokens, matchesAllTokens, normalizeSearchText, searchTokens } from "@/lib/search";

export default function ProductsPage() {
  const { t, lang } = useLanguage();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState("newest");
  const category = params.get("category") || "all";
  const brand = params.get("brand") || "all";
  const stock = params.get("stock") || "all";
  const subcategory = params.get("subcategory") || "all";
  const minimum = params.get("min") || "";
  const maximum = params.get("max") || "";
  const [page,setPage] = useState(1);
  const { data: details = {} } = useProductDetails();
  const specFields = useMemo(() => category === "networking" ? ["ports","poe","wifi"] : category === "solar" || category === "ups" ? ["power","capacity"] : [], [category]);
  const specLabels: Record<string,string> = lang === "ar" ? {ports:"عدد المنافذ",poe:"PoE",wifi:"جيل Wi-Fi",power:"القدرة",capacity:"سعة البطارية"} : {ports:"Ports",poe:"PoE",wifi:"Wi-Fi generation",power:"Power",capacity:"Battery capacity"};
  const setFilter = (key: string, value: string) => { const next = new URLSearchParams(params); if (!value || value === "all") next.delete(key); else next.set(key,value); setParams(next,{replace:true}); };


  const setCategory = (v: string) => {
    const next = new URLSearchParams(params);
    next.delete("subcategory"); ["ports","poe","wifi","power","capacity"].forEach(k=>next.delete(k));
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
  const { products, loading, error } = useProducts({ activeOnly: true });
  const { brands } = useBrands({ activeOnly: true });
  const brandNames = useMemo(
    () => ["all", ...Array.from(new Set((brands ?? []).map((b) => b.name).filter(Boolean)))],
    [brands]
  );

  const scoped = products.filter(p => category === "all" || p.category === category);
  const subcategories = [...new Set(scoped.map(p=>p.subcategory).filter(Boolean))];
  const specsFor = useCallback((p: typeof products[number]) => details[p.id]?.specs ?? titleSpecs(p), [details]);
  const qParam = params.get("q") ?? "";
  useEffect(() => { setSearch(qParam); }, [qParam]);

  useEffect(() => { document.title = `${t("nav_shop")} · ${t("brand")}`; }, [t]);

  const filtered = useMemo(() => {
    const searchTerms = search ? expandTokens(searchTokens(search)) : [];
    let list = products.filter((p) => {
      if (stock === "in" && p.stock <= 0 || stock === "out" && p.stock > 0) return false;
      if (subcategory !== "all" && p.subcategory !== subcategory) return false;
      if ((minimum || maximum) && p.priceIqd <= 0) return false;
      if (minimum && p.priceIqd < Number(minimum) || maximum && p.priceIqd > Number(maximum)) return false;
      if (specFields.some(key=>params.get(key) && specsFor(p)[key] !== params.get(key))) return false;
      if (category !== "all" && p.category !== category) return false;
      if (brand !== "all" && p.brand !== brand) return false;
      if (searchTerms.length) {
        const catMeta = categories.find((c) => c.key === p.category);
        const hay = normalizeSearchText(
          [p.nameAr, p.nameEn, p.nameData, p.brand, catMeta ? `${catMeta.ar} ${catMeta.en}` : p.category, p.subcategory, p.sku]
            .filter(Boolean)
            .join(" ")
        );
        return matchesAllTokens(hay, searchTerms);
      }
      return true;
    });
    if (sort === "price_low") list = [...list].sort((a, b) => (a.priceIqd || Infinity) - (b.priceIqd || Infinity));
    if (sort === "price_high") list = [...list].sort((a, b) => (b.priceIqd || -Infinity) - (a.priceIqd || -Infinity));
    return list;
  }, [search, brand, category, sort, products, stock, subcategory, minimum, maximum, params, specFields, specsFor]);

  const hasFilters = params.size > 0 || !!search || sort !== "newest";
  useEffect(()=>setPage(1),[search, brand, category, sort, stock, subcategory, minimum, maximum, params]);
  const pages = Math.max(1, Math.ceil(filtered.length / 24));
  const currentPage = Math.min(page,pages);


  // ---- SEO: title/description reflect the active category & brand ----
  const catMeta = categories.find((c) => c.key === category);
  const catLabel = catMeta ? (lang === "ar" ? catMeta.ar : catMeta.en) : "";
  const seoPath = category !== "all" ? `/products?category=${category}` : "/products";
  const seoTitle =
    lang === "ar"
      ? `${catLabel || "جميع المنتجات"}${brand !== "all" ? ` - ${brand}` : ""} | ${SITE_NAME}`
      : `${catLabel || "All Products"}${brand !== "all" ? ` - ${brand}` : ""} | ${SITE_NAME}`;
  const seoDesc =
    lang === "ar"
      ? `تسوّق ${catLabel || "معدات الشبكات والطاقة الشمسية و UPS"}${brand !== "all" ? ` من ${brand}` : ""} في أُفُق البصرة — أسعار الجملة والوكالة، توفر فوري، دعم فني في العراق.`
      : `Shop ${catLabel || "networking, solar and UPS equipment"}${brand !== "all" ? ` from ${brand}` : ""} at UFUK AL-Basra — wholesale & dealer pricing, in-stock items, technical support in Iraq.`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <Seo title={seoTitle} description={seoDesc} path={seoPath} />
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
              <Input aria-label={lang === "ar" ? "البحث في المنتجات" : "Search products"} className="rounded-xl ps-9" placeholder={t("search_placeholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={lang === "ar" ? "مسح البحث" : "Clear search"}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder={t("filter_brand")} /></SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                <SelectItem value="all">{t("all_brands")}</SelectItem>
                {brandNames.filter((n) => n !== "all").map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
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

        <details className="mb-6 rounded-2xl border bg-card p-4" open={!!stock && stock!=="all" || !!minimum || !!maximum || subcategory!=="all" || specFields.some(k=>params.has(k))}>
          <summary className="cursor-pointer font-bold">{lang === "ar" ? "فلاتر السعر والتوفر والمواصفات" : "Price, stock and specification filters"}</summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><Label htmlFor="filter-stock">{lang === "ar" ? "التوفر" : "Availability"}</Label><select id="filter-stock" className="mt-1 w-full rounded-md border bg-background p-2" value={stock} onChange={e=>setFilter("stock",e.target.value)}><option value="all">{lang === "ar" ? "الكل" : "All"}</option><option value="in">{lang === "ar" ? "متوفر" : "In stock"}</option><option value="out">{lang === "ar" ? "نافد" : "Out of stock"}</option></select></div>
            <div><Label htmlFor="filter-sub">{lang === "ar" ? "الفئة الفرعية" : "Subcategory"}</Label><select id="filter-sub" className="mt-1 w-full rounded-md border bg-background p-2" value={subcategory} onChange={e=>setFilter("subcategory",e.target.value)}><option value="all">{lang === "ar" ? "الكل" : "All"}</option>{subcategories.map(v=><option key={v} value={v}>{v}</option>)}</select></div>
            <div><Label htmlFor="filter-min">{lang === "ar" ? "أقل سعر (د.ع)" : "Minimum IQD"}</Label><Input id="filter-min" type="number" min={0} value={minimum} onChange={e=>setFilter("min",e.target.value)} /></div>
            <div><Label htmlFor="filter-max">{lang === "ar" ? "أعلى سعر (د.ع)" : "Maximum IQD"}</Label><Input id="filter-max" type="number" min={0} value={maximum} onChange={e=>setFilter("max",e.target.value)} /></div>
            {specFields.map(key=><div key={key}><Label htmlFor={`filter-${key}`}>{specLabels[key]}</Label><select id={`filter-${key}`} className="mt-1 w-full rounded-md border bg-background p-2" value={params.get(key)||"all"} onChange={e=>setFilter(key,e.target.value)}><option value="all">{lang === "ar" ? "الكل" : "All"}</option>{[...new Set(scoped.map(p=>specsFor(p)[key]).filter(Boolean))].sort().map(v=><option key={v} value={v}>{v}</option>)}</select></div>)}
          </div>
          {!!specFields.length && <p className="mt-3 text-xs text-muted-foreground">{lang === "ar" ? "تُستخدم المواصفات المدخلة من الإدارة، أو المعلومات المذكورة في العنوان عند عدم توفرها." : "Uses managed specifications, or title information when unavailable."}</p>}
        </details>
        {/* Results meta */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{filtered.length}</span>{" "}
            {lang === "ar" ? "منتج" : filtered.length === 1 ? "product" : "products"}
          </div>
        </div>

        {/* Grid */}
        {error ? (<div role="alert" className="rounded-xl border p-8">{lang === "ar" ? "تعذر تحميل المنتجات. أعد تحميل الصفحة." : "Could not load products. Please reload."}</div>) : loading ? (
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
            {filtered.slice((currentPage-1)*24,currentPage*24).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
        {pages>1 && <nav aria-label={lang === "ar" ? "صفحات المنتجات" : "Product pages"} className="mt-8 flex items-center justify-center gap-4"><Button variant="outline" disabled={currentPage===1} onClick={()=>{setPage(currentPage-1);window.scrollTo({top:300,behavior:"smooth"});}}>{lang === "ar" ? "السابق" : "Previous"}</Button><span aria-live="polite">{currentPage} / {pages}</span><Button variant="outline" disabled={currentPage===pages} onClick={()=>{setPage(currentPage+1);window.scrollTo({top:300,behavior:"smooth"});}}>{lang === "ar" ? "التالي" : "Next"}</Button></nav>}
      </div>
    </div>
  );
}

import { Link, Navigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Download, FileText, Package, ShieldCheck, Truck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatIqd } from "@/data/mockData";
import { ProductCard } from "@/components/site/ProductCard";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/auth/AuthProvider";
import { AddToCartButton } from "@/components/site/AddToCartButton";

export default function ProductDetail() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { pricingTier } = useAuth();
  const { product, loading } = useProduct(id);
  const { products } = useProducts({ activeOnly: true });

  useEffect(() => {
    if (product) document.title = `${lang === "ar" ? product.nameAr : product.nameEn} · ${t("brand")}`;
  }, [product, t, lang]);

  if (loading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2 md:px-6">
        <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="h-12 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }
  if (!product) return <Navigate to="/products" replace />;

  const name = lang === "ar" ? product.nameAr : product.nameEn;
  const desc = lang === "ar" ? product.descAr : product.descEn;
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;

  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-foreground">{t("nav_home")}</Link>
          <Chevron className="h-3.5 w-3.5 opacity-50" />
          <Link to="/products" className="transition-colors hover:text-foreground">{t("nav_shop")}</Link>
          <Chevron className="h-3.5 w-3.5 opacity-50" />
          <span className="line-clamp-1 max-w-[40ch] font-semibold text-foreground">{name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="group relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-secondary/40 via-background to-secondary/20 shadow-sm">
              <div className="aspect-square">
                <img
                  src={product.image}
                  alt={name}
                  className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              {/* Brand watermark */}
              <div className="absolute top-4 start-4">
                <Badge variant="outline" className="rounded-full border-border/60 bg-background/80 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                  {product.brand}
                </Badge>
              </div>
              <div className="absolute top-4 end-4">
                {!inStock ? (
                  <Badge variant="destructive" className="rounded-full">{t("out_of_stock")}</Badge>
                ) : product.stock < 5 ? (
                  <Badge className="rounded-full bg-warning text-warning-foreground">{t("low_stock")}</Badge>
                ) : (
                  <Badge className="rounded-full bg-success text-success-foreground">{t("in_stock")}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Info panel */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full">{product.subcategory}</Badge>
                <span className="text-xs font-mono text-muted-foreground">SKU: {product.sku}</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight md:text-4xl">{name}</h1>
            </div>

            {/* Pricing card */}
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="space-y-3 p-5">
                {/* Retail price */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(142 71% 35%)" }}>
                      {lang === "ar" ? "زبون" : "Customer"}
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-primary md:text-4xl">{formatIqd(product.priceIqd)}</span>
                      <span className="text-xs font-bold text-muted-foreground">{t("currency_iqd")}</span>
                    </div>
                  </div>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: "hsl(142 71% 45% / 0.12)" }}
                  >
                    <Package className="h-5 w-5" style={{ color: "hsl(142 71% 35%)" }} />
                  </div>
                </div>

                {/* Wholesale */}
                {(pricingTier === "wholesale" || pricingTier === "dealer") && product.priceWholesaleIqd ? (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(38 92% 40%)" }}>
                          {lang === "ar" ? "مكتب" : "Wholesale"}
                        </div>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="text-2xl font-extrabold" style={{ color: "hsl(38 92% 40%)" }}>
                            {formatIqd(product.priceWholesaleIqd)}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground">{t("currency_iqd")}</span>
                        </div>
                      </div>
                      <Badge
                        className="rounded-full px-3 py-1 text-xs font-bold"
                        style={{
                          backgroundColor: "hsl(45 100% 51% / 0.15)",
                          color: "hsl(38 92% 40%)",
                          borderColor: "hsl(45 100% 51% / 0.4)",
                        }}
                        variant="outline"
                      >
                        {lang === "ar" ? "خاص" : "Special"}
                      </Badge>
                    </div>
                  </>
                ) : null}

                {/* Dealer */}
                {pricingTier === "dealer" && product.priceDealerIqd ? (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 84% 45%)" }}>
                          {lang === "ar" ? "وكيل" : "Dealer"}
                        </div>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="text-2xl font-extrabold" style={{ color: "hsl(0 84% 45%)" }}>
                            {formatIqd(product.priceDealerIqd)}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground">{t("currency_iqd")}</span>
                        </div>
                      </div>
                      <Badge
                        className="rounded-full px-3 py-1 text-xs font-bold"
                        style={{
                          backgroundColor: "hsl(0 84% 55% / 0.12)",
                          color: "hsl(0 84% 45%)",
                          borderColor: "hsl(0 84% 55% / 0.4)",
                        }}
                        variant="outline"
                      >
                        {lang === "ar" ? "أفضل سعر" : "Best price"}
                      </Badge>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Actions */}
              <div className="border-t border-border/60 bg-muted/30 p-5">
                <div className="flex flex-col gap-3">
                  <AddToCartButton product={product} size="lg" fullWidth className="text-base" />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button asChild size="lg" variant="outline" disabled={!inStock} className="flex-1 text-base font-bold">
                      <Link to={`/quote?product=${product.id}`}>{t("request_quote")}</Link>
                    </Button>
                    {product.datasheetUrl && (
                      <Button asChild size="lg" variant="outline" className="flex-1">
                        <a href={product.datasheetUrl} target="_blank" rel="noopener noreferrer" download={product.datasheetName}>
                          <Download className="me-2 h-4 w-4" />
                          {t("download_datasheet")}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {desc && (
              <div className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold">{lang === "ar" ? "الوصف" : "Description"}</h3>
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">{desc}</p>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: ShieldCheck, l: lang === "ar" ? "ضمان رسمي" : "Warranty" },
                { icon: Truck, l: lang === "ar" ? "توصيل سريع" : "Fast delivery" },
                { icon: Zap, l: lang === "ar" ? "دعم فني" : "Tech support" },
              ].map((f, i) => (
                <div
                  key={i}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-4 text-center transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-xs font-bold">{f.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{t("related_products")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {lang === "ar" ? "منتجات أخرى قد تعجبك" : "You might also like"}
                </p>
              </div>
              <Link to="/products" className="hidden text-sm font-semibold text-primary hover:underline md:block">
                {lang === "ar" ? "عرض الكل" : "View all"}
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

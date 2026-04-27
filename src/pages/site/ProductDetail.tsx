import { Link, Navigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { Download, ShieldCheck, Truck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatIqd } from "@/data/mockData";
import { ProductCard } from "@/components/site/ProductCard";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useAuth } from "@/auth/AuthProvider";

export default function ProductDetail() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { pricingTier } = useAuth();
  const { product, loading } = useProduct(id);
  const { products } = useProducts({ activeOnly: true });

  useEffect(() => {
    if (product) document.title = `${lang === "ar" ? product.nameAr : product.nameEn} · ${t("brand")}`;
  }, [product, t, lang]);

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">…</div>;
  if (!product) return <Navigate to="/products" replace />;

  const name = lang === "ar" ? product.nameAr : product.nameEn;
  const desc = lang === "ar" ? product.descAr : product.descEn;
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">{t("nav_home")}</Link>
        <span className="mx-2">/</span>
        <Link to="/products" className="hover:text-foreground">{t("nav_shop")}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="surface-card overflow-hidden">
          <div className="aspect-square bg-secondary/40">
            <img src={product.image} alt={name} className="h-full w-full object-cover" />
          </div>
        </div>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{product.brand}</Badge>
            <Badge variant="secondary">{product.subcategory}</Badge>
            {product.stock === 0 ? <Badge variant="destructive">{t("out_of_stock")}</Badge> :
              product.stock < 5 ? <Badge className="bg-warning text-warning-foreground">{t("low_stock")}</Badge> :
              <Badge className="bg-success text-success-foreground">{t("in_stock")}</Badge>}
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">{name}</h1>
          <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
          <div className="space-y-2">
            {/* Retail price (always shown) */}
            <div className="flex items-baseline gap-2">
              <span className="min-w-[88px] text-sm font-semibold text-foreground/70">
                {lang === "ar" ? "سعر المفرد" : "Retail"}
              </span>
              <span className="text-3xl font-extrabold text-primary">{formatIqd(product.priceIqd)}</span>
              <span className="text-xs font-semibold text-muted-foreground">{t("currency_iqd")}</span>
            </div>

            {/* Wholesale price — visible to wholesale & dealer */}
            {(pricingTier === "wholesale" || pricingTier === "dealer") && product.priceWholesaleIqd ? (
              <div className="flex items-baseline gap-2">
                <span className="min-w-[88px] text-sm font-semibold" style={{ color: "hsl(45 100% 40%)" }}>
                  {lang === "ar" ? "سعر الجملة" : "Wholesale"}
                </span>
                <span className="text-2xl font-bold" style={{ color: "hsl(45 100% 40%)" }}>
                  {formatIqd(product.priceWholesaleIqd)}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">{t("currency_iqd")}</span>
              </div>
            ) : null}

            {/* Dealer price — visible only to dealers */}
            {pricingTier === "dealer" && product.priceDealerIqd ? (
              <div className="flex items-baseline gap-2">
                <span className="min-w-[88px] text-sm font-semibold" style={{ color: "hsl(0 84% 50%)" }}>
                  {lang === "ar" ? "سعر الوكالة" : "Dealer"}
                </span>
                <span className="text-2xl font-bold" style={{ color: "hsl(0 84% 50%)" }}>
                  {formatIqd(product.priceDealerIqd)}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">{t("currency_iqd")}</span>
              </div>
            ) : null}
          </div>
          {desc && <p className="text-foreground/80 leading-relaxed">{desc}</p>}

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-gradient-brand">
              <Link to={`/quote?product=${product.id}`}>{t("request_quote")}</Link>
            </Button>
            {product.datasheetUrl && (
              <Button asChild size="lg" variant="outline">
                <a href={product.datasheetUrl} target="_blank" rel="noopener noreferrer" download={product.datasheetName}>
                  <Download className="me-2 h-4 w-4" /> {t("download_datasheet")}
                </a>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4">
            {[{ icon: ShieldCheck, l: lang === "ar" ? "ضمان رسمي" : "Warranty" },
              { icon: Truck, l: lang === "ar" ? "توصيل سريع" : "Fast delivery" },
              { icon: Zap, l: lang === "ar" ? "دعم فني" : "Tech support" }].map((f, i) => (
              <div key={i} className="surface-card p-3 text-center">
                <f.icon className="mx-auto mb-1 h-5 w-5 text-primary" />
                <div className="text-xs font-semibold">{f.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">{t("related_products")}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}

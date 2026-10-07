import { ProductActions } from "./ProductActions";
import { productName } from "@/lib/catalog";
import { Link } from "react-router-dom";
import { ArrowUpRight, Package } from "lucide-react";
import { useState } from "react";
import { Product, formatIqd } from "@/data/mockData";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/auth/AuthProvider";
import { AddToCartButton } from "@/components/site/AddToCartButton";
import { optimizedImage, optimizedSrcSet } from "@/lib/img";

export function ProductCard({ product, imageFit = "cover" }: { product: Product; imageFit?: "cover" | "contain" }) {
  const { t, lang } = useLanguage();
  const [imageError, setImageError] = useState(false);
  const { pricingTier } = useAuth();
  const rawName = lang === "ar" ? product.nameAr : product.nameEn;
  const isFallbackName = !rawName?.trim() && !!product.nameData?.trim();
  const name = productName(product, lang);
  const showStock = pricingTier === "dealer" || pricingTier === "wholesale";
  const stockBadge = product.stock === 0 ? "out" : product.stock < 5 ? "low" : "in";

  const tierPrice =
    pricingTier === "dealer" && product.priceDealerIqd
      ? { value: product.priceDealerIqd, label: lang === "ar" ? "وكيل" : "Dealer", color: "hsl(0 84% 50%)" }
      : pricingTier === "wholesale" && product.priceWholesaleIqd
      ? { value: product.priceWholesaleIqd, label: lang === "ar" ? "مكتب" : "Wholesale", color: "hsl(38 92% 40%)" }
      : null;

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant"
    >
      {/* Image area */}
      <Link to={`/products/${product.id}`} className="relative block aspect-square overflow-hidden bg-gradient-to-br from-secondary/60 via-secondary/30 to-background">
        {imageError ? <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground"><Package className="h-12 w-12 opacity-40" strokeWidth={1.4} /><span className="text-xs">{lang === "ar" ? "صورة المنتج غير متاحة" : "Product image unavailable"}</span></div> : <img
          src={optimizedImage(product.image, { width: 600 }) ?? product.image}
          srcSet={optimizedSrcSet(product.image, [300, 450, 600, 900])}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
          alt={name}
          loading="lazy"
          decoding="async"
          width={600}
          height={600}
          className={`h-full w-full transition-transform duration-700 group-hover:scale-105 ${imageFit === "contain" ? "object-contain p-4" : "object-cover"}`}
          onError={() => setImageError(true)}
        />}
        {/* Top badges */}
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          <Badge variant="secondary" className="rounded-full border border-border/50 bg-background/85 px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-sm">
            {product.brand}
          </Badge>
          {stockBadge === "out" && (
            <Badge variant="destructive" className="rounded-full text-[10px]">{t("out_of_stock")}</Badge>
          )}
          {showStock && stockBadge === "low" && (
            <Badge className="rounded-full bg-warning text-[10px] text-warning-foreground">
              {lang === "ar" ? `متبقي ${product.stock}` : `${product.stock} left`}
            </Badge>
          )}
          {showStock && stockBadge === "in" && (
            <Badge className="rounded-full bg-success/90 text-[10px] text-success-foreground backdrop-blur-sm">
              {lang === "ar" ? `المخزون: ${product.stock}` : `Stock: ${product.stock}`}
            </Badge>
          )}
        </div>
        {/* Hover arrow */}
        <div className="absolute bottom-2 end-2 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className={`line-clamp-2 min-h-[2.6rem] text-sm font-semibold transition-colors group-hover:text-primary ${isFallbackName ? "text-yellow-500" : "text-foreground"}`}>
          <Link to={`/products/${product.id}`} title={name}>{name}</Link>
        </h3>
        {product.sku && <div dir="ltr" className="truncate text-xs text-muted-foreground">{product.sku}</div>}
        <div className="mt-auto space-y-0.5">
          <div className="flex items-baseline gap-1.5">
            {product.priceIqd === 0 ? (
              <span className="text-sm font-bold text-muted-foreground">{lang === "ar" ? "السعر عند الطلب" : "Price on request"}</span>
            ) : (
              <>
                <span className="text-lg font-extrabold text-primary">{formatIqd(product.priceIqd)}</span>
                <span className="text-[10px] font-semibold text-muted-foreground">{t("currency_iqd")}</span>
              </>
            )}
          </div>
          {tierPrice && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: tierPrice.color }}>
                {tierPrice.label}
              </span>
              <span className="text-sm font-bold" style={{ color: tierPrice.color }}>
                {formatIqd(tierPrice.value)}
              </span>
            </div>
          )}
        </div>
        <AddToCartButton product={product} size="sm" fullWidth className="mt-2 min-h-10 text-xs" />
        <ProductActions id={product.id} />
      </div>
    </article>
  );
}

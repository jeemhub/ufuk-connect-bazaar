import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Product, formatIqd } from "@/data/mockData";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/auth/AuthProvider";
import { AddToCartButton } from "@/components/site/AddToCartButton";
import { optimizedImage, optimizedSrcSet } from "@/lib/img";

export function ProductCard({ product }: { product: Product }) {
  const { t, lang } = useLanguage();
  const { pricingTier } = useAuth();
  const name = lang === "ar" ? product.nameAr : product.nameEn;
  const showStock = pricingTier === "dealer" || pricingTier === "wholesale";
  const stockBadge = product.stock === 0 ? "out" : product.stock < 5 ? "low" : "in";

  const tierPrice =
    pricingTier === "dealer" && product.priceDealerIqd
      ? { value: product.priceDealerIqd, label: lang === "ar" ? "وكيل" : "Dealer", color: "hsl(0 84% 50%)" }
      : pricingTier === "wholesale" && product.priceWholesaleIqd
      ? { value: product.priceWholesaleIqd, label: lang === "ar" ? "مكتب" : "Wholesale", color: "hsl(38 92% 40%)" }
      : null;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant"
    >
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary/60 via-secondary/30 to-background">
        <img
          src={optimizedImage(product.image, { width: 600 }) ?? product.image}
          srcSet={optimizedSrcSet(product.image, [300, 450, 600, 900])}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
          alt={name}
          loading="lazy"
          decoding="async"
          width={600}
          height={600}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Top badges */}
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
          <Badge variant="secondary" className="rounded-full border border-border/50 bg-background/85 px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-sm">
            {product.brand}
          </Badge>
          {stockBadge === "out" && (
            <Badge variant="destructive" className="rounded-full text-[10px]">{t("out_of_stock")}</Badge>
          )}
          {stockBadge === "low" && (
            <Badge className="rounded-full bg-warning text-[10px] text-warning-foreground">{t("low_stock")}</Badge>
          )}
          {stockBadge === "in" && (
            <Badge className="rounded-full bg-success/90 text-[10px] text-success-foreground backdrop-blur-sm">{t("in_stock")}</Badge>
          )}
        </div>
        {/* Hover arrow */}
        <div className="absolute bottom-2 end-2 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-primary-foreground opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2">
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 min-h-[2.6rem] text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
          {name}
        </h3>
        <div className="mt-auto space-y-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold text-primary">{formatIqd(product.priceIqd)}</span>
            <span className="text-[10px] font-semibold text-muted-foreground">{t("currency_iqd")}</span>
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
        <AddToCartButton product={product} size="sm" fullWidth className="mt-2 h-8 text-xs" />
      </div>
    </Link>
  );
}

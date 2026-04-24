import { Link } from "react-router-dom";
import { Product, formatIqd } from "@/data/mockData";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product }: { product: Product }) {
  const { t, lang } = useLanguage();
  const name = lang === "ar" ? product.nameAr : product.nameEn;
  const stockBadge = product.stock === 0 ? "out" : product.stock < 5 ? "low" : "in";

  return (
    <Link to={`/products/${product.id}`} className="group surface-card overflow-hidden transition-all hover:-translate-y-1 hover:shadow-elegant">
      <div className="aspect-square overflow-hidden bg-secondary/40">
        <img src={product.image} alt={name} loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="font-semibold">{product.brand}</Badge>
          {stockBadge === "out" && <Badge variant="destructive" className="text-[10px]">{t("out_of_stock")}</Badge>}
          {stockBadge === "low" && <Badge className="bg-warning text-warning-foreground text-[10px]">{t("low_stock")}</Badge>}
          {stockBadge === "in" && <Badge className="bg-success text-success-foreground text-[10px]">{t("in_stock")}</Badge>}
        </div>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-foreground group-hover:text-primary">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-primary">{formatIqd(product.priceIqd)}</span>
          <span className="text-xs text-muted-foreground">{t("currency_iqd")}</span>
        </div>
      </div>
    </Link>
  );
}

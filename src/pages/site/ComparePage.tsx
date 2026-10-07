import { unstablePriceMessage } from "@/lib/catalog";
import { Link } from "react-router-dom";
import { useSelection } from "@/catalog/SelectionContext";
import { useProducts } from "@/hooks/useProducts";
import { useProductDetails } from "@/hooks/useCommerceSettings";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthProvider";
import { applicablePrice, productName, titleSpecs } from "@/lib/catalog";
import { formatIqd } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/site/AddToCartButton";
import { Seo } from "@/components/seo/Seo";

export default function ComparePage() {
  const { compare, toggleCompare } = useSelection(); const { products, loading, error } = useProducts({ activeOnly: true });
  const { lang } = useLanguage(); const ar = lang === "ar"; const { pricingTier } = useAuth();
  const { data: details = {} } = useProductDetails();
  const selected = compare.map(id => products.find(p => p.id === id)).filter(p => !!p);
  const specKeys = [...new Set(selected.flatMap(p => Object.keys(details[p.id]?.specs ?? titleSpecs(p))))];
  const labels: Record<string, string> = ar ? {ports:"عدد المنافذ",poe:"PoE",power:"القدرة",capacity:"السعة",wifi:"Wi-Fi"} : {};
  return <div className="mx-auto max-w-7xl px-4 py-10">
    <Seo description={ar ? "خدمات أفق البصرة للمنتجات والطلبات والتوصيل" : "UFUK products, orders and delivery services"} title={ar ? "مقارنة المنتجات | أفق البصرة" : "Compare products | UFUK"} path="/compare" />
    <h1 className="text-3xl font-bold">{ar ? "مقارنة المنتجات" : "Compare products"}</h1>
    <p className="my-4 text-muted-foreground">{ar ? "اختر حتى 3 منتجات. المواصفات المستخرجة من العنوان للمساعدة الأولية؛ راجع الداتا شيت لتأكيد التوافق." : "Select up to 3 products. Title-derived values are preliminary; confirm compatibility with the datasheet."}</p>
    {!loading && !error && compare.filter(id=>!selected.some(p=>p.id===id)).map(id=><div key={id} className="mb-3 flex items-center justify-between gap-3 rounded-xl border p-3"><span>{ar ? "منتج مختار لم يعد متاحًا" : "A selected product is no longer available"}</span><Button variant="outline" onClick={()=>toggleCompare(id)}>{ar ? "إزالة من المقارنة" : "Remove from comparison"}</Button></div>)}
    {loading ? <p role="status">{ar ? "جارٍ التحميل…" : "Loading…"}</p> : error ? <p role="alert">{ar ? "تعذر تحميل المنتجات. أعد المحاولة." : "Products could not be loaded. Please retry."}</p> : !selected.length ? <Button asChild><Link to="/products">{ar ? "اختر منتجات للمقارنة" : "Choose products"}</Link></Button> : <div className="overflow-x-auto rounded-2xl border">
      <table className="w-full min-w-[600px] text-sm"><caption className="sr-only">{ar ? "مقارنة الأسعار والمواصفات والتوفر" : "Price, specifications and availability comparison"}</caption>
        <thead><tr><th className="p-4 text-start">{ar ? "المنتج" : "Product"}</th>{selected.map(p=><th key={p.id} className="min-w-48 p-4 text-start"><img src={p.image} alt="" className="mb-3 h-32 w-full object-contain" /><Link to={`/products/${p.id}`} className="text-primary underline">{productName(p,lang)}</Link><Button size="sm" variant="ghost" className="mt-2" onClick={()=>toggleCompare(p.id)}>{ar ? "إزالة" : "Remove"}</Button></th>)}</tr></thead>
        <tbody>{[{label:ar ? "العلامة" : "Brand",values:selected.map(p=>p.brand)},{label:ar ? "الموديل / SKU" : "Model / SKU",values:selected.map(p=>p.sku || "—")},{label:ar ? "السعر (د.ع)" : "Price (IQD)",values:selected.map(p=>p.priceUnstable ? unstablePriceMessage(lang) : applicablePrice(p,pricingTier)>0 ? formatIqd(applicablePrice(p,pricingTier)) : ar ? "عند الطلب" : "On request")},{label:ar ? "التوفر" : "Availability",values:selected.map(p=>p.stock>0 ? ar ? "متوفر" : "In stock" : ar ? "نافد" : "Out of stock")},...specKeys.map(key=>({label:labels[key] || key,values:selected.map(p=>(details[p.id]?.specs ?? titleSpecs(p))[key] || "—")}))].map(row=><tr key={row.label} className="border-t"><th scope="row" className="bg-muted/40 p-4 text-start">{row.label}</th>{row.values.map((v,i)=><td key={selected[i].id} className="p-4">{v}</td>)}</tr>)}
        <tr className="border-t"><th className="p-4 text-start">{ar ? "الطلب" : "Order"}</th>{selected.map(p=><td key={p.id} className="p-4"><AddToCartButton product={p} fullWidth /><Button asChild variant="outline" className="mt-2 w-full"><Link to={`/quote?product=${p.id}`}>{ar ? "عرض سعر" : "Quote"}</Link></Button></td>)}</tr></tbody>
      </table></div>}
    <Button asChild variant="outline" className="mt-6"><Link to="/products">{ar ? "العودة للمنتجات" : "Back to products"}</Link></Button>
  </div>;
}

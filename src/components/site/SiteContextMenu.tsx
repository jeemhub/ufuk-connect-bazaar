import { useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, Copy, ExternalLink, FileText, GitCompareArrows, Home, Package, Search, ShoppingCart, Wrench } from "lucide-react";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthProvider";
import { useCart } from "@/cart/CartContext";
import { useSelection } from "@/catalog/SelectionContext";
import { applicablePrice, productName } from "@/lib/catalog";
import type { Product } from "@/data/mockData";
import { toast } from "sonner";

export function SiteContextMenu({ children, product }: { children: ReactElement; product?: Product }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const navigate = useNavigate();
  const { pricingTier } = useAuth();
  const { add, setOpen, count } = useCart();
  const { compare, quote, toggleCompare, setQuoteQty } = useSelection();
  const [link, setLink] = useState<string | null>(null);
  const price = product ? applicablePrice(product, pricingTier) : 0;
  const compared = !!product && compare.includes(product.id);
  const inQuote = !!product && !!quote[product.id];
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); toast.success(ar ? "تم النسخ" : "Copied"); }
    catch { toast.error(ar ? "تعذر النسخ. جرّب من شريط العنوان." : "Could not copy. Try the address bar."); }
  };
  const productUrl = product ? new URL(`/products/${product.id}`, window.location.origin).href : null;
  return <ContextMenu dir={ar ? "rtl" : "ltr"}>
    <ContextMenuTrigger asChild onContextMenuCapture={event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      // Preserve text editing, selected text and an explicitly requested native menu.
      if (event.shiftKey || target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]') || window.getSelection()?.toString()) {
        event.stopPropagation(); return;
      }
      const href = target.closest("a[href]")?.getAttribute("href");
      if (!href) { setLink(null); return; }
      try { const url = new URL(href, window.location.href); setLink(["https:", "http:"].includes(url.protocol) ? url.href : null); }
      catch { setLink(null); }
    }}>{children}</ContextMenuTrigger>
    <ContextMenuContent className="max-h-[calc(100dvh-16px)] w-64 max-w-[calc(100vw-16px)] overflow-y-auto" aria-label={ar ? "قائمة أفق البصرة" : "Ufuk Al-Basra menu"}>
      <ContextMenuLabel className="max-w-60 truncate">{product ? productName(product, lang) : (ar ? "أفق البصرة" : "Ufuk Al-Basra")}</ContextMenuLabel>
      {product && <>
        <ContextMenuItem onSelect={() => navigate(`/products/${product.id}`)}><Package className="me-2 h-4 w-4" />{ar ? "تفاصيل المنتج" : "Product details"}</ContextMenuItem>
        <ContextMenuItem onSelect={() => window.open(productUrl!, "_blank", "noopener,noreferrer")}><ExternalLink className="me-2 h-4 w-4" />{ar ? "فتح المنتج في تبويب جديد" : "Open product in new tab"}</ContextMenuItem>
        <ContextMenuItem disabled={product.stock <= 0 || price <= 0} onSelect={() => {
          add({ id: product.id, name: productName(product, lang), image: product.image, priceIqd: price });
          toast.success(ar ? "تمت الإضافة إلى السلة" : "Added to cart");
        }}><ShoppingCart className="me-2 h-4 w-4" />{product.stock <= 0 ? (ar ? "المنتج نافد" : "Out of stock") : price <= 0 ? (ar ? "السعر عند الطلب" : "Price on request") : (ar ? "أضف للسلة" : "Add to cart")}</ContextMenuItem>
        <ContextMenuItem disabled={!compared && compare.length >= 3} onSelect={() => toggleCompare(product.id)}><GitCompareArrows className="me-2 h-4 w-4" />{compared ? (ar ? "إزالة من المقارنة" : "Remove from comparison") : compare.length >= 3 ? (ar ? "المقارنة ممتلئة (3 منتجات)" : "Comparison full (3 products)") : (ar ? "أضف للمقارنة" : "Add to comparison")}</ContextMenuItem>
        <ContextMenuItem onSelect={() => setQuoteQty(product.id, inQuote ? 0 : 1)}><FileText className="me-2 h-4 w-4" />{inQuote ? (ar ? "إزالة من عرض السعر" : "Remove from quote") : (ar ? "أضف لعرض السعر" : "Add to quote")}</ContextMenuItem>
        <ContextMenuItem onSelect={() => copy(productUrl!)}><Copy className="me-2 h-4 w-4" />{ar ? "نسخ رابط المنتج" : "Copy product link"}</ContextMenuItem>
        <ContextMenuSeparator />
      </>}
      {!product && link && <>
        <ContextMenuItem onSelect={() => window.open(link, "_blank", "noopener,noreferrer")}><ExternalLink className="me-2 h-4 w-4" />{ar ? "فتح الرابط في تبويب جديد" : "Open link in new tab"}</ContextMenuItem>
        <ContextMenuItem onSelect={() => copy(link)}><Copy className="me-2 h-4 w-4" />{ar ? "نسخ الرابط" : "Copy link"}</ContextMenuItem>
        <ContextMenuSeparator />
      </>}
      <ContextMenuItem onSelect={() => setOpen(true)}><ShoppingCart className="me-2 h-4 w-4" />{ar ? `سلة المشتريات (${count})` : `Shopping cart (${count})`}</ContextMenuItem>
      <ContextMenuItem onSelect={() => navigate("/compare")}><GitCompareArrows className="me-2 h-4 w-4" />{ar ? `مقارنة المنتجات (${compare.length})` : `Compare products (${compare.length})`}</ContextMenuItem>
      <ContextMenuItem onSelect={() => navigate("/quote")}><FileText className="me-2 h-4 w-4" />{ar ? "طلب عرض سعر" : "Request a quote"}</ContextMenuItem>
      <ContextMenuItem onSelect={() => navigate("/track-order")}><Search className="me-2 h-4 w-4" />{ar ? "تتبع الطلب" : "Track order"}</ContextMenuItem>
      <ContextMenuItem onSelect={() => navigate("/tools")}><Wrench className="me-2 h-4 w-4" />{ar ? "حاسبات الطاقة وUPS" : "Energy and UPS calculators"}</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onSelect={() => navigate("/products")}><Package className="me-2 h-4 w-4" />{ar ? "تصفح المنتجات" : "Browse products"}</ContextMenuItem>
      <ContextMenuItem onSelect={() => navigate("/")}><Home className="me-2 h-4 w-4" />{ar ? "الصفحة الرئيسية" : "Homepage"}</ContextMenuItem>
      <ContextMenuItem onSelect={() => copy(window.location.href)}><Copy className="me-2 h-4 w-4" />{ar ? "نسخ رابط الصفحة" : "Copy page link"}</ContextMenuItem>
      <ContextMenuItem onSelect={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}><ArrowUp className="me-2 h-4 w-4" />{ar ? "العودة إلى أعلى الصفحة" : "Back to top"}</ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>;
}

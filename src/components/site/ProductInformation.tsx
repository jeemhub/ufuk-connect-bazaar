import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthProvider";
import { useCommerceSettings, useProductDetails, safeHttps } from "@/hooks/useCommerceSettings";
import { supabase } from "@/integrations/supabase/client";
import { productName, descriptionBlocks, titleSpecs } from "@/lib/catalog";
import type { Product } from "@/data/mockData";
import { ProductActions } from "./ProductActions";
import { toast } from "sonner";

export function ProductInformation({ product }: { product: Product }) {
  const {lang}=useLanguage(); const ar=lang==="ar"; const {user}=useAuth(); const {settings}=useCommerceSettings();
  const {data:details={}}=useProductDetails(); const detail=details[product.id] || {};
  const specs=detail.specs ?? titleSpecs(product); const desc=ar ? product.descAr : product.descEn;
  const [busy,setBusy]=useState(false); const [subscribed,setSubscribed]=useState(false); const [quantity,setQuantity]=useState(1);
  async function subscribe() {
    if(!user) return; setBusy(true);
    try { const {error}=await supabase.rpc("subscribe_stock_alert",{p_product_id:product.id}); if(error) throw error; setSubscribed(true); toast.success(ar ? "ستصلك رسالة في حسابك عند توفر المنتج" : "You'll receive an account notification when available"); }
    catch { toast.error(ar ? "تعذر تفعيل التنبيه الآن. أعد المحاولة لاحقًا." : "Could not enable this alert. Please retry later."); } finally {setBusy(false);}
  }
  const labels: Record<string,string>=ar ? {ports:"عدد المنافذ",poe:"تغذية الشبكة",power:"القدرة",capacity:"السعة",wifi:"جيل Wi-Fi"} : {};
  return <div className="space-y-5">
    <ProductActions id={product.id} />
    <div className="rounded-2xl border bg-card p-5"><Label htmlFor="wa-qty">{ar ? "الكمية للاستفسار" : "Inquiry quantity"}</Label><Input id="wa-qty" className="mt-2 w-24" type="number" min={1} max={999} value={quantity} onChange={e=>setQuantity(Math.max(1,Math.min(999,Number(e.target.value)||1)))} /><Button asChild variant="outline" className="mt-3 w-full"><a target="_blank" rel="noopener noreferrer" href={`https://wa.me/${settings.whatsapp.replace(/\D/g,"")}?text=${encodeURIComponent(`${ar ? "أرغب بالاستفسار عن" : "Product inquiry"}: ${productName(product,lang)}\n${product.sku ? `SKU: ${product.sku}\n` : ""}${ar ? "الكمية" : "Quantity"}: ${quantity}\nhttps://ufukalbasra.com/products/${product.id}`)}`}>{ar ? "استفسر عبر واتساب" : "Ask on WhatsApp"}</a></Button></div>
    {product.stock<=0 && <section className="rounded-2xl border bg-card p-5"><h2 className="font-bold">{ar ? "تنبيه عند التوفر" : "Availability alert"}</h2><p className="my-2 text-sm text-muted-foreground">{ar ? "إشعار داخل حسابك عند عودة المنتج للمخزون." : "An account notification when this item is restocked."}</p>{user ? <Button disabled={busy || subscribed} onClick={subscribe}>{subscribed ? ar ? "تم تفعيل التنبيه" : "Alert enabled" : ar ? "أبلغني عند التوفر" : "Notify me"}</Button> : <Button asChild><Link to={`/auth?redirect=${encodeURIComponent(`/products/${product.id}`)}`}>{ar ? "سجل الدخول لتفعيل التنبيه" : "Sign in for alerts"}</Link></Button>}</section>}
    {!!Object.keys(specs).length && <section className="overflow-hidden rounded-2xl border bg-card"><h2 className="p-5 font-bold">{ar ? "المواصفات" : "Specifications"}</h2>{!detail.specs && <p className="px-5 pb-3 text-xs text-muted-foreground">{ar ? "معلومات مستخرجة من عنوان المنتج؛ راجع الداتا شيت لتأكيد التفاصيل." : "Values from the product title; confirm in the datasheet."}</p>}<table className="w-full text-sm"><tbody>{Object.entries(specs).map(([key,value])=><tr key={key} className="border-t"><th scope="row" className="p-3 text-start">{labels[key] || key}</th><td className="p-3">{value}</td></tr>)}</tbody></table></section>}
    {desc && <section className="rounded-2xl border bg-card p-5"><h2 className="mb-3 font-bold">{ar ? "الوصف والمميزات" : "Description and features"}</h2><div className="space-y-3 text-sm leading-7">{descriptionBlocks(desc).map((block,i)=><p key={i}>{block}</p>)}</div></section>}
    <section className="rounded-2xl border bg-card p-5"><h2 className="mb-3 font-bold">{ar ? "الضمان والتوصيل" : "Warranty and delivery"}</h2><p className="whitespace-pre-line text-sm leading-7">{detail.warranty || settings.warranty || (ar ? "تُؤكَّد مدة الضمان وشروطه لهذا المنتج مع المبيعات قبل الشراء." : "Confirm this product's warranty duration and terms with sales before purchase.")}</p><p className="my-3 text-sm">{settings.delivery || (ar ? "تُؤكَّد مدة وتكلفة التوصيل بحسب المحافظة وحجم الطلب." : "Delivery time and fee are confirmed based on city and order size.")}</p><Link to="/policies" className="text-sm text-primary underline">{ar ? "تفاصيل الضمان والدفع والتوصيل" : "Warranty, payment and shipping details"}</Link></section>
    <section className="rounded-2xl border bg-card p-5"><h2 className="mb-3 font-bold">{ar ? "ملفات المنتج" : "Product documents"}</h2>{safeHttps(product.datasheetUrl || "") ? <a href={product.datasheetUrl} target="_blank" rel="noopener noreferrer" className="block text-primary underline">{ar ? "تنزيل الداتا شيت" : "Download datasheet"}</a> : <Link to={`/quote?product=${product.id}`} className="text-primary underline">{ar ? "اطلب الداتا شيت من المبيعات" : "Request datasheet from sales"}</Link>}{safeHttps(detail.manualUrl || "") && <a href={detail.manualUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block text-primary underline">{ar ? "دليل الاستخدام" : "User manual"}</a>}</section>
  </div>;
}

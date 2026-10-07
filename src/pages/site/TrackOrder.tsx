import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { normalizePhone, validIraqiPhone } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Seo } from "@/components/seo/Seo";

export default function TrackOrder() {
  const { lang } = useLanguage(); const ar = lang === "ar";
  const [orderNo,setOrderNo]=useState(""); const [phone,setPhone]=useState(""); const [busy,setBusy]=useState(false);
  const [error,setError]=useState(""); const [result,setResult]=useState<{order_no:string;status:string;updated_at:string} | null>(null);
  async function track(e: React.FormEvent) {
    e.preventDefault(); setResult(null); setError("");
    if (!validIraqiPhone(phone)) { setError(ar ? "أدخل رقم هاتف عراقي صحيحًا." : "Enter a valid Iraqi phone number."); return; }
    setBusy(true);
    try { const {data,error}=await supabase.rpc("track_order",{p_order_no:orderNo.trim().toUpperCase(),p_phone:normalizePhone(phone)});
      if(error) throw error; const rows=data as unknown as {order_no:string;status:string;updated_at:string}[];
      if(!rows?.length) setError(ar ? "لم نجد طلبًا مطابقًا للرقم والهاتف." : "No order matches that number and phone."); else setResult(rows[0]);
    } catch { setError(ar ? "تعذر التتبع الآن. تواصل مع المبيعات أو أعد المحاولة لاحقًا." : "Tracking is unavailable. Contact sales or try later."); } finally { setBusy(false); }
  }
  const status: Record<string,string> = ar ? {pending:"بانتظار التأكيد",confirmed:"تم التأكيد",processing:"قيد التجهيز",shipped:"تم الشحن",delivered:"تم التسليم",completed:"مكتمل",cancelled:"ملغي"} : {};
  return <div className="mx-auto max-w-xl px-4 py-12"><Seo description={ar ? "خدمات أفق البصرة للمنتجات والطلبات والتوصيل" : "UFUK products, orders and delivery services"} title={ar ? "تتبع الطلب | أفق البصرة" : "Track order | UFUK"} path="/track-order" /><h1 className="text-3xl font-bold">{ar ? "تتبع طلبك" : "Track your order"}</h1><p className="my-4 text-muted-foreground">{ar ? "أدخل رقم الطلب ورقم الهاتف المستخدم عند الشراء. لا تحتاج إلى حساب." : "Enter your order number and checkout phone. No account required."}</p>
  <form onSubmit={track} className="surface-card space-y-4 p-6"><div><Label htmlFor="track-number">{ar ? "رقم الطلب" : "Order number"}</Label><Input id="track-number" dir="ltr" value={orderNo} onChange={e=>setOrderNo(e.target.value)} required maxLength={40} placeholder="ORD-261007-abcdef" /></div><div><Label htmlFor="track-phone">{ar ? "رقم الهاتف" : "Phone"}</Label><Input id="track-phone" type="tel" dir="ltr" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} required maxLength={20} /></div><Button disabled={busy} type="submit" className="w-full">{busy ? ar ? "جارٍ البحث…" : "Searching…" : ar ? "تتبع الطلب" : "Track"}</Button></form>
  {error && <p role="alert" className="mt-4 text-destructive">{error}</p>}{result && <section aria-live="polite" className="surface-card mt-5 space-y-3 p-6"><h2 className="font-bold" dir="ltr">{result.order_no}</h2><p>{status[result.status] || result.status}</p><p className="text-sm text-muted-foreground">{ar ? "آخر تحديث: " : "Updated: "}{new Date(result.updated_at).toLocaleString(ar ? "ar-IQ-u-nu-latn" : "en-GB",{timeZone:"Asia/Baghdad"})}</p></section>}</div>;
}

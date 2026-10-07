import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCommerceSettings, defaultCommerce, safeHttps, type CommerceSettings as Settings } from "@/hooks/useCommerceSettings";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function CommerceSettings() {
  const { settings, isLoading, isError } = useCommerceSettings(); const queryClient = useQueryClient();
  const { lang } = useLanguage(); const ar = lang === "ar";
  const [draft,setDraft]=useState<Settings>(defaultCommerce); const [busy,setBusy]=useState(false);
  const [dirty,setDirty]=useState(false);
  useEffect(()=>{if (!dirty) setDraft(settings);},[settings,dirty]);
  function update(key: keyof Settings, value: string) { setDirty(true); setDraft(s=>({...s,[key]:value})); }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if ([draft.mapUrl,draft.reviewsUrl].some(url=>url && !safeHttps(url)) || !/^\d{7,15}$/.test(draft.whatsapp) || (draft.rating && (!draft.reviewsUrl || !Number.isFinite(Number(draft.rating)) || Number(draft.rating)<0 || Number(draft.rating)>5))) {toast.error(ar ? "تحقق من الروابط ورقم واتساب والتقييم الموثق." : "Check HTTPS links, WhatsApp number and sourced rating."); return;}
    if (draft.zones.some(z=>!z.city.trim() || (z.fee!==null && (!Number.isSafeInteger(z.fee) || z.fee<0))) || new Set(draft.zones.map(z=>z.city.trim())).size!==draft.zones.length) {toast.error(ar ? "تحقق من المحافظات والتكاليف؛ لا تكرر المحافظة." : "Check unique cities and non-negative fees.");return;}
    setBusy(true);
    const {error}=await supabase.from("site_pages").upsert({key:"commerce-settings",title_ar:"إعدادات المتجر",title_en:"Commerce settings",content_ar:JSON.stringify(draft)}, {onConflict:"key"});
    setBusy(false); if(error) {toast.error(ar ? "تعذر الحفظ. تحقق من صلاحيات الإدارة." : "Save failed. Check admin access.");return;}
    setDirty(false); await queryClient.invalidateQueries({queryKey:["commerce-settings"]}); toast.success(ar ? "تم حفظ معلومات المتجر" : "Store information saved");
  }
  return <form onSubmit={save} className="surface-card space-y-5 p-5"><h2 className="text-xl font-bold">{ar ? "الضمان والتوصيل ومعلومات المحل" : "Warranty, shipping and store details"}</h2>
    <p className="text-sm text-muted-foreground">{ar ? "تظهر هذه المعلومات للزوار وفي نموذج الطلب. لا تضف شروطًا أو تقييمًا غير موثق." : "Shown to visitors and at checkout. Enter confirmed business information only."}</p>
    {isError && <p role="alert" className="text-destructive">{ar ? "تعذر تحميل الإعدادات. أعد تحميل الصفحة قبل الحفظ." : "Settings failed to load. Reload before saving."}</p>}
    <div className="grid gap-4 md:grid-cols-2">{([{key:"address",ar:"عنوان المحل",en:"Store address"},{key:"hours",ar:"ساعات العمل",en:"Opening hours"},{key:"mapUrl",ar:"رابط الخريطة HTTPS",en:"Map HTTPS URL"},{key:"reviewsUrl",ar:"رابط تقييمات العملاء",en:"Customer reviews URL"},{key:"rating",ar:"التقييم الموثق من 5 (اختياري)",en:"Sourced rating out of 5 (optional)"},{key:"whatsapp",ar:"واتساب بالرمز الدولي دون +",en:"WhatsApp international digits"}] as const).map(f=><div key={f.key}><Label htmlFor={`store-${f.key}`}>{ar ? f.ar : f.en}</Label><Input id={`store-${f.key}`} value={draft[f.key]} onChange={e=>update(f.key,e.target.value)} /></div>)}</div>
    {([{key:"warranty",ar:"مدة الضمان وشروطه",en:"Warranty duration and terms"},{key:"payments",ar:"طرق الدفع المعتمدة",en:"Accepted payment methods"},{key:"delivery",ar:"مدة التوصيل العامة",en:"Delivery time information"}] as const).map(f=><div key={f.key}><Label htmlFor={`store-${f.key}`}>{ar ? f.ar : f.en}</Label><Textarea id={`store-${f.key}`} value={draft[f.key]} onChange={e=>update(f.key,e.target.value)} /></div>)}
    <h3 className="font-bold">{ar ? "مناطق التوصيل" : "Delivery areas"}</h3>
    {draft.zones.map((z,i)=><fieldset key={i} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-4"><legend className="px-2 text-sm">{ar ? "منطقة" : "Area"} {i+1}</legend>{[{key:"city",label:ar ? "المحافظة" : "City"},{key:"fee",label:ar ? "التكلفة (فارغ = تأكيد مع المبيعات)" : "Fee (empty = confirm with sales)"},{key:"duration",label:ar ? "مدة التوصيل" : "Delivery time"}].map(f=><div key={f.key}><Label htmlFor={`zone-${i}-${f.key}`}>{f.label}</Label><Input id={`zone-${i}-${f.key}`} type={f.key==="fee" ? "number" : "text"} min={0} value={f.key==="fee" ? z.fee ?? "" : z[f.key as "city" | "duration"]} onChange={e=>{setDirty(true);setDraft(s=>({...s,zones:s.zones.map((x,j)=>j===i ? {...x,[f.key]:f.key==="fee" ? e.target.value==="" ? null : Number(e.target.value) : e.target.value} : x)}));}} /></div>)}<div className="flex items-center gap-2"><label className="text-sm"><input type="checkbox" checked={z.enabled} onChange={e=>{setDirty(true);setDraft(s=>({...s,zones:s.zones.map((x,j)=>j===i ? {...x,enabled:e.target.checked} : x)}));}} /> {ar ? "متاح" : "Enabled"}</label><Button variant="ghost" type="button" onClick={()=>{setDirty(true);setDraft(s=>({...s,zones:s.zones.filter((_,j)=>j!==i)}));}}>{ar ? "إزالة" : "Remove"}</Button></div></fieldset>)}
    <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={()=>{setDirty(true);setDraft(s=>({...s,zones:[...s.zones,{city:"",fee:null,duration:"",enabled:true}]}));}}>{ar ? "إضافة محافظة" : "Add city"}</Button><Button type="submit" disabled={busy || isLoading || isError}>{busy ? "…" : ar ? "حفظ معلومات المتجر" : "Save store details"}</Button></div>
  </form>;
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
export function GlobalPriceSettings() {
  const {lang}=useLanguage(); const ar=lang==="ar"; const client=useQueryClient();
  const key=["global-price-visibility"];
  const query=useQuery({queryKey:key,queryFn:async()=>{
    const {data,error}=await supabase.from("site_pages").select("content_ar").eq("key","global-price-visibility").single();
    if(error) throw error; return data.content_ar==="true";
  }});
  const save=useMutation({mutationFn:async(enabled:boolean)=>{
    const {data,error}=await supabase.from("site_pages").update({content_ar:String(enabled)}).eq("key","global-price-visibility").select("key").single();
    if(error || !data) throw error || new Error("Price setting update failed"); return enabled;
  },onSuccess:enabled=>{client.setQueryData(key,enabled);toast.success(ar ? "تم تحديث عرض أسعار الموقع" : "Site pricing updated");},onError:()=>toast.error(ar ? "تعذر تحديث عرض الأسعار" : "Failed to update pricing")});
  return <section className="surface-card p-5">
    <h2 className="font-semibold">{ar ? "عرض أسعار الموقع" : "Site price visibility"}</h2>
    <div className="mt-4 flex items-center justify-between gap-3">
      <Label htmlFor="global-price-unstable">{ar ? "السعر غير مستقر — كل المنتجات" : "Unstable prices — all products"}</Label>
      <div className="flex items-center gap-2" dir="ltr"><span className="text-xs font-bold">{query.data ? "ON" : "OFF"}</span><Switch id="global-price-unstable" checked={query.data ?? false} disabled={!query.isSuccess || save.isPending} onCheckedChange={enabled=>save.mutate(enabled)}/></div>
    </div>
    <p className="mt-3 text-sm leading-7 text-muted-foreground">{ar ? "ON: إخفاء جميع الأسعار للزبون والمكتب والوكيل وإظهار رسالة التواصل مع الشركة. OFF: العودة إلى إعداد كل علامة تجارية والأسعار المسموحة حسب نوع الحساب." : "ON hides all customer, office, and dealer prices and asks them to contact the company. OFF restores each brand's setting and eligible price tiers."}</p>
    {query.isError && <p role="alert" className="text-destructive">{ar ? "تعذر تحميل إعداد الأسعار." : "Failed to load price settings."}</p>}
  </section>;
}

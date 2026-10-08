import { PricingModeSettings } from "@/components/admin/PricingModeSettings";
import { PercentageSettings } from "@/components/admin/PercentageSettings";
import { useEffect, useState } from "react";
import { Calculator, Save } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useExchangeRate } from "@/features/sales-tools/useExchangeRate";
import { calculateParallelPrice, parseAmount, formatAmount } from "@/features/sales-tools/calculation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
export default function SalesTools() {
  const {lang}=useLanguage(); const ar=lang==="ar"; const {query,save}=useExchangeRate();
  const [rateInput,setRateInput]=useState(""); const [dirty,setDirty]=useState(false); const [priceInput,setPriceInput]=useState("");
  useEffect(()=>{if(!dirty && query.data) setRateInput(query.data.rate===null ? "" : String(query.data.rate));},[query.data,dirty]);
  const rate=parseAmount(rateInput); const price=parseAmount(priceInput); const validRate=rate!==null && rate>0 && rate<=100000;
  const result=calculateParallelPrice(price,rate);
  return <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
    <div><h1 className="text-2xl font-bold md:text-3xl">{ar ? "أدوات موظفين المبيعات" : "Sales employee tools"}</h1><p className="mt-1 text-sm text-muted-foreground">{ar ? "أدوات تساعدك في حساب أسعار المنتجات أثناء العمل." : "Tools for calculating product prices during work."}</p></div>
    <PricingModeSettings />
    <PercentageSettings />
    <section className="surface-card max-w-3xl p-5 md:p-6">
      <h2 className="flex items-center gap-2 text-xl font-bold"><Calculator className="h-5 w-5 text-primary"/>{ar ? "سعر صرف الموازي" : "Parallel exchange rate"}</h2>
      {query.isPending ? <p role="status" className="mt-4">{ar ? "جارٍ تحميل سعر الصرف…" : "Loading exchange rate…"}</p> : query.isError ? <div role="alert" className="mt-4"><p>{ar ? "تعذر تحميل سعر الصرف المشترك." : "Failed to load shared exchange rate."}</p><Button variant="outline" onClick={()=>query.refetch()}>{ar ? "إعادة المحاولة" : "Retry"}</Button></div> : <>
        <div className="mt-6 rounded-xl border bg-muted/30 p-4">
          <Label htmlFor="exchange-rate">{ar ? "سعر الصرف اليوم (دينار عراقي لكل 1$)" : "Today's exchange rate (IQD per $1)"}</Label>
          <div className="mt-2 flex flex-wrap gap-2"><Input id="exchange-rate" inputMode="decimal" dir="ltr" className="min-w-0 flex-1" value={rateInput} placeholder="1750" onChange={e=>{setRateInput(e.target.value);setDirty(true);}} disabled={save.isPending}/><Button className="gap-2" disabled={!dirty || !validRate || save.isPending} onClick={()=>{if(rate===null)return;save.mutate(rate,{onSuccess:()=>{setDirty(false);toast.success(ar ? "تم حفظ سعر الصرف لجميع موظفين المبيعات" : "Exchange rate saved for all sales employees");},onError:()=>toast.error(ar ? "تعذر حفظ سعر الصرف" : "Failed to save exchange rate")});}}><Save className="h-4 w-4"/>{save.isPending ? (ar ? "جارٍ الحفظ…" : "Saving…") : (ar ? "حفظ للجميع" : "Save for everyone")}</Button></div>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">{dirty ? (ar ? "معاينة محلية: اضغط «حفظ للجميع» لتطبيق سعر الصرف على باقي الموظفين." : "Local preview: save to apply this rate to all staff.") : query.data?.rate===null ? (ar ? "أدخل سعر الصرف اليوم واحفظه لبدء العمل." : "Enter and save today's exchange rate to begin.") : (ar ? "سعر مشترك بين الموظفين، يُحدَّث تلقائيًا عند تغييره." : "Shared rate, automatically refreshed when colleagues change it.")}</p>
          {rateInput && !validRate && <p role="alert" className="text-sm text-destructive">{ar ? "أدخل سعر صرف أكبر من صفر ولا يتجاوز 100,000." : "Enter a rate above zero and no more than 100,000."}</p>}
          {query.data?.updatedAt && query.data.rate!==null && <p className="mt-1 text-xs text-muted-foreground">{ar ? "آخر تحديث: " : "Updated: "}{new Intl.DateTimeFormat(ar ? "ar-IQ" : "en-GB",{dateStyle:"short",timeStyle:"short",timeZone:"Asia/Baghdad"}).format(new Date(query.data.updatedAt))}</p>}
        </div>
        <div className="mt-6"><Label htmlFor="parallel-product-price">{ar ? "سعر المنتج بالدينار العراقي (على أساس 1500)" : "Product price in IQD (at a base rate of 1500)"}</Label><Input id="parallel-product-price" className="mt-2" inputMode="decimal" dir="ltr" value={priceInput} placeholder="300000" onChange={e=>setPriceInput(e.target.value)}/></div>
        {priceInput && price===null && <p role="alert" className="mt-2 text-sm text-destructive">{ar ? "أدخل سعر منتج صحيحًا لا يقل عن صفر." : "Enter a valid non-negative product price."}</p>}
        <div aria-live="polite" aria-atomic="true" className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border p-4"><p className="text-sm text-muted-foreground">{ar ? "سعر المنتج بالدولار" : "Product price in USD"}</p><output aria-label={ar ? "السعر بالدولار" : "USD price"} dir="ltr" className="mt-2 block text-2xl font-bold">{result ? `${formatAmount(result.dollars)} $` : "—"}</output></div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4"><p className="text-sm text-muted-foreground">{ar ? "السعر بعد احتساب سعر الصرف" : "Price at the exchange rate"}</p><output aria-label={ar ? "السعر النهائي بالدينار" : "Final IQD price"} dir="ltr" className="mt-2 block text-2xl font-bold text-primary">{result ? `${formatAmount(result.dinars)} IQD` : "—"}</output></div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{ar ? "المعادلة: سعر المنتج ÷ 1500 × سعر الصرف اليوم." : "Formula: product price ÷ 1500 × today's exchange rate."}</p>
      </>}
    </section>
  </div>;
}

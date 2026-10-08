import { useEffect, useState } from "react";
import { useExchangeRate } from "@/features/sales-tools/useExchangeRate";
import { calculatePercentagePrice, formatAmount, parseAmount } from "@/features/sales-tools/calculation";
import { useLanguage } from "@/i18n/LanguageContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
export function PercentageSettings() {
  const {lang}=useLanguage(); const ar=lang==="ar"; const {query,savePercentage}=useExchangeRate();
  const [draft,setDraft]=useState(""); const [dirty,setDirty]=useState(false); const [price,setPrice]=useState(""); const [currency,setCurrency]=useState("IQD");
  useEffect(()=>{if(!dirty&&query.data)setDraft(String(query.data.percentage));},[dirty,query.data]);
  const percentage=parseAmount(draft); const valid=percentage!==null&&percentage<=100000; const result=calculatePercentagePrice(parseAmount(price),percentage);
  return <section className="surface-card max-w-3xl space-y-4 p-5 md:p-6">
    <h2 className="text-xl font-bold">{ar ? "إضافة نسبة مئوية على الأسعار" : "Percentage price increase"}</h2>
    {query.isError ? <p role="alert">{ar ? "تعذر تحميل نسبة الزيادة." : "Failed to load the percentage."}</p> : query.isPending ? <p role="status">{ar ? "جارٍ التحميل…" : "Loading…"}</p> : <>
      <div><Label htmlFor="markup-percentage">{ar ? "نسبة الزيادة (%)" : "Increase (%)"}</Label><div className="mt-2 flex flex-wrap gap-2"><Input id="markup-percentage" inputMode="decimal" dir="ltr" className="min-w-0 flex-1" value={draft} disabled={savePercentage.isPending} onChange={e=>{setDraft(e.target.value);setDirty(true);}}/><Button disabled={!dirty||!valid||savePercentage.isPending} onClick={()=>{if(percentage===null)return;savePercentage.mutate(percentage,{onSuccess:()=>{setDirty(false);toast.success(ar ? "تم حفظ نسبة الزيادة لجميع الموظفين" : "Percentage saved for all staff");},onError:()=>toast.error(ar ? "تعذر حفظ نسبة الزيادة" : "Failed to save percentage")});}}>{ar ? "حفظ نسبة الزيادة" : "Save percentage"}</Button></div></div>
      <p className="text-xs text-muted-foreground">{dirty ? (ar ? "معاينة محلية. احفظ النسبة ثم اختر «إضافة نسبة مئوية» لتطبيقها على السعر الأحمر." : "Local preview. Save, then select Percentage increase to apply it to red prices.") : (ar ? "نسبة مشتركة لجميع الموظفين. تُطبّق على المفرد والجملة والوكيل عند اعتماد النسبة المئوية." : "Shared percentage, applied to retail, wholesale and dealer tiers in percentage mode.")}</p>
      {!valid && <p role="alert" className="text-sm text-destructive">{ar ? "أدخل نسبة صحيحة من 0 إلى 100,000%." : "Enter a percentage from 0 to 100,000%."}</p>}
      <div className="flex flex-wrap gap-3"><div className="min-w-0 flex-1"><Label htmlFor="percentage-product-price">{ar ? "سعر المنتج قبل الزيادة" : "Product price before increase"}</Label><Input id="percentage-product-price" className="mt-2" inputMode="decimal" dir="ltr" value={price} onChange={e=>setPrice(e.target.value)}/></div><div><Label htmlFor="percentage-currency">{ar ? "العملة" : "Currency"}</Label><select id="percentage-currency" className="mt-2 block h-10 rounded-md border border-input bg-background px-3" value={currency} onChange={e=>setCurrency(e.target.value)}><option value="IQD">{ar ? "دينار عراقي" : "IQD"}</option><option value="USD">{ar ? "دولار" : "USD"}</option></select></div></div>
      <div className="rounded-xl border border-red-600/20 bg-red-600/5 p-4"><Label>{ar ? "السعر بعد الزيادة" : "Price after increase"}</Label><output aria-label={ar ? "السعر بعد النسبة المئوية" : "Percentage adjusted price"} aria-live="polite" dir="ltr" className="mt-2 block text-2xl font-bold text-red-600 dark:text-red-400">{result===null ? "—" : `${formatAmount(result)} ${currency==="USD" ? "$" : "IQD"}`}</output></div>
      <p className="text-sm text-muted-foreground">{ar ? "المعادلة: السعر + (السعر × النسبة ÷ 100). مثال: 100$ مع 10% تصبح 110$." : "Formula: price + (price × percentage ÷ 100). Example: $100 with 10% becomes $110."}</p>
    </>}
  </section>;
}

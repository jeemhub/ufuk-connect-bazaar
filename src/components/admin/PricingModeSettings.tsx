import { useExchangeRate } from "@/features/sales-tools/useExchangeRate";
import { formatAmount, type PricingMode } from "@/features/sales-tools/calculation";
import { useLanguage } from "@/i18n/LanguageContext";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
export function PricingModeSettings() {
  const {lang}=useLanguage(); const ar=lang==="ar"; const {query,saveMode}=useExchangeRate();
  return <section className="surface-card p-4">
    <div className="flex flex-wrap items-center gap-3">
      <Label htmlFor="sales-pricing-mode">{ar ? "طريقة حساب السعر الأحمر" : "Red price calculation"}</Label>
      <select id="sales-pricing-mode" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={query.data?.mode ?? "parallel"} disabled={!query.isSuccess||saveMode.isPending}
        onChange={e=>saveMode.mutate(e.target.value as PricingMode,{onSuccess:()=>toast.success(ar ? "تم تطبيق طريقة الحساب لجميع موظفين المبيعات" : "Pricing method updated for all sales staff"),onError:()=>toast.error(ar ? "تعذر تغيير طريقة الحساب" : "Failed to update pricing method")})}>
        <option value="parallel">{ar ? "سعر الصرف الموازي" : "Parallel exchange rate"}</option>
        <option value="percentage">{ar ? "إضافة نسبة مئوية" : "Percentage increase"}</option>
      </select>
      {saveMode.isPending && <span role="status" className="text-sm">{ar ? "جارٍ الحفظ…" : "Saving…"}</span>}
    </div>
    <p className="mt-2 text-xs leading-6 text-muted-foreground">{ar ? "إعداد مشترك بين الموظفين. حدد سعر الصرف ونسبة الزيادة من أدوات موظفين المبيعات." : "Shared staff setting. Set the exchange rate and percentage in Sales employee tools."}</p>
    {query.isSuccess && <p className="text-sm text-red-600 dark:text-red-400">{query.data.mode==="percentage" ? (ar ? `نسبة الزيادة المعتمدة: ${formatAmount(query.data.percentage)}%` : `Saved increase: ${formatAmount(query.data.percentage)}%`) : query.data.rate!==null ? (ar ? `سعر الصرف المعتمد: ${formatAmount(query.data.rate)} د.ع لكل دولار` : `Saved rate: ${formatAmount(query.data.rate)} IQD per USD`) : (ar ? "حدد سعر الصرف أولًا" : "Set the exchange rate first")}</p>}
    {query.isError && <p role="alert" className="text-sm text-destructive">{ar ? "تعذر تحميل إعدادات السعر." : "Failed to load pricing settings."}</p>}
  </section>;
}

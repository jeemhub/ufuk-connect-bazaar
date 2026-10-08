import { calculateParallelPrice, calculatePercentagePrice, formatAmount, type PricingMode } from "@/features/sales-tools/calculation";
import { useLanguage } from "@/i18n/LanguageContext";

export function ParallelPrice({price,rate,mode="parallel",percentage=null,loading=false,error=false}: {
  price:number;rate:number|null;mode?:PricingMode;percentage?:number|null;loading?:boolean;error?:boolean;
}) {
  const {lang}=useLanguage(); const ar=lang==="ar";
  if(price<=0) return null;
  const adjusted=error||loading ? null : mode==="percentage"
    ? calculatePercentagePrice(price,percentage) : calculateParallelPrice(price,rate)?.dinars ?? null;
  const formula=mode==="percentage" ? `${formatAmount(price)} + ${formatAmount(percentage ?? 0)}% = ${formatAmount(adjusted ?? 0)}`
    : `${formatAmount(price)} ÷ 1500 × ${formatAmount(rate ?? 0)} = ${formatAmount(adjusted ?? 0)}`;
  return <span className="inline-flex flex-wrap items-baseline gap-1 text-sm font-semibold text-red-600 dark:text-red-400" title={adjusted!==null ? formula : undefined}>
    <span>{mode==="percentage" ? (ar ? `زيادة ${formatAmount(percentage ?? 0)}%:` : `+${formatAmount(percentage ?? 0)}%:`) : (ar ? "الموازي:" : "Parallel:")}</span>
    {adjusted!==null ? <span dir="ltr">{formatAmount(adjusted)} {ar ? "د.ع" : "IQD"}</span>
      : <span>{loading ? (ar ? "جارٍ التحميل…" : "Loading…") : error ? (ar ? "تعذر تحميل إعدادات السعر" : "Pricing settings unavailable") : mode==="percentage" ? (ar ? "حدد نسبة الزيادة أولًا" : "Set the percentage first") : (ar ? "حدد سعر الصرف أولًا" : "Set the exchange rate first")}</span>}
  </span>;
}

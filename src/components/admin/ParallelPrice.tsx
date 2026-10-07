import { calculateParallelPrice, formatAmount } from "@/features/sales-tools/calculation";
import { useLanguage } from "@/i18n/LanguageContext";

export function ParallelPrice({ price, rate, loading = false, error = false }: {
  price: number; rate: number | null; loading?: boolean; error?: boolean;
}) {
  const { lang } = useLanguage(); const ar = lang === "ar";
  if (price <= 0) return null;
  const result = error || loading ? null : calculateParallelPrice(price, rate);
  return <span className="inline-flex flex-wrap items-baseline gap-1 text-sm font-semibold text-red-600 dark:text-red-400"
    title={result ? `${formatAmount(price)} ÷ 1500 × ${formatAmount(rate!)} = ${formatAmount(result.dinars)}` : undefined}>
    <span>{ar ? "الموازي:" : "Parallel:"}</span>
    {result ? <span dir="ltr">{formatAmount(result.dinars)} {ar ? "د.ع" : "IQD"}</span>
      : <span>{loading ? (ar ? "جارٍ التحميل…" : "Loading…") : error ? (ar ? "تعذر تحميل سعر الصرف" : "Exchange rate unavailable") : (ar ? "حدد سعر الصرف أولًا" : "Set the exchange rate first")}</span>}
  </span>;
}

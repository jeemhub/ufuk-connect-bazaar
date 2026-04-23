import { cn } from "@/lib/utils";
import { OrderStatus } from "@/data/mockData";
import { useLanguage } from "@/i18n/LanguageContext";

const styles: Record<OrderStatus, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  processing: "bg-primary/10 text-primary border-primary/30",
  shipped: "bg-primary/15 text-primary border-primary/40",
  delivered: "bg-success/15 text-success border-success/30",
  canceled: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useLanguage();
  const labelKey = `status_${status}` as const;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", styles[status])}>
      {t(labelKey)}
    </span>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  const { t } = useLanguage();
  if (stock === 0) {
    return <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/15 px-2.5 py-0.5 text-xs font-semibold text-destructive">{t("out_of_stock")}</span>;
  }
  if (stock < 5) {
    return <span className="inline-flex items-center rounded-full border border-warning/30 bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning">{t("low_stock")} · {stock}</span>;
  }
  return <span className="inline-flex items-center rounded-full border border-success/30 bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">{t("in_stock")} · {stock}</span>;
}

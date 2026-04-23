import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageContext";
import { orders as initial, formatIqd, Order, OrderStatus } from "@/data/mockData";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { toast } from "sonner";

const statuses: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "canceled"];

export default function Orders() {
  const { t } = useLanguage();
  const [list, setList] = useState<Order[]>(initial);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => list.filter((o) =>
      (filter === "all" || o.status === filter) &&
      (!search || o.id.toLowerCase().includes(search.toLowerCase()) || o.customerName.includes(search))
    ),
    [list, filter, search],
  );

  const update = (id: string, status: OrderStatus) => {
    setList((p) => p.map((o) => (o.id === id ? { ...o, status } : o)));
    toast.success(`${id} → ${t(`status_${status}` as const)}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("orders_title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("orders_subtitle")}</p>
      </div>

      <div className="surface-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input placeholder={t("order_id")} value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger><SelectValue placeholder={t("all_status")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all_status")}</SelectItem>
              {statuses.map((s) => <SelectItem key={s} value={s}>{t(`status_${s}` as const)}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-end text-sm text-muted-foreground">{filtered.length} / {list.length}</div>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">{t("order_id")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("customer")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("date")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("total")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("status")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("update_status")}</th>
                <th className="px-4 py-3 text-end font-medium">{t("invoice")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{o.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.customerName}</div>
                    <div className="text-xs text-muted-foreground">{o.customerCity}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{o.date}</td>
                  <td className="px-4 py-3 font-semibold">{formatIqd(o.totalIqd)} {t("currency_iqd")}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3">
                    <Select value={o.status} onValueChange={(v) => update(o.id, v as OrderStatus)}>
                      <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => <SelectItem key={s} value={s}>{t(`status_${s}` as const)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Button variant="ghost" size="sm" className="gap-1.5 hover:text-primary" onClick={() => toast.success(`Invoice ${o.id}`)}>
                      <FileText className="h-3.5 w-3.5" /> {t("invoice")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, Phone, MapPin, Package2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatIqd } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "canceled";
const statuses: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "canceled"];

interface OrderRow {
  id: string;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string | null;
  customer_address: string | null;
  notes: string | null;
  total_iqd: number;
  status: string;
  created_at: string;
}

interface OrderItemRow {
  id: string;
  product_name: string;
  quantity: number;
  unit_price_iqd: number;
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  processing: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  shipped: "bg-indigo-500/15 text-indigo-700 border-indigo-500/30",
  delivered: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  canceled: "bg-rose-500/15 text-rose-700 border-rose-500/30",
};

export default function Orders() {
  const { t, lang } = useLanguage();
  const ar = lang === "ar";
  const [searchParams] = useSearchParams();
  const [list, setList] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>(() => searchParams.get("status") ?? "all");
  const [search, setSearch] = useState("");

  const [openId, setOpenId] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItemRow[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => { document.title = `${t("orders_title")} · ${t("admin_panel")}`; }, [t]);

  useEffect(() => {
    const s = searchParams.get("status");
    if (s) setFilter(s);
  }, [searchParams]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_no, customer_name, customer_phone, customer_city, customer_address, notes, total_iqd, status, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setList((data ?? []) as OrderRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Realtime updates
  useEffect(() => {
    const ch = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(
    () => list.filter((o) =>
      (filter === "all" || o.status === filter) &&
      (!search ||
        o.order_no.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_phone.includes(search))
    ),
    [list, filter, search],
  );

  const update = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setList((p) => p.map((o) => (o.id === id ? { ...o, status } : o)));
    toast.success(ar ? `تم تحديث الحالة إلى ${t(`status_${status}` as const)}` : `Updated to ${t(`status_${status}` as const)}`);
  };

  const openDetails = async (id: string) => {
    setOpenId(id);
    setItemsLoading(true);
    const { data, error } = await supabase
      .from("order_items")
      .select("id, product_name, quantity, unit_price_iqd")
      .eq("order_id", id);
    if (error) toast.error(error.message);
    else setItems((data ?? []) as OrderItemRow[]);
    setItemsLoading(false);
  };

  const current = list.find((o) => o.id === openId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("orders_title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("orders_subtitle")}</p>
      </div>

      <div className="surface-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            placeholder={ar ? "بحث: رقم طلب، اسم، هاتف..." : "Search: order no, name, phone..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger><SelectValue placeholder={t("all_status")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all_status")}</SelectItem>
              {statuses.map((s) => <SelectItem key={s} value={s}>{t(`status_${s}` as const)}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-end text-sm text-muted-foreground">
            {filtered.length} / {list.length}
          </div>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">{t("order_id")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("customer")}</th>
                <th className="px-4 py-3 text-start font-medium">{ar ? "الهاتف" : "Phone"}</th>
                <th className="px-4 py-3 text-start font-medium">{t("date")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("total")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("status")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("update_status")}</th>
                <th className="px-4 py-3 text-end font-medium">{ar ? "تفاصيل" : "Details"}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">{ar ? "لا توجد طلبات" : "No orders"}</td></tr>
              ) : filtered.map((o) => (
                <tr key={o.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{o.order_no}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.customer_name}</div>
                    {o.customer_city && <div className="text-xs text-muted-foreground">{o.customer_city}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{o.customer_phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString(ar ? "ar-IQ-u-nu-latn" : "en-US")}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatIqd(o.total_iqd)} {t("currency_iqd")}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`rounded-full ${STATUS_STYLE[o.status] ?? ""}`}>
                      {t(`status_${o.status as OrderStatus}`)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={o.status} onValueChange={(v) => update(o.id, v as OrderStatus)}>
                      <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => <SelectItem key={s} value={s}>{t(`status_${s}` as const)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Button variant="ghost" size="sm" className="gap-1.5 hover:text-primary" onClick={() => openDetails(o.id)}>
                      <Eye className="h-3.5 w-3.5" /> {ar ? "عرض" : "View"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!openId} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package2 className="h-5 w-5 text-primary" />
              {ar ? "تفاصيل الطلب" : "Order details"}
              {current && <span className="font-mono text-sm text-muted-foreground">{current.order_no}</span>}
            </DialogTitle>
          </DialogHeader>
          {current && (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-bold uppercase text-muted-foreground">{ar ? "العميل" : "Customer"}</div>
                  <div className="mt-1 font-semibold">{current.customer_name}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{ar ? "الهاتف" : "Phone"}</div>
                  <a href={`tel:${current.customer_phone}`} className="mt-1 block font-mono text-sm font-semibold text-primary hover:underline">{current.customer_phone}</a>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{ar ? "العنوان" : "Address"}</div>
                  <div className="mt-1 text-sm">
                    {current.customer_city ? <span className="font-semibold">{current.customer_city}، </span> : null}
                    {current.customer_address || <span className="text-muted-foreground">—</span>}
                  </div>
                </div>
                {current.notes && (
                  <div className="sm:col-span-2">
                    <div className="text-xs font-bold uppercase text-muted-foreground">{ar ? "ملاحظات" : "Notes"}</div>
                    <div className="mt-1 text-sm whitespace-pre-wrap">{current.notes}</div>
                  </div>
                )}
              </div>

              <div>
                <div className="mb-2 text-xs font-bold uppercase text-muted-foreground">{ar ? "المنتجات" : "Items"}</div>
                {itemsLoading ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-start">{ar ? "المنتج" : "Product"}</th>
                          <th className="px-3 py-2 text-center">{ar ? "الكمية" : "Qty"}</th>
                          <th className="px-3 py-2 text-end">{ar ? "السعر" : "Unit"}</th>
                          <th className="px-3 py-2 text-end">{ar ? "المجموع" : "Subtotal"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it) => (
                          <tr key={it.id} className="border-t border-border">
                            <td className="px-3 py-2">{it.product_name}</td>
                            <td className="px-3 py-2 text-center font-bold">{it.quantity}</td>
                            <td className="px-3 py-2 text-end">{formatIqd(it.unit_price_iqd)}</td>
                            <td className="px-3 py-2 text-end font-semibold">{formatIqd(it.unit_price_iqd * it.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-border bg-muted/30">
                          <td colSpan={3} className="px-3 py-2 text-end font-bold">{ar ? "الإجمالي" : "Total"}</td>
                          <td className="px-3 py-2 text-end font-extrabold text-primary">{formatIqd(current.total_iqd)} {t("currency_iqd")}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

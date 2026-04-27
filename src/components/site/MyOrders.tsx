import { useEffect, useState } from "react";
import { Loader2, Package, FileDown, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIqd } from "@/data/mockData";
import { generateInvoicePdf } from "@/lib/invoice";
import { toast } from "sonner";

interface OrderRow {
  id: string;
  order_no: string;
  status: string;
  total_iqd: number;
  customer_name: string;
  customer_phone: string;
  customer_city: string | null;
  customer_address: string | null;
  notes: string | null;
  created_at: string;
}

interface OrderItemRow {
  id: string;
  product_name: string;
  quantity: number;
  unit_price_iqd: number;
}

const STATUS_META: Record<
  string,
  { ar: string; en: string; className: string }
> = {
  pending:    { ar: "معلّق",         en: "Pending",    className: "bg-amber-500/15 text-amber-700 border-amber-500/40" },
  processing: { ar: "قيد المعالجة",  en: "Processing", className: "bg-blue-500/15 text-blue-700 border-blue-500/40" },
  shipped:    { ar: "قيد التوصيل",   en: "Shipped",    className: "bg-indigo-500/15 text-indigo-700 border-indigo-500/40" },
  delivered:  { ar: "تم التوصيل",    en: "Delivered",  className: "bg-green-500/15 text-green-700 border-green-500/40" },
  cancelled:  { ar: "ملغي",          en: "Cancelled",  className: "bg-red-500/15 text-red-700 border-red-500/40" },
};

export function MyOrders() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, OrderItemRow[]>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_no, status, total_iqd, customer_name, customer_phone, customer_city, customer_address, notes, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) setOrders(data as OrderRow[]);
      setLoading(false);
    })();

    // Realtime status updates for this user's orders
    const ch = supabase
      .channel(`my-orders-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as OrderRow;
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user]);

  async function toggleExpand(orderId: string) {
    if (expanded === orderId) {
      setExpanded(null);
      return;
    }
    setExpanded(orderId);
    if (!itemsByOrder[orderId]) {
      const { data } = await supabase
        .from("order_items")
        .select("id, product_name, quantity, unit_price_iqd")
        .eq("order_id", orderId);
      setItemsByOrder((prev) => ({ ...prev, [orderId]: (data ?? []) as OrderItemRow[] }));
    }
  }

  async function downloadInvoice(order: OrderRow) {
    try {
      let items = itemsByOrder[order.id];
      if (!items) {
        const { data } = await supabase
          .from("order_items")
          .select("id, product_name, quantity, unit_price_iqd")
          .eq("order_id", order.id);
        items = (data ?? []) as OrderItemRow[];
        setItemsByOrder((prev) => ({ ...prev, [order.id]: items }));
      }
      await generateInvoicePdf({
        orderNo: order.order_no,
        createdAt: new Date(order.created_at),
        customerName: order.customer_name,
        customerPhone: order.customer_phone,
        customerCity: order.customer_city,
        customerAddress: order.customer_address,
        notes: order.notes,
        items: items.map((i) => ({
          name: i.product_name,
          quantity: i.quantity,
          unitPriceIqd: i.unit_price_iqd,
        })),
        totalIqd: order.total_iqd,
      });
    } catch (e) {
      toast.error(ar ? "تعذّر إنشاء الفاتورة" : "Failed to generate invoice");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {ar ? "طلباتي" : "My orders"}
        </CardTitle>
        <CardDescription>
          {ar ? "تابع حالة طلباتك الحالية والسابقة وقم بتنزيل الفواتير." : "Track current and past orders and download invoices."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{ar ? "لا توجد طلبات بعد" : "No orders yet"}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => {
              const meta = STATUS_META[o.status] ?? STATUS_META.pending;
              const isOpen = expanded === o.id;
              const its = itemsByOrder[o.id];
              return (
                <li key={o.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-bold">{o.order_no}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString(ar ? "ar-IQ" : "en-US")}
                      </span>
                    </div>
                    <Badge variant="outline" className={`border font-semibold ${meta.className}`}>
                      {ar ? meta.ar : meta.en}
                    </Badge>
                    <div className="text-sm font-extrabold text-primary">
                      {formatIqd(o.total_iqd)} <span className="text-xs">{ar ? "د.ع" : "IQD"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => downloadInvoice(o)}>
                        <FileDown className="h-4 w-4" />
                        {ar ? "PDF" : "PDF"}
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1" onClick={() => toggleExpand(o.id)}>
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {ar ? "تفاصيل" : "Details"}
                      </Button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="border-t border-border bg-muted/30 px-4 py-3">
                      {!its ? (
                        <div className="flex justify-center py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <>
                          <ul className="space-y-1 text-sm">
                            {its.map((it) => (
                              <li key={it.id} className="flex justify-between gap-2">
                                <span className="line-clamp-1">{it.product_name} × {it.quantity}</span>
                                <span className="font-semibold">{formatIqd(it.unit_price_iqd * it.quantity)}</span>
                              </li>
                            ))}
                          </ul>
                          {(o.customer_address || o.customer_city) && (
                            <div className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
                              <div>{ar ? "التوصيل" : "Delivery"}: {[o.customer_city, o.customer_address].filter(Boolean).join(" — ")}</div>
                              {o.notes && <div className="mt-1">{ar ? "ملاحظات" : "Notes"}: {o.notes}</div>}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

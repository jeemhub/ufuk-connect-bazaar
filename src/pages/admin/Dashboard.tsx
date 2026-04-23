import { ArrowUpRight, DollarSign, Users, ShoppingBag, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatIqd, orders, products, salesSeries } from "@/data/mockData";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Dashboard() {
  const { t, lang } = useLanguage();

  const totalRevenue = orders.reduce((s, o) => s + o.totalIqd, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "processing").length;
  const lowStock = products.filter((p) => p.stock < 5).length;

  const stats = [
    { label: t("stat_revenue"), value: `${formatIqd(totalRevenue)} ${t("currency_iqd")}`, change: "+12.4%", icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { label: t("stat_visitors"), value: "1,284", change: "+8.1%", icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: t("stat_pending"), value: String(pendingOrders), change: "+3", icon: ShoppingBag, color: "text-warning", bg: "bg-warning/10" },
    { label: t("stat_low_stock"), value: String(lowStock), change: "!", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  ];

  const chartData = salesSeries.map((s) => ({ name: lang === "ar" ? s.day : s.en, value: s.value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("dashboard_title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("dashboard_subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-tile">
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-success">
                {s.change} <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-2xl font-bold">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-semibold">{t("sales_overview")}</h2>
              <p className="text-xs text-muted-foreground">{t("last_7_days")}</p>
            </div>
            <div className="text-end">
              <div className="text-xs text-muted-foreground">{t("currency_iqd")}</div>
              <div className="text-lg font-bold text-primary">+24.6%</div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v}M ${t("currency_iqd")}`, t("stat_revenue")]}
                />
                <Bar dataKey="value" fill="url(#bg)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">{t("top_products")}</h2>
          </div>
          <ul className="space-y-3">
            {products.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center gap-3">
                <img src={p.image} alt="" className="h-10 w-10 rounded-md border border-border object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{lang === "ar" ? p.nameAr : p.nameEn}</div>
                  <div className="text-xs text-muted-foreground">{p.brand}</div>
                </div>
                <div className="text-end text-sm font-semibold text-primary">{formatIqd(p.priceIqd)}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="surface-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">{t("recent_orders")}</h2>
          <a href="/admin/orders" className="text-xs font-semibold text-primary hover:underline">{t("view_all")}</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 text-start font-medium">{t("order_id")}</th>
                <th className="py-2 text-start font-medium">{t("customer")}</th>
                <th className="py-2 text-start font-medium">{t("date")}</th>
                <th className="py-2 text-start font-medium">{t("total")}</th>
                <th className="py-2 text-start font-medium">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/40">
                  <td className="py-3 font-mono text-xs font-semibold">{o.id}</td>
                  <td className="py-3">{o.customerName}</td>
                  <td className="py-3 text-muted-foreground">{o.date}</td>
                  <td className="py-3 font-semibold">{formatIqd(o.totalIqd)} {t("currency_iqd")}</td>
                  <td className="py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">{t("backend_note")}</p>
    </div>
  );
}

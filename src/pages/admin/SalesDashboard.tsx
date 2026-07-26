import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, FolderTree, Award, Newspaper, Hammer, ShoppingCart, MessageSquareQuote, ArrowUpRight, Headset, FileWarning } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth, type SalesPermissions } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

type TileDef = {
  key?: string;
  perm: keyof SalesPermissions;
  to: string;
  icon: typeof Package;
  label: string;
  hideInPerms?: boolean;
  fetcher?: () => Promise<{ value: string; sub?: string }>;
};


export default function SalesDashboard() {
  const { t, lang } = useLanguage();
  const { fullName, salesPerms } = useAuth();
  const [stats, setStats] = useState<Record<string, { value: string; sub?: string }>>({});

  const fmt = (n: number) => n.toLocaleString(lang === "ar" ? "ar-EG-u-nu-latn" : "en-US");

  const tiles: TileDef[] = [
    {
      perm: "can_manage_products",
      to: "/admin/products",
      icon: Package,
      label: lang === "ar" ? "المنتجات" : "Products",
      fetcher: async () => {
        const { count } = await supabase.from("products").select("id", { count: "exact", head: true });
        const { count: low } = await supabase.from("products").select("id", { count: "exact", head: true }).lt("stock", 5);
        return { value: fmt(count ?? 0), sub: `${fmt(low ?? 0)} ${lang === "ar" ? "مخزون منخفض" : "low stock"}` };
      },
    },
    {

      key: "incomplete_products",
      perm: "can_manage_products",
      to: "/admin/products?filter=incomplete",
      icon: FileWarning,
      label: lang === "ar" ? "منتجات غير مكتملة" : "Incomplete Products",
      hideInPerms: true,
      fetcher: async () => {
        const { count } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .or("name_ar.is.null,name_ar.eq.,name_en.is.null,name_en.eq.");
        return { value: fmt(count ?? 0), sub: lang === "ar" ? "بدون اسم" : "missing name" };
      },
    },
    {
      perm: "can_manage_orders",

      icon: ShoppingCart,
      label: lang === "ar" ? "الطلبات" : "Orders",
      fetcher: async () => {
        const { count } = await supabase.from("orders").select("id", { count: "exact", head: true });
        const { count: pending } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending");
        return { value: fmt(count ?? 0), sub: `${fmt(pending ?? 0)} ${lang === "ar" ? "قيد الانتظار" : "pending"}` };
      },
    },
    {
      perm: "can_manage_quotes",
      to: "/admin/quotes",
      icon: MessageSquareQuote,
      label: lang === "ar" ? "طلبات الأسعار" : "Quotes",
      fetcher: async () => {
        const { count } = await supabase.from("quote_requests").select("id", { count: "exact", head: true });
        const { count: nw } = await supabase.from("quote_requests").select("id", { count: "exact", head: true }).eq("status", "new");
        return { value: fmt(count ?? 0), sub: `${fmt(nw ?? 0)} ${lang === "ar" ? "جديد" : "new"}` };
      },
    },
    {
      perm: "can_manage_blog",
      to: "/admin/blog",
      icon: Newspaper,
      label: lang === "ar" ? "المدونة" : "Blog",
      fetcher: async () => {
        const { count } = await supabase.from("blog_posts").select("id", { count: "exact", head: true });
        const { count: pub } = await supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published");
        return { value: fmt(count ?? 0), sub: `${fmt(pub ?? 0)} ${lang === "ar" ? "منشور" : "published"}` };
      },
    },
    {
      perm: "can_manage_projects",
      to: "/admin/projects",
      icon: Hammer,
      label: lang === "ar" ? "المشاريع" : "Projects",
      fetcher: async () => {
        const { count } = await supabase.from("projects").select("id", { count: "exact", head: true });
        return { value: fmt(count ?? 0) };
      },
    },
    {
      perm: "can_manage_categories",
      to: "/admin/categories",
      icon: FolderTree,
      label: lang === "ar" ? "الفئات" : "Categories",
      fetcher: async () => {
        const { count } = await supabase.from("categories").select("id", { count: "exact", head: true });
        return { value: fmt(count ?? 0) };
      },
    },
    {
      perm: "can_manage_brands",
      to: "/admin/brands",
      icon: Award,
      label: lang === "ar" ? "البراندات" : "Brands",
      fetcher: async () => {
        const { count } = await supabase.from("brands").select("id", { count: "exact", head: true });
        return { value: fmt(count ?? 0) };
      },
    },
  ];

  const allowed = tiles.filter((tile) => salesPerms[tile.perm]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const out: Record<string, { value: string; sub?: string }> = {};
      await Promise.all(
        allowed.map(async (tile) => {
          if (!tile.fetcher) return;
          try {
            out[tile.perm] = await tile.fetcher();
          } catch {
            out[tile.perm] = { value: "—" };
          }
        }),
      );
      if (mounted) setStats(out);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesPerms]);

  return (
    <div className="space-y-6">
      <div className="surface-card relative overflow-hidden p-6">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "linear-gradient(135deg, hsl(275 85% 65% / 0.18), hsl(255 75% 45% / 0.05) 60%, transparent)",
          }}
        />
        <div className="relative flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, hsl(275 85% 65%), hsl(255 75% 45%))" }}
          >
            <Headset className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">
              {lang === "ar" ? `أهلاً ${fullName ?? "موظف المبيعات"}` : `Welcome ${fullName ?? "Sales Agent"}`}
            </h1>
            <p className="text-xs text-muted-foreground md:text-sm">
              {lang === "ar"
                ? "هذه لوحة التحكم الخاصة بك. الأقسام التي تظهر هنا تعتمد على الصلاحيات التي منحك إياها المسؤول."
                : "This is your dashboard. The sections shown here depend on the permissions assigned by the admin."}
            </p>
          </div>
        </div>
      </div>

      {allowed.length === 0 ? (
        <div className="surface-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {lang === "ar"
              ? "لم يتم منحك أي صلاحيات بعد. تواصل مع المسؤول لتفعيل الأقسام التي تحتاج إدارتها."
              : "You have no permissions yet. Contact the admin to enable the sections you need."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {allowed.map((tile) => {
            const stat = stats[tile.perm];
            const Icon = tile.icon;
            return (
              <Link
                key={tile.perm}
                to={tile.to}
                className="stat-tile group block transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elegant"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-lg text-white"
                    style={{ background: "linear-gradient(135deg, hsl(275 85% 65%), hsl(255 75% 45%))" }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <div className="mt-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{tile.label}</div>
                  <div className="mt-1 text-2xl font-bold">{stat?.value ?? "…"}</div>
                  {stat?.sub && <div className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</div>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="surface-card p-5">
        <h2 className="mb-3 text-sm font-semibold">
          {lang === "ar" ? "صلاحياتك الحالية" : "Your current permissions"}
        </h2>
        <div className="flex flex-wrap gap-2">
          {tiles.map((tile) => {
            const enabled = salesPerms[tile.perm];
            return (
              <span
                key={tile.perm}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                style={
                  enabled
                    ? {
                        background: "hsl(265 80% 55% / 0.12)",
                        borderColor: "hsl(265 80% 55% / 0.4)",
                        color: "hsl(265 70% 40%)",
                      }
                    : {
                        background: "hsl(var(--muted))",
                        borderColor: "hsl(var(--border))",
                        color: "hsl(var(--muted-foreground))",
                      }
                }
              >
                <tile.icon className="h-3 w-3" />
                {tile.label}
                {!enabled && <span className="opacity-60">— {lang === "ar" ? "مغلق" : "off"}</span>}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

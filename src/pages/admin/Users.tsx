import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck, Store, Briefcase, User as UserIcon, History, BadgeCheck, Ban, Trash2, ShieldOff, Headset, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SalesPerms = {
  can_manage_products?: boolean;
  can_manage_categories?: boolean;
  can_manage_brands?: boolean;
  can_manage_blog?: boolean;
  can_manage_projects?: boolean;
  can_manage_orders?: boolean;
  can_manage_quotes?: boolean;
};

type Row = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  roles: string[];
  quote_count: number;
  is_verified: boolean;
  is_blocked?: boolean;
  sales_perms?: SalesPerms;
};

type QuoteRow = {
  id: string;
  product_name: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

const PRICING_ROLES = ["customer", "wholesale", "dealer"] as const;
type PricingRole = (typeof PRICING_ROLES)[number];

function pricingRole(roles: string[]): PricingRole {
  if (roles.includes("dealer")) return "dealer";
  if (roles.includes("wholesale")) return "wholesale";
  return "customer";
}

export default function Users() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [historyUser, setHistoryUser] = useState<Row | null>(null);
  const [history, setHistory] = useState<QuoteRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);
  const [salesUser, setSalesUser] = useState<Row | null>(null);
  const [salesEnabled, setSalesEnabled] = useState(false);
  const [salesPermsForm, setSalesPermsForm] = useState<SalesPerms>({});
  const [savingSales, setSavingSales] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data, error }, { data: blocks }] = await Promise.all([
      supabase.rpc("admin_list_users"),
      supabase.from("profiles").select("id, is_blocked" as "*"),
    ]);
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const blockMap = new Map<string, boolean>(
      ((blocks as unknown as Array<{ id: string; is_blocked: boolean }>) ?? []).map((b) => [b.id, !!b.is_blocked]),
    );
    setRows(((data as Row[]) ?? []).map((r) => ({ ...r, is_blocked: blockMap.get(r.id) ?? false })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function setRole(userId: string, role: PricingRole) {
    setUpdating(userId);
    const { error } = await supabase.rpc("admin_set_pricing_role", { _user_id: userId, _role: role });
    setUpdating(null);
    if (error) { toast.error(error.message); return; }
    toast.success(t("users_role_updated"));
    load();
  }

  async function toggleVerified(userId: string, current: boolean) {
    setUpdating(userId);
    const { error } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>)("admin_set_verified", {
      _user_id: userId,
      _verified: !current,
    });
    setUpdating(null);
    if (error) { toast.error(error.message); return; }
    toast.success(!current ? t("users_verified_on") : t("users_verified_off"));
    setRows((rs) => rs.map((r) => (r.id === userId ? { ...r, is_verified: !current } : r)));
  }

  async function toggleBlocked(userId: string, current: boolean) {
    setUpdating(userId);
    const { error } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>)("admin_set_blocked", {
      _user_id: userId,
      _blocked: !current,
    });
    setUpdating(null);
    if (error) { toast.error(error.message); return; }
    toast.success(!current ? "تم حظر المستخدم" : "تم فك الحظر");
    setRows((rs) => rs.map((r) => (r.id === userId ? { ...r, is_blocked: !current, is_verified: !current ? false : r.is_verified } : r)));
  }

  async function deleteUser(u: Row) {
    setUpdating(u.id);
    const { error } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>)("admin_delete_user", { _user_id: u.id });
    setUpdating(null);
    setConfirmDelete(null);
    if (error) { toast.error(error.message); return; }
    toast.success("تم حذف الحساب");
    setRows((rs) => rs.filter((r) => r.id !== u.id));
  }

  async function openHistory(u: Row) {
    setHistoryUser(u);
    setHistoryLoading(true);
    const { data } = await supabase
      .from("quote_requests")
      .select("id,product_name,message,status,created_at")
      .eq("email", u.email)
      .order("created_at", { ascending: false });
    setHistory((data as QuoteRow[]) ?? []);
    setHistoryLoading(false);
  }

  function openSales(u: Row) {
    setSalesUser(u);
    setSalesEnabled(u.roles.includes("sales"));
    setSalesPermsForm(u.sales_perms ?? {});
  }

  async function saveSales() {
    if (!salesUser) return;
    setSavingSales(true);
    const { error } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ error: { message: string } | null }>)("admin_set_sales_permissions", {
      _user_id: salesUser.id,
      _is_sales: salesEnabled,
      _can_manage_products: !!salesPermsForm.can_manage_products,
      _can_manage_categories: !!salesPermsForm.can_manage_categories,
      _can_manage_brands: !!salesPermsForm.can_manage_brands,
      _can_manage_blog: !!salesPermsForm.can_manage_blog,
      _can_manage_projects: !!salesPermsForm.can_manage_projects,
      _can_manage_orders: !!salesPermsForm.can_manage_orders,
      _can_manage_quotes: !!salesPermsForm.can_manage_quotes,
    });
    setSavingSales(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم حفظ صلاحيات المبيعات");
    setSalesUser(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("users_title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("users_subtitle")}</p>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">{t("customer_name")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("email")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("phone")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("users_role")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("users_pricing_tier")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("orders_count")}</th>
                <th className="px-4 py-3 text-end font-medium">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">{t("users_empty")}</td></tr>
              )}
              {!loading && rows.map((u) => {
                const tier = pricingRole(u.roles);
                const isAdmin = u.roles.includes("admin");
                return (
                  <tr key={u.id} className="border-t border-border align-middle hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-xs font-bold text-primary-foreground">
                          {(u.full_name || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex items-center gap-1 font-medium">
                          {u.full_name || "—"}
                          {u.is_verified && (
                            <BadgeCheck className="h-4 w-4" style={{ color: "hsl(210 100% 50%)", fill: "hsl(210 100% 50%)", stroke: "hsl(0 0% 100%)" }} />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 font-mono text-xs">{u.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {isAdmin ? (
                          <Badge className="gap-1 bg-primary"><ShieldCheck className="h-3 w-3" /> Admin</Badge>
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                        {u.roles.includes("sales") && (
                          <Badge className="gap-1" style={{ backgroundColor: "hsl(265 80% 55%)", color: "white" }}>
                            <Headset className="h-3 w-3" /> مبيعات
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(["customer", "wholesale", "dealer"] as const).map((r) => {
                          const Icon = r === "dealer" ? Briefcase : r === "wholesale" ? Store : UserIcon;
                          const active = tier === r;
                          return (
                            <Button
                              key={r}
                              size="sm"
                              variant={active ? "default" : "outline"}
                              disabled={updating === u.id || isAdmin}
                              onClick={() => setRole(u.id, r)}
                              className={active ? "bg-gradient-brand" : ""}
                            >
                              <Icon className="me-1 h-3 w-3" />
                              {t(`users_tier_${r}` as never)}
                            </Button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{u.quote_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <Button
                          variant={u.is_verified ? "default" : "outline"}
                          size="sm"
                          className="gap-1"
                          disabled={updating === u.id || u.is_blocked}
                          onClick={() => toggleVerified(u.id, u.is_verified)}
                          style={u.is_verified ? { backgroundColor: "hsl(210 100% 50%)", color: "white" } : undefined}
                        >
                          <BadgeCheck className="h-4 w-4" />
                          {u.is_verified ? t("users_verified") : t("users_verify")}
                        </Button>
                        {u.is_blocked && (
                          <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" />محظور</Badge>
                        )}
                        {!isAdmin && (
                          <Button
                            variant={u.is_blocked ? "outline" : "destructive"}
                            size="sm"
                            className="gap-1"
                            disabled={updating === u.id}
                            onClick={() => toggleBlocked(u.id, !!u.is_blocked)}
                          >
                            {u.is_blocked ? <ShieldOff className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                            {u.is_blocked ? "فك الحظر" : "حظر"}
                          </Button>
                        )}
                        {!isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-destructive hover:text-destructive"
                            disabled={updating === u.id}
                            onClick={() => setConfirmDelete(u)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {!isAdmin && (
                          <Button
                            variant={u.roles.includes("sales") ? "default" : "outline"}
                            size="sm"
                            className="gap-1"
                            onClick={() => openSales(u)}
                            style={u.roles.includes("sales") ? { backgroundColor: "hsl(265 80% 55%)", color: "white" } : undefined}
                          >
                            <Headset className="h-4 w-4" /> صلاحيات مبيعات
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="gap-1" onClick={() => openHistory(u)}>
                          <History className="h-4 w-4" /> {t("users_view_history")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!historyUser} onOpenChange={(o) => !o && setHistoryUser(null)}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("users_history_for")} {historyUser?.full_name || historyUser?.email}
            </DialogTitle>
          </DialogHeader>
          {historyLoading ? (
            <div className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>
          ) : history.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">{t("users_history_empty")}</div>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold">{h.product_name || t("quote_general")}</div>
                    <Badge variant="outline" className="text-[10px]">{h.status}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</div>
                  {h.message && <div className="mt-2 whitespace-pre-wrap text-foreground/80">{h.message}</div>}
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الحساب نهائياً؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف حساب {confirmDelete?.full_name || confirmDelete?.email} وكافة بياناته بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDelete && deleteUser(confirmDelete)}
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!salesUser} onOpenChange={(o) => !o && setSalesUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headset className="h-5 w-5" style={{ color: "hsl(265 80% 55%)" }} />
              صلاحيات موظف المبيعات
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-border p-3 text-sm">
              <div className="font-semibold">{salesUser?.full_name || "—"}</div>
              <div className="text-xs text-muted-foreground">{salesUser?.email}</div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="text-sm font-semibold">تفعيل دور المبيعات</Label>
                <p className="text-xs text-muted-foreground">يصبح بإمكان المستخدم الدخول إلى لوحة التحكم</p>
              </div>
              <Switch checked={salesEnabled} onCheckedChange={setSalesEnabled} />
            </div>

            <div className={`space-y-2 rounded-lg border border-border p-3 transition-opacity ${salesEnabled ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
              <div className="mb-2 text-xs font-semibold text-muted-foreground">الأقسام المسموح بها</div>
              {([
                ["can_manage_products", "إدارة المنتجات والأسعار"],
                ["can_manage_categories", "إدارة الفئات"],
                ["can_manage_brands", "إدارة البراندات"],
                ["can_manage_blog", "إدارة المدونة"],
                ["can_manage_projects", "إدارة المشاريع"],
                ["can_manage_orders", "إدارة الطلبات"],
                ["can_manage_quotes", "إدارة طلبات عروض الأسعار"],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-secondary/50">
                  <Checkbox
                    checked={!!salesPermsForm[key]}
                    onCheckedChange={(v) => setSalesPermsForm((p) => ({ ...p, [key]: !!v }))}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSalesUser(null)} disabled={savingSales}>
              إلغاء
            </Button>
            <Button onClick={saveSales} disabled={savingSales} className="bg-gradient-brand">
              {savingSales && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              حفظ الصلاحيات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

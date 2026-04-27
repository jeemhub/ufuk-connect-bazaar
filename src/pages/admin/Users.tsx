import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Store, Briefcase, User as UserIcon, History, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Row = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  roles: string[];
  quote_count: number;
  is_verified: boolean;
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

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_users");
    if (error) toast.error(error.message);
    else setRows((data as Row[]) ?? []);
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
    // RPC type isn't in generated types yet — cast to unknown.
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
                        <div className="font-medium">{u.full_name || "—"}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 font-mono text-xs">{u.phone || "—"}</td>
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <Badge className="gap-1 bg-primary"><ShieldCheck className="h-3 w-3" /> Admin</Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
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
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant={u.is_verified ? "default" : "outline"}
                          size="sm"
                          className="gap-1"
                          disabled={updating === u.id}
                          onClick={() => toggleVerified(u.id, u.is_verified)}
                          style={u.is_verified ? { backgroundColor: "hsl(210 100% 50%)", color: "white" } : undefined}
                        >
                          <BadgeCheck className="h-4 w-4" />
                          {u.is_verified ? t("users_verified") : t("users_verify")}
                        </Button>
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
    </div>
  );
}

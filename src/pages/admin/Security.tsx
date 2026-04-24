import { useEffect, useState } from "react";
import { z } from "zod";
import { Loader2, KeyRound, ShieldCheck, History, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LoginRow {
  id: string;
  event: string;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const passwordSchema = z.object({
  newPass: z.string().min(8).max(72),
  confirm: z.string(),
}).refine((d) => d.newPass === d.confirm, { path: ["confirm"], message: "mismatch" });

export default function Security() {
  const { t, lang } = useLanguage();
  const { user, session, signOut } = useAuth();
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<LoginRow[]>([]);

  useEffect(() => { document.title = `${t("security_title")} · ${t("brand")}`; }, [t]);

  useEffect(() => {
    if (!user) return;
    supabase.from("login_activity").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setHistory((data as LoginRow[]) || []));
  }, [user]);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    const parsed = passwordSchema.safeParse({ newPass, confirm });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      toast.error(issue?.path.includes("confirm") ? t("auth_password_mismatch") : t("auth_password_short"));
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("sec_password_updated"));
    setNewPass(""); setConfirm("");
  }

  const sessionStarted = session?.user?.last_sign_in_at
    ? new Date(session.user.last_sign_in_at).toLocaleString(lang === "ar" ? "ar-IQ" : "en-US")
    : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{t("security_title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("security_subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Change password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" />{t("sec_change_password")}</CardTitle>
            <CardDescription>{t("auth_password_short")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <Label>{t("sec_new_password")}</Label>
                <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} minLength={8} maxLength={72} required autoComplete="new-password" />
              </div>
              <div>
                <Label>{t("sec_confirm_password")}</Label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} maxLength={72} required autoComplete="new-password" />
              </div>
              <Button type="submit" disabled={busy} className="bg-gradient-brand">
                {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("sec_update")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Active session */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />{t("sec_active_session")}</CardTitle>
            <CardDescription>{t("sec_session_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
              <div className="text-muted-foreground">{t("sec_signed_in_as")}</div>
              <div className="font-semibold">{user?.email}</div>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
              <div className="text-muted-foreground">{t("sec_session_started")}</div>
              <div className="font-semibold">{sessionStarted}</div>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
              <div className="text-muted-foreground">{t("sec_device")}</div>
              <div className="truncate font-mono text-xs">{navigator.userAgent}</div>
            </div>
            <Button variant="destructive" onClick={() => signOut()} className="gap-2">
              <LogOut className="h-4 w-4" /> {t("sec_logout_all")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Login history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" />{t("sec_login_history")}</CardTitle>
          <CardDescription>{t("sec_history_desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{t("sec_no_history")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-start text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 text-start">{t("sec_event")}</th>
                    <th className="py-2 text-start">{t("status")}</th>
                    <th className="py-2 text-start">{t("sec_when")}</th>
                    <th className="py-2 text-start">{t("sec_device")}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id} className="border-b border-border/50">
                      <td className="py-3 font-medium">
                        {h.event === "login" ? t("sec_event_login") : h.event === "logout" ? t("sec_event_logout") : h.event}
                      </td>
                      <td className="py-3">
                        {h.success ? <Badge className="bg-success text-success-foreground">OK</Badge> : <Badge variant="destructive">{t("sec_event_failed")}</Badge>}
                      </td>
                      <td className="py-3 text-muted-foreground">{new Date(h.created_at).toLocaleString(lang === "ar" ? "ar-IQ" : "en-US")}</td>
                      <td className="py-3 max-w-[300px] truncate font-mono text-xs text-muted-foreground">{h.user_agent || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

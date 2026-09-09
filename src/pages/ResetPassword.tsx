import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

const schema = z
  .object({
    password: z.string().min(8).max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "mismatch" });

/** How long to wait for the client to turn the emailed link into a session. */
const LINK_TIMEOUT_MS = 6000;

export default function ResetPasswordPage() {
  const { t, lang, toggle } = useLanguage();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = `${t("auth_reset_title")} · ${t("brand")}`;
  }, [t]);

  useEffect(() => {
    let settled = false;
    const accept = () => {
      if (settled) return;
      settled = true;
      setStatus("ready");
    };

    // Supabase rejects an expired or reused link by sending the error back on the
    // URL instead of a token, so there is nothing to wait for in that case.
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (params.get("error") || new URLSearchParams(window.location.search).get("error")) {
      settled = true;
      setStatus("invalid");
      return;
    }

    // detectSessionInUrl consumes the link asynchronously; it may land before or
    // after this component mounts, so watch both the event and the current session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY" || s) accept();
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) accept();
    });

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        setStatus("invalid");
      }
    }, LINK_TIMEOUT_MS);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      toast.error(issue?.path.includes("confirm") ? t("auth_password_mismatch") : t("auth_password_short"));
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) {
        if ((error as { code?: string }).code === "weak_password" || /weak|pwned/i.test(error.message)) {
          toast.error(
            lang === "ar"
              ? "كلمة المرور ضعيفة أو مسرّبة سابقاً. اختر كلمة أقوى تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز."
              : "Password is too weak or has been leaked. Choose a stronger one with upper/lowercase, numbers, and symbols."
          );
          return;
        }
        toast.error(error.message);
        return;
      }

      // The session came from an emailed link, which may have been opened on a
      // shared device; end it so the new password has to be entered once.
      await supabase.auth.signOut();
      toast.success(t("auth_reset_success"));
      navigate("/auth", { replace: true });
    } catch {
      toast.error(t("auth_reset_invalid"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, hsl(217 91% 55% / 0.4), transparent 40%), radial-gradient(circle at 80% 80%, hsl(0 84% 50% / 0.25), transparent 40%)",
        }}
      />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md surface-card p-8">
          <div className="mb-6 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand">
                <span className="font-bold text-primary-foreground">U</span>
              </div>
              <span className="font-bold">{t("brand")}</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={toggle}>
              {lang === "ar" ? "EN" : "ع"}
            </Button>
          </div>

          <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>{t("brand_tagline")}</span>
          </div>

          <h1 className="mb-6 text-2xl font-bold">{t("auth_reset_title")}</h1>

          {status === "checking" && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("auth_reset_checking")}
            </div>
          )}

          {status === "invalid" && (
            <div className="space-y-4">
              <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground">
                {t("auth_reset_invalid")}
              </p>
              <Button asChild className="w-full bg-gradient-brand">
                <Link to="/auth">{t("auth_reset_request_new")}</Link>
              </Button>
            </div>
          )}

          {status === "ready" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">{t("auth_reset_new_password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="confirm">{t("auth_confirm")}</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full bg-gradient-brand">
                {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("auth_reset_submit")}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <Link to="/auth" className="font-semibold text-primary hover:underline">
              {t("auth_back_to_login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

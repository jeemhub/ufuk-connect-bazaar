import { useState, useEffect } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "mismatch" });

function getPasswordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; labelAr: string; labelEn: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const s = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const map = {
    0: { labelAr: "ضعيفة جداً", labelEn: "Very weak", color: "bg-destructive" },
    1: { labelAr: "ضعيفة", labelEn: "Weak", color: "bg-destructive" },
    2: { labelAr: "متوسطة", labelEn: "Fair", color: "bg-yellow-500" },
    3: { labelAr: "جيدة", labelEn: "Good", color: "bg-yellow-500" },
    4: { labelAr: "قوية", labelEn: "Strong", color: "bg-green-500" },
  } as const;
  return { score: s, ...map[s] };
}

export default function AuthPage() {
  const { t, lang, toggle } = useLanguage();
  const { session, loading } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = `${t(mode === "login" ? "auth_title_login" : "auth_title_signup")} · ${t("brand")}`;
  }, [mode, t]);

  if (loading) return null;
  if (session) {
    const from = (location.state as { from?: string } | null)?.from || "/";
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse({ email, password, confirm, fullName, phone });
        if (!parsed.success) {
          const issue = parsed.error.issues[0];
          if (issue?.path.includes("confirm")) toast.error(t("auth_password_mismatch"));
          else if (issue?.path.includes("password")) toast.error(t("auth_password_short"));
          else toast.error(t("auth_invalid"));
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName, phone },
          },
        });
        if (error) {
          if ((error as any).code === "weak_password" || /weak|pwned/i.test(error.message)) {
            toast.error(lang === "ar"
              ? "كلمة المرور ضعيفة أو مسرّبة سابقاً. اختر كلمة أقوى تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز."
              : "Password is too weak or has been leaked. Choose a stronger one with upper/lowercase, numbers, and symbols.");
            return;
          }
          if (/registered|exists|already/i.test(error.message)) {
            toast.error(lang === "ar" ? "هذا البريد مسجّل مسبقاً." : "This email is already registered.");
            return;
          }
          toast.error(error.message);
          return;
        }
        toast.success(t("auth_signup_success"));
        setMode("login");
      } else {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) { toast.error(t("auth_invalid")); return; }
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          await supabase.from("login_activity").insert({
            user_id: null, email, event: "login", success: false, user_agent: navigator.userAgent,
          });
          toast.error(t("auth_invalid"));
          return;
        }
        if (data.user) {
          await supabase.from("login_activity").insert({
            user_id: data.user.id, email: data.user.email, event: "login", success: true, user_agent: navigator.userAgent,
          });
        }
        toast.success(t("auth_login_success"));
      }
    } catch (err) {
      toast.error(t("auth_invalid"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, hsl(217 91% 55% / 0.4), transparent 40%), radial-gradient(circle at 80% 80%, hsl(0 84% 50% / 0.25), transparent 40%)" }} />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md surface-card p-8">
          <div className="mb-6 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand">
                <span className="font-bold text-primary-foreground">U</span>
              </div>
              <span className="font-bold">{t("brand")}</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={toggle}>{lang === "ar" ? "EN" : "ع"}</Button>
          </div>

          <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>{t("brand_tagline")}</span>
          </div>

          <h1 className="mb-6 text-2xl font-bold">{t(mode === "login" ? "auth_title_login" : "auth_title_signup")}</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="fullName">{t("auth_full_name")}</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={120} />
                </div>
                <div>
                  <Label htmlFor="phone">{t("auth_phone")}</Label>
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={30} />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">{t("auth_email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="password">{t("auth_password")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={72} autoComplete={mode === "login" ? "current-password" : "new-password"} />
              {mode === "signup" && password.length > 0 && (() => {
                const s = getPasswordStrength(password);
                return (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${i < s.score ? s.color : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    <p className={`mt-1 text-xs ${s.score >= 4 ? "text-green-600" : s.score >= 2 ? "text-yellow-600" : "text-destructive"}`}>
                      {lang === "ar" ? s.labelAr : s.labelEn}
                    </p>
                  </div>
                );
              })()}
            </div>
            {mode === "signup" && (
              <div>
                <Label htmlFor="confirm">{t("auth_confirm")}</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" />
              </div>
            )}

            <Button type="submit" disabled={busy} className="w-full bg-gradient-brand">
              {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t(mode === "login" ? "auth_title_login" : "auth_title_signup")}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? t("auth_no_account") : t("auth_have_account")}{" "}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="font-semibold text-primary hover:underline">
              {t(mode === "login" ? "auth_title_signup" : "auth_title_login")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

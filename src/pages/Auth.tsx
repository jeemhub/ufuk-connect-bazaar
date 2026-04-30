import { useState, useEffect } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{lang === "ar" ? "أو" : "or"}</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const result = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (result.error) {
                  toast.error(lang === "ar" ? "فشل تسجيل الدخول عبر Google" : "Google sign-in failed");
                  return;
                }
                if (result.redirected) return;
              } catch {
                toast.error(lang === "ar" ? "فشل تسجيل الدخول عبر Google" : "Google sign-in failed");
              } finally {
                setBusy(false);
              }
            }}
            className="w-full gap-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            {lang === "ar" ? "المتابعة عبر Google" : "Continue with Google"}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const result = await lovable.auth.signInWithOAuth("apple", {
                  redirect_uri: window.location.origin,
                });
                if (result.error) {
                  toast.error(lang === "ar" ? "فشل تسجيل الدخول عبر Apple" : "Apple sign-in failed");
                  return;
                }
                if (result.redirected) return;
              } catch {
                toast.error(lang === "ar" ? "فشل تسجيل الدخول عبر Apple" : "Apple sign-in failed");
              } finally {
                setBusy(false);
              }
            }}
            className="mt-3 w-full gap-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
              <path d="M16.365 1.43c0 1.14-.46 2.23-1.21 3.02-.8.85-2.11 1.51-3.19 1.43-.13-1.11.42-2.27 1.16-3.02.83-.86 2.24-1.49 3.24-1.43zM20.5 17.27c-.55 1.27-.81 1.84-1.52 2.97-.99 1.57-2.39 3.52-4.12 3.54-1.54.01-1.93-1-4.02-.99-2.09.01-2.52 1.01-4.06 1-1.73-.02-3.05-1.78-4.04-3.35C-.05 16.86-.36 11.5 1.92 8.66c1.62-2.02 4.18-3.2 6.58-3.2 2.45 0 3.99 1.34 6.02 1.34 1.97 0 3.17-1.34 6-1.34 2.14 0 4.41 1.17 6.03 3.18-5.3 2.91-4.44 10.49-1.05 8.63z"/>
            </svg>
            {lang === "ar" ? "المتابعة عبر Apple" : "Continue with Apple"}
          </Button>

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

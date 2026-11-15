import { useState, useEffect } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { emailFeaturesEnabled, signupEnabled } from "@/lib/migrationFeatures";

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
  const [params,setParams]=useSearchParams();
  const requestedMode=params.get("mode");
  const mode=requestedMode==="signup"&&signupEnabled?"signup":requestedMode==="forgot"&&emailFeaturesEnabled?"forgot":"login";
  const [formError,setFormError]=useState("");
  const [signupSent,setSignupSent]=useState(false);
  const setMode=(next:"login"|"signup"|"forgot")=>{
    setParams(previous=>{const nextParams=new URLSearchParams(previous);if(next==="login")nextParams.delete("mode");else nextParams.set("mode",next);return nextParams;},{replace:true});
    setPassword("");setConfirm("");setResetSent(false);setSignupSent(false);setFormError("");
  };
  const [resetSent, setResetSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const titleKey =
    mode === "login" ? "auth_title_login" : mode === "signup" ? "auth_title_signup" : "auth_forgot_title";

  useEffect(() => {
    document.title = `${t(titleKey)} · ${t("brand")}`;
  }, [titleKey, t]);

  // Preserve an intended destination (e.g. the OAuth consent page) across sign-in.
  const nextParam = new URLSearchParams(location.search).get("next");
  const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;

  if (loading) return null;
  if (session) {
    const from = safeNext || (location.state as { from?: string } | null)?.from || "/";
    return <Navigate to={from} replace />;
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if(busy)return;
    setFormError("");
    if ((mode === "forgot" && !emailFeaturesEnabled) || (mode === "signup" && !signupEnabled)) {
      toast.error(lang === "ar" ? "بريد الموقع واستعادة الدخول قيد التجهيز؛ تواصل مع الإدارة." : "Email and account recovery are being prepared; contact the site owner.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "forgot") {
        const parsed = loginSchema.pick({ email: true }).safeParse({ email });
        if (!parsed.success) { toast.error(t("auth_invalid")); return; }
        // The success message does not reveal whether this address has an account.
        // Operational failures must still be shown, rather than falsely claiming delivery.
        const {error}=await supabase.auth.resetPasswordForEmail(parsed.data.email, {
          redirectTo: `${window.location.origin}/auth/reset`,
        });
        if(error){
          const message=error.status===429||/rate|too many/i.test(error.message)
            ? (lang==="ar"?"طلبات كثيرة. انتظر قليلًا ثم أعد المحاولة.":"Too many requests. Please try again shortly.")
            : (lang==="ar"?"تعذر إرسال رابط الاستعادة الآن. حاول لاحقًا أو تواصل مع الشركة.":"Unable to send the reset link. Try later or contact us.");
          setFormError(message);toast.error(message);return;
        }
        setResetSent(true);
        toast.success(t("auth_forgot_sent"));
        return;
      }
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
          email:parsed.data.email,
          password:parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}${safeNext ?? "/"}`,
            data: { full_name: parsed.data.fullName, phone:parsed.data.phone },
          },
        });
        if (error) {
          if ((error as { code?: string }).code === "weak_password" || /weak|pwned/i.test(error.message)) {
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
        setSignupSent(true);
      } else {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) { toast.error(t("auth_invalid")); return; }
        const { error, data } = await supabase.auth.signInWithPassword({email:parsed.data.email,password:parsed.data.password});
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
    } catch {
      const message=mode==="forgot"?(lang==="ar"?"تعذر الاتصال بخدمة البريد. حاول مجددًا.":"Unable to reach the email service. Please try again."):t("auth_invalid");
      setFormError(message);toast.error(message);
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

          {signupEnabled&&mode!=="forgot"&&<div role="tablist" aria-label={lang==="ar"?"خيارات الحساب":"Account options"} className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
            {(["login","signup"] as const).map(value=><Button key={value} type="button" role="tab" id={`auth-tab-${value}`} aria-selected={mode===value} tabIndex={mode===value?0:-1} onKeyDown={e=>{if(["ArrowLeft","ArrowRight","Home","End"].includes(e.key)){e.preventDefault();const next=e.key==="Home"?"login":e.key==="End"?"signup":value==="login"?"signup":"login";setMode(next);requestAnimationFrame(()=>document.getElementById(`auth-tab-${next}`)?.focus());}}} aria-controls="auth-panel" disabled={busy} variant={mode===value?"default":"ghost"} onClick={()=>setMode(value)}>{t(value==="login"?"auth_title_login":"auth_title_signup")}</Button>)}
          </div>}
          <h1 className="mb-2 text-2xl font-bold">{t(titleKey)}</h1>
          {mode === "forgot" && (
            <p className="mb-6 text-sm text-muted-foreground">{t("auth_forgot_hint")}</p>
          )}
          {mode !== "forgot" && <div className="mb-6" />}

          {signupSent&&<p role="status" className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">{t("auth_signup_success")}</p>}
          {formError&&<p role="alert" className="mb-4 text-sm text-destructive">{formError}</p>}
          <form id="auth-panel" role={mode!=="forgot"&&signupEnabled?"tabpanel":undefined} aria-labelledby={mode!=="forgot"&&signupEnabled?`auth-tab-${mode}`:undefined} onSubmit={handleSubmit} className="space-y-4">
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
            {mode !== "forgot" && (
            <div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password">{t("auth_password")}</Label>
                {mode === "login" && emailFeaturesEnabled && (
                  <button
                    type="button"
                    onClick={() => { setMode("forgot"); setResetSent(false); setPassword(""); }}
                    disabled={busy}
                    className="min-h-10 text-sm font-semibold text-primary hover:underline"
                  >
                    {t("auth_forgot_link")}
                  </button>
                )}
              </div>
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
            )}
            {mode === "signup" && (
              <div>
                <Label htmlFor="confirm">{t("auth_confirm")}</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} maxLength={72} autoComplete="new-password" />
              </div>
            )}

            <Button type="submit" disabled={busy} className="w-full bg-gradient-brand">
              {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t(mode === "forgot" ? "auth_forgot_send" : titleKey)}
            </Button>
          </form>

          {mode === "forgot" && resetSent && (
            <p role="status" className="mt-4 rounded-md border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
              {t("auth_forgot_sent")}
            </p>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "forgot" ? (
              <button
                type="button"
                onClick={() => { setMode("login"); setResetSent(false); }}
                className="font-semibold text-primary hover:underline"
              >
                {t("auth_back_to_login")}
              </button>
            ) : signupEnabled ? null : (
              <p>{lang === "ar" ? "استعادة كلمة المرور والتسجيل الجديد قيد التجهيز. الحسابات الحالية محفوظة؛ تواصل مع الإدارة إذا تحتاج مساعدة بالدخول." : "Password recovery and new registration are being prepared. Existing accounts are preserved; contact the site owner for access help."}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

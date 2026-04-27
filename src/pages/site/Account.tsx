import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { Camera, Loader2, Lock, Mail, Phone, Shield, User as UserIcon, LogOut, Monitor, CheckCircle2, XCircle, BadgeCheck } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { useAuth } from "@/auth/AuthProvider";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dropzone } from "@/components/ui/dropzone";

interface LoginRow {
  id: string;
  event: string;
  success: boolean;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
}

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
});

const passwordSchema = z.object({
  password: z.string().min(8).max(72),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "mismatch" });

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(meta)?.[1] || "image/jpeg";
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function parseUA(ua: string | null): { browser: string; os: string } {
  if (!ua) return { browser: "—", os: "—" };
  let browser = "Browser", os = "OS";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";
  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";
  return { browser, os };
}

export default function AccountPage() {
  const { t, lang } = useLanguage();
  const { user, loading, signOut, isVerified } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [logins, setLogins] = useState<LoginRow[]>([]);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    document.title = `${t("account_title")} · ${t("brand")}`;
  }, [t]);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        setAvatarUrl(data.avatar_url ?? null);
      }
      const { data: act } = await supabase
        .from("login_activity")
        .select("id, event, success, user_agent, ip_address, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(15);
      setLogins(act ?? []);
    })();
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace state={{ from: "/account" }} />;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const parsed = profileSchema.safeParse({ full_name: fullName, phone });
    if (!parsed.success) { toast.error(t("account_invalid")); return; }
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq("id", user!.id);
    setSavingProfile(false);
    if (error) toast.error(error.message);
    else toast.success(t("account_saved"));
  }

  async function saveEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || email === user!.email) return;
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email });
    setSavingEmail(false);
    if (error) toast.error(error.message);
    else toast.success(t("account_email_sent"));
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    const parsed = passwordSchema.safeParse({ password: pwd, confirm: pwdConfirm });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.path.includes("confirm") ? t("auth_password_mismatch") : t("auth_password_short"));
      return;
    }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setSavingPwd(false);
    if (error) {
      if (/weak|pwned/i.test(error.message)) toast.error(lang === "ar" ? "كلمة المرور ضعيفة أو مسرّبة." : "Password is too weak or leaked.");
      else toast.error(error.message);
      return;
    }
    setPwd(""); setPwdConfirm("");
    toast.success(t("account_password_changed"));
  }

  function pickFile() { fileInput.current?.click(); }

  function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) { toast.error(lang === "ar" ? "الحجم أكبر من 5MB" : "File exceeds 5MB"); return; }
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFile(file);
  }

  async function onCropped(dataUrl: string) {
    if (!user) return;
    setUploading(true);
    try {
      const blob = dataUrlToBlob(dataUrl);
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      if (updErr) throw updErr;
      setAvatarUrl(url);
      toast.success(t("account_avatar_updated"));
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    if (!user) return;
    setUploading(true);
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    setUploading(false);
    if (error) toast.error(error.message);
    else { setAvatarUrl(null); toast.success(t("account_avatar_removed")); }
  }

  async function endAllSessions() {
    setSigningOut(true);
    await supabase.auth.signOut({ scope: "global" } as any);
    await signOut();
    setSigningOut(false);
  }

  const initials = (fullName || email || "U").trim().slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <Avatar className="h-28 w-28 md:h-32 md:w-32 ring-2 ring-primary/20">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName || email} />}
            <AvatarFallback className="bg-gradient-brand text-primary-foreground font-bold text-2xl">{initials}</AvatarFallback>
          </Avatar>
          {isVerified && (
            <span className="absolute -bottom-1 -end-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background">
              <BadgeCheck
                className="h-8 w-8"
                style={{ color: "hsl(210 100% 50%)", fill: "hsl(210 100% 50%)", stroke: "hsl(0 0% 100%)" }}
              />
            </span>
          )}
        </div>
        <div>
          <div className="text-base font-semibold">{fullName || (lang === "ar" ? "بدون اسم" : "No name")}</div>
          <div className="text-xs text-muted-foreground">{email}</div>
        </div>
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t("account_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("account_sub")}</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
          <TabsTrigger value="profile" className="gap-2"><UserIcon className="h-4 w-4" />{t("account_tab_profile")}</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="h-4 w-4" />{t("account_tab_security")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Avatar Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("account_avatar")}</CardTitle>
              <CardDescription>{t("account_avatar_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Dropzone
                accept="image/*"
                onFiles={(files) => handleFile(files[0])}
                disabled={uploading}
                overlayLabel={t("drop_to_upload")}
              >
                <div className="flex flex-col items-center gap-6 rounded-md border border-dashed border-input p-4 sm:flex-row sm:items-start">
                  <div className="relative">
                    <Avatar className="h-28 w-28 ring-4 ring-primary/10">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName || email} />}
                      <AvatarFallback className="bg-gradient-brand text-2xl font-bold text-primary-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={pickFile}
                      disabled={uploading}
                      className="absolute -bottom-1 -end-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition hover:scale-105 disabled:opacity-50"
                      aria-label={t("account_change_avatar")}
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex-1 space-y-2 text-center sm:text-start">
                    <p className="text-sm text-muted-foreground">
                      {lang === "ar" ? "الصور المدعومة: JPG، PNG. الحد الأقصى 5MB." : "Supported: JPG, PNG. Max 5MB."}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("drop_file_here")}</p>
                    <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                      <Button type="button" variant="outline" size="sm" onClick={pickFile} disabled={uploading}>
                        {t("account_upload")}
                      </Button>
                      {avatarUrl && (
                        <Button type="button" variant="ghost" size="sm" onClick={removeAvatar} disabled={uploading}>
                          {t("account_remove")}
                        </Button>
                      )}
                    </div>
                  </div>
                  <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFile} />
                </div>
              </Dropzone>
            </CardContent>
          </Card>

          {/* Personal info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("account_personal")}</CardTitle>
              <CardDescription>{t("account_personal_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="full_name">{t("auth_full_name")}</Label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="ps-9" maxLength={120} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">{t("auth_phone")}</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="ps-9" maxLength={30} />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={savingProfile} className="bg-gradient-brand">
                    {savingProfile && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    {t("account_save")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Email */}
          <Card>
            <CardHeader>
              <CardTitle>{t("account_email")}</CardTitle>
              <CardDescription>{t("account_email_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveEmail} className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <Label htmlFor="email">{t("auth_email")}</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ps-9" maxLength={255} />
                  </div>
                </div>
                <div className="sm:self-end">
                  <Button type="submit" disabled={savingEmail || email === user.email} variant="outline">
                    {savingEmail && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    {t("account_update_email")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />{t("account_change_password")}</CardTitle>
              <CardDescription>{t("account_change_password_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={savePassword} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="new_pwd">{t("account_new_password")}</Label>
                  <Input id="new_pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} minLength={8} maxLength={72} autoComplete="new-password" />
                </div>
                <div>
                  <Label htmlFor="confirm_pwd">{t("auth_confirm")}</Label>
                  <Input id="confirm_pwd" type="password" value={pwdConfirm} onChange={(e) => setPwdConfirm(e.target.value)} minLength={8} maxLength={72} autoComplete="new-password" />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={savingPwd || !pwd} className="bg-gradient-brand">
                    {savingPwd && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    {t("account_change_password")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5 text-primary" />{t("account_sessions")}</CardTitle>
              <CardDescription>{t("account_sessions_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-green-500/10 p-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{t("account_current_session")}</span>
                        <Badge variant="secondary" className="text-[10px]">{lang === "ar" ? "نشط الآن" : "Active now"}</Badge>
                      </div>
                      {(() => {
                        const ua = parseUA(navigator.userAgent);
                        return <p className="mt-0.5 text-xs text-muted-foreground">{ua.browser} · {ua.os}</p>;
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              <Button variant="destructive" onClick={endAllSessions} disabled={signingOut} className="gap-2">
                {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                {t("account_end_all")}
              </Button>

              <Separator />

              <div>
                <h4 className="mb-3 text-sm font-semibold">{t("account_recent_activity")}</h4>
                {logins.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{lang === "ar" ? "لا يوجد نشاط بعد." : "No activity yet."}</p>
                ) : (
                  <div className="space-y-2">
                    {logins.map((l) => {
                      const ua = parseUA(l.user_agent);
                      const ok = l.success;
                      return (
                        <div key={l.id} className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm">
                          <div className="flex items-center gap-3">
                            {ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
                            <div>
                              <div className="font-medium">
                                {l.event === "login" ? (ok ? (lang === "ar" ? "تسجيل دخول ناجح" : "Successful login") : (lang === "ar" ? "محاولة فاشلة" : "Failed attempt"))
                                  : l.event === "logout" ? (lang === "ar" ? "تسجيل خروج" : "Sign out") : l.event}
                              </div>
                              <div className="text-xs text-muted-foreground">{ua.browser} · {ua.os}</div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(l.created_at).toLocaleString(lang === "ar" ? "ar-IQ" : "en-US")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {cropSrc && (
        <ImageCropper
          open={!!cropSrc}
          src={cropSrc}
          onClose={() => setCropSrc(null)}
          onCropped={onCropped}
          aspect={1}
        />
      )}
    </div>
  );
}

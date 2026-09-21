import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

type AuthorizationDetails = {
  client?: { name?: string | null } | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
  scope?: string | null;
};

function oauthNamespace(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;
}

export default function OAuthConsent() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError(ar ? "طلب غير صالح: لا يوجد معرّف تصريح." : "Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error: detailsError } = await oauthNamespace().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (detailsError) {
        setError(detailsError.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, ar]);

  async function decide(approve: boolean) {
    setBusy(true);
    const oauth = oauthNamespace();
    const { data, error: decideError } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (decideError) {
      setBusy(false);
      setError(decideError.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError(ar ? "لم يُرجع الخادم عنوان إعادة توجيه." : "No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? (ar ? "تطبيق" : "an app");

  return (
    <div className="relative min-h-screen bg-gradient-hero" dir={ar ? "rtl" : "ltr"}>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md surface-card p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-brand">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="text-lg font-bold">{ar ? "طلب ربط" : "Connection request"}</div>
          </div>

          {error ? (
            <p className="text-sm text-destructive">
              {ar ? "تعذّر تحميل طلب الربط: " : "Could not load this authorization request: "}
              {error}
            </p>
          ) : !details ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {ar ? "جارٍ التحميل…" : "Loading…"}
            </div>
          ) : (
            <>
              <h1 className="mb-2 text-xl font-bold">
                {ar ? `ربط ${clientName} بحسابك` : `Connect ${clientName} to your account`}
              </h1>
              <p className="mb-6 text-sm text-muted-foreground">
                {ar
                  ? `سيتمكن ${clientName} من استخدام هذا الموقع باسمك: قراءة المنتجات وطلباتك وإرسال طلبات تسعير.`
                  : `This lets ${clientName} use this app as you: read products, your orders, and submit quote requests.`}
              </p>
              <div className="flex gap-3">
                <Button disabled={busy} onClick={() => decide(true)} className="flex-1">
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {ar ? "موافق" : "Approve"}
                </Button>
                <Button disabled={busy} variant="outline" onClick={() => decide(false)} className="flex-1">
                  {ar ? "رفض" : "Deny"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

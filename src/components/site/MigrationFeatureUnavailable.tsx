import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

export function MigrationFeatureUnavailable({ feature }: { feature: "recovery" | "mcp" }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const heading = feature === "mcp"
    ? (ar ? "ربط التطبيقات مؤجل مؤقتاً" : "App connections are temporarily unavailable")
    : (ar ? "استعادة كلمة المرور مؤجلة مؤقتاً" : "Password recovery is temporarily unavailable");
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-hero p-4" dir={ar ? "rtl" : "ltr"}>
      <section className="surface-card w-full max-w-md space-y-4 p-8">
        <h1 className="text-xl font-bold">{heading}</h1>
        <p className="text-sm text-muted-foreground">
          {ar ? "لم يتم إرسال طلب أو تغيير حسابك. يمكنك الدخول بكلمة مرور حسابك الحالية. إذا تعذر الدخول، تواصل مع إدارة الموقع."
            : "No request was sent and your account has not changed. You can sign in with your existing account password. Contact the site owner if you cannot sign in."}
        </p>
        <Link to="/auth" className="inline-block text-primary underline">{ar ? "العودة لتسجيل الدخول" : "Return to sign in"}</Link>
      </section>
    </main>
  );
}

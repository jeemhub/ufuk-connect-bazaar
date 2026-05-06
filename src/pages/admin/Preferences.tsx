import { useLanguage } from "@/i18n/LanguageContext";
import { GlassThemeSettings } from "@/components/admin/GlassThemeSettings";

export default function Preferences() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {ar ? "تفضيلاتي" : "My Preferences"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ar
            ? "خصص مظهر لوحة التحكم الخاصة بك. هذه الإعدادات شخصية ولا تؤثر على المسؤولين الآخرين."
            : "Personalize your dashboard appearance. These preferences are private to your account."}
        </p>
      </div>

      <GlassThemeSettings />
    </div>
  );
}

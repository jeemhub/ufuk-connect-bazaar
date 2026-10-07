import { useCommerceSettings, safeHttps } from "@/hooks/useCommerceSettings";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import logo from "@/assets/logo.png";

export function SiteFooter() {
  const { t, lang } = useLanguage();
  const { settings } = useCommerceSettings();
  const ar = lang === "ar";
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div className="md:col-span-2">
          <div className="mb-3 flex items-center gap-3">
            <img src={logo} alt={t("brand")} className="h-20 w-20 object-contain" />
            <span className="text-lg font-bold">{t("brand")}</span>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">{t("footer_about")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {["MikroTik", "Ruijie", "Must"].map((b) => (
              <span key={b} className="rounded-md border border-border bg-background px-3 py-1 text-xs font-semibold">{b}</span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold">{t("footer_links")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">{t("nav_home")}</Link></li>
            <li><Link to="/products" className="hover:text-foreground">{t("nav_shop")}</Link></li>
            <li><Link to="/quote" className="hover:text-foreground">{t("request_quote")}</Link></li>
            <li><Link to="/track-order" className="hover:text-foreground">{ar ? "تتبع الطلب" : "Track order"}</Link></li>
            <li><Link to="/tools" className="hover:text-foreground">{ar ? "حاسبات الطاقة" : "Engineering tools"}</Link></li>
            <li><Link to="/policies" className="hover:text-foreground">{ar ? "الضمان والتوصيل" : "Warranty and delivery"}</Link></li>
            <li><Link to="/compare" className="hover:text-foreground">{ar ? "مقارنة المنتجات" : "Compare products"}</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">{t("sign_in")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold">{t("footer_contact")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {settings.address}</li>
            <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-1" /> <a href="tel:+9647716992955" dir="ltr">+964 771 699 2955</a></li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> <a href="mailto:sales@ufukbasra.com.iq">sales@ufukbasra.com.iq</a></li>
            {settings.hours && <li>{settings.hours}</li>}
            {safeHttps(settings.mapUrl) && <li><a target="_blank" rel="noopener noreferrer" href={settings.mapUrl} className="text-primary underline">{ar ? "الموقع على الخريطة" : "Open map"}</a></li>}
            {safeHttps(settings.reviewsUrl) && <li><a target="_blank" rel="noopener noreferrer" href={settings.reviewsUrl} className="text-primary underline">{ar ? "تقييمات العملاء" : "Customer reviews"}</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-muted-foreground md:px-6">
          © {year} {t("brand")} — {t("footer_rights")}
        </div>
      </div>
    </footer>
  );
}

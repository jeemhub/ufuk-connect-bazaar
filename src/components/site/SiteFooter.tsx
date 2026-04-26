import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export function SiteFooter() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4 md:px-6">
        <div className="md:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand"><span className="font-bold text-primary-foreground">U</span></div>
            <span className="font-bold">{t("brand")}</span>
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
            <li><Link to="/auth" className="hover:text-foreground">{t("sign_in")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-bold">{t("footer_contact")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {t("footer_address")}</li>
            <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-1" /> <span className="whitespace-pre-line">+964 771 699 2955{"\n\n"}</span></li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> sales@ufukbasra.com.iq</li>
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

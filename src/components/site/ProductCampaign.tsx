import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import "./product-campaign.css";

type ProductCampaignProps = {
  id: string;
  image: string;
  alt: string;
  label: ReactNode;
  title: ReactNode;
  description: string;
  action: string;
  to: string;
  brand?: "bluestorm" | "hikvision" | "energy" | "ruijie";
  footer?: ReactNode;
};

/** Shared layout keeps the homepage campaigns aligned at every breakpoint. */
export function ProductCampaign({ id, image, alt, label, title, description, action, to, brand = "bluestorm", footer }: ProductCampaignProps) {
  const { lang } = useLanguage();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  return (
    <section className={`product-campaign product-campaign-${brand}`} dir="ltr" aria-labelledby={`${id}-title`}>
      <img className="product-campaign-image" src={image} alt={alt} width={1672} height={941} loading="lazy" decoding="async" />
      <div className="product-campaign-shade" aria-hidden="true" />
      <div className="product-campaign-copy" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="product-campaign-label">{label}</div>
        <h2 id={`${id}-title`}>{title}</h2>
        <p className="product-campaign-description">{description}</p>
        <Link className="product-campaign-action" to={to}>{action}<Arrow size={18} aria-hidden="true" /></Link>
        {footer && <div className="product-campaign-footer">{footer}</div>}
      </div>
    </section>
  );
}

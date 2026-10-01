import { useLanguage } from "@/i18n/LanguageContext";
import { ProductCampaign } from "./ProductCampaign";

export function RuijieSection() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return <ProductCampaign
    id="ruijie" brand="ruijie" image="/images/ruijie/campaign.webp"
    alt={ar ? "بوابة شبكة وسويتش ونقطة وصول من Ruijie Reyee" : "Ruijie Reyee gateway, switch and Wi-Fi access point"}
    label={<bdi><strong>Ruijie</strong> <span>/ Reyee</span></bdi>}
    title={ar ? <>شبكة تربط<br />كل التفاصيل.</> : <>A network that<br />connects it all.</>}
    description={ar ? "بوابات ذكية، سويتشات PoE، تغطية Wi‑Fi وربط لاسلكي. اكتشف الأجهزة المناسبة لمساحة عملك ومشروعك." : "Smart gateways, PoE switching, Wi-Fi coverage and wireless bridges. Explore hardware for your space and project."}
    action={ar ? "استكشف حلول Ruijie" : "Explore Ruijie solutions"} to="/ruijie"
    footer={<span>{ar ? "بوابات · سويتشات · Wi‑Fi · ربط لاسلكي" : "Gateways · Switches · Wi-Fi · Wireless bridges"}</span>}
  />;
}

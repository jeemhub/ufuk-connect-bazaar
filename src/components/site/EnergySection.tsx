import { useLanguage } from "@/i18n/LanguageContext";
import { ProductCampaign } from "./ProductCampaign";

export function EnergySection() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return <ProductCampaign id="energy" brand="energy" image="/images/energy/campaign.webp"
    alt={ar ? "عواكس وبطاريات MUST وأجهزة UPS من BlueStorm" : "MUST inverters and batteries with BlueStorm UPS"}
    label={<bdi>MUST <span aria-hidden="true">×</span> BlueStorm</bdi>}
    title={ar ? <>طاقة ليومك.<br />جاهزية لغدك.</> : <>Power your day.<br />Prepare for tomorrow.</>}
    description={ar ? "عواكس شمسية وبطاريات ليثيوم من MUST، وحلول UPS من BlueStorm. اكتشف خيارات الطاقة لمنزلك وأعمالك." : "MUST solar inverters and lithium batteries. BlueStorm UPS. Explore energy solutions for your home and business."}
    action={ar ? "اكتشف حلول الطاقة" : "Explore energy solutions"} to="/energy"
    footer={<span>{ar ? "عواكس شمسية · تخزين ليثيوم · UPS" : "Solar inverters · Lithium storage · UPS"}</span>} />;
}

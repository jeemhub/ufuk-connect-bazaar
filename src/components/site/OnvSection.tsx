import { useLanguage } from "@/i18n/LanguageContext";
import { ProductCampaign } from "./ProductCampaign";

export function OnvSection() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return <ProductCampaign id="onv" brand="onv" image="/images/onv/campaign.webp"
    alt={ar ? "سويتشات ONV PoE للشبكات والكاميرات" : "ONV PoE switches for networks and cameras"}
    label={<strong>ONV <span>/ PoE NETWORKS</span></strong>}
    title={ar ? <>الطاقة والبيانات.<br />في مسار واحد.</> : <>Power and data.<br />One clear path.</>}
    description={ar ? "من سويتش كاميرات مدمج إلى شبكات مُدارة ومعدات صناعية. اكتشف حلول ONV التي تربط أجهزتك وتغذيها." : "From compact camera switches to managed and industrial networks. Explore ONV hardware that connects and powers your devices."}
    action={ar ? "استكشف حلول ONV" : "Explore ONV solutions"} to="/onv"
    footer={<span>{ar ? "PoE+ · فايبر SFP · إدارة الشبكة · معدات صناعية" : "PoE+ · SFP fiber · Network management · Industrial"}</span>} />;
}

import { useLanguage } from "@/i18n/LanguageContext";
import { ProductCampaign } from "./ProductCampaign";

export function HuaweiSection() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return <ProductCampaign id="huawei" brand="huawei" image="/images/huawei/campaign.webp"
    alt={ar ? "تشكيلة توضيحية من سويتشات ونقاط وصول وأجهزة فايبر" : "Illustrative lineup of switches, access points and fiber terminals"}
    label={<strong>HUAWEI <span style={{ fontSize: ".55em", fontWeight: 500 }}>eKit</span></strong>}
    title={ar ? <>بنية واحدة.<br />اتصال لكل مساحة.</> : <>One foundation.<br />Every space connected.</>}
    description={ar ? "من البوابة والسويتش إلى Wi‑Fi وأجهزة الفايبر. اكتشف تشكيلة Huawei المتوفرة في كتالوج أفق البصرة." : "From gateway and switch to Wi-Fi and fiber terminals. Explore the Huawei range in the UFUK AL-Basra catalog."}
    action={ar ? "استكشف Huawei" : "Explore Huawei"} to="/huawei"
    footer={<span>{ar ? "بوابات · سويتشات · نقاط وصول · فايبر" : "Gateways · Switches · Access points · Fiber"}</span>} />;
}

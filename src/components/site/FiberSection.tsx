import { useLanguage } from "@/i18n/LanguageContext";
import { ProductCampaign } from "./ProductCampaign";

export function FiberSection() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return <ProductCampaign id="fiber" brand="fiber" image="/images/fiber/campaign.webp"
    alt={ar ? "تشكيلة توضيحية من كيابل الفايبر ومعدات الربط والفحص" : "Illustrative fiber cable, distribution and testing equipment"}
    label={<strong>OPTICAL FIBER{ar && <> <span aria-hidden="true">/</span> ألياف ضوئية</>}</strong>}
    title={ar ? <>من شعرة الضوء<br />إلى شبكة متكاملة.</> : <>From a single strand<br />to a complete network.</>}
    description={ar ? "كيابل، وصلات، توزيع، وحدات ضوئية ومعدات فحص. اكتشف حلول الفايبر المتوفرة في كتالوج أفق البصرة." : "Cables, patch cords, distribution, optical modules and testing equipment. Explore the fiber range in the UFUK AL-Basra catalog."}
    action={ar ? "استكشف حلول الفايبر" : "Explore fiber solutions"} to="/fiber-optic"
    footer={<span>{ar ? "كيابل · باتش كورد · ODF · SFP · ONT · فحص ولحام" : "Cables · Patch cords · ODF · SFP · ONT · Testing"}</span>} />;
}

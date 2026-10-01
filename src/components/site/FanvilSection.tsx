import { useLanguage } from "@/i18n/LanguageContext";
import { ProductCampaign } from "./ProductCampaign";

export function FanvilSection() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  return <ProductCampaign
    id="fanvil" brand="fanvil" image="/images/fanvil/campaign.jpg"
    alt={ar ? "صورة توضيحية لهاتف مكتبي احترافي من Fanvil" : "Illustrative studio image of a Fanvil enterprise desk phone"}
    label={<strong>FANVIL <span>/ IP COMMUNICATIONS</span></strong>}
    title={ar ? <>صوت واضح.<br />تواصل أقرب.</> : <>Clear voice.<br />Closer connections.</>}
    description={ar ? "هواتف IP مكتبية ولاسلكية، انتركم وسماعات لفرق العمل. استكشف منتجات Fanvil الموجودة في أفق البصرة." : "Desk and wireless IP phones, intercoms and headsets for connected teams. Explore the Fanvil range available at UFUK AL-Basra."}
    action={ar ? "استكشف منتجات Fanvil" : "Explore Fanvil products"}
    to="/products?brand=Fanvil"
    footer={<span>{ar ? "هواتف IP · هواتف Wi-Fi · انتركم · سماعات" : "IP phones · Wi-Fi phones · Intercoms · Headsets"}</span>}
  />;
}

import { useLanguage } from "@/i18n/LanguageContext";
import { ProductCampaign } from "./ProductCampaign";

export function MikroTikSection() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return <ProductCampaign id="mikrotik" brand="mikrotik" image="/images/mikrotik/campaign.webp"
    alt={ar ? "تشكيلة توضيحية من معدات التوجيه والسويتشات والربط اللاسلكي" : "Illustrative lineup of routers, switches and wireless networking equipment"}
    label={<strong>MikroTik</strong>}
    title={ar ? <>تحكم أوسع.<br />شبكة تعمل بطريقتك.</> : <>More control.<br />Your network, your way.</>}
    description={ar ? "راوترات، سويتشات، Wi‑Fi وربط لاسلكي خارجي. تعرّف على أجهزة MikroTik المتوفرة لدى أفق البصرة." : "Routers, switches, Wi-Fi and outdoor wireless links. Explore the MikroTik devices available at UFUK AL-Basra."}
    action={ar ? "استكشف MikroTik" : "Explore MikroTik"} to="/mikrotik"
    footer={<span>{ar ? "توجيه · سويتشات · Wi‑Fi · ربط خارجي" : "Routing · Switching · Wi-Fi · Outdoor links"}</span>} />;
}

import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import "./hikvision.css";
import { ProductCampaign } from "./ProductCampaign";

export function HikvisionHero({ landing = false }: { landing?: boolean }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const Heading = landing ? "h1" : "h2";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  return (
    <section className={`hik-hero ${landing ? "hik-hero-landing" : ""}`} dir="ltr" aria-labelledby={landing ? "hik-title" : "hik-home-title"}>
      <img className="hik-hero-image" src="/images/hikvision/campaign.webp" alt={ar ? "مجموعة كاميرات Hikvision وجهاز تسجيل شبكي" : "Hikvision camera collection and network recorder"} width={1672} height={941} loading={landing ? "eager" : "lazy"} fetchPriority={landing ? "high" : "auto"} />
      <div className="hik-hero-shade" aria-hidden="true" />
      <div className="hik-hero-copy" dir={ar ? "rtl" : "ltr"}>
        <p className="hik-wordmark" dir="ltr">HIK<span>VISION</span></p>
        <Heading id={landing ? "hik-title" : "hik-home-title"}>{ar ? <>رؤية أوضح.<br />حماية أذكى.</> : <>A clearer view.<br />Smarter protection.</>}</Heading>
        <p className="hik-lead">{ar ? "من تفاصيل المداخل إلى اتساع الساحات. اكتشف كاميرات وتقنيات تسجيل تختار منها ما يناسب موقعك." : "From entrance details to open courtyards. Explore cameras and recording technology to suit your site."}</p>
        {landing ? <a className="hik-button" href="#hik-products">{ar ? "استكشف الأجهزة" : "Explore the devices"}<Arrow size={18} aria-hidden="true" /></a> : <Link className="hik-button" to="/hikvision">{ar ? "اكتشف حلول Hikvision" : "Explore Hikvision solutions"}<Arrow size={18} aria-hidden="true" /></Link>}
        <p className="hik-hero-foot">ColorVu <span /> TandemVu <span /> AcuSense</p>
      </div>
    </section>
  );
}

export function HikvisionSection() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return <ProductCampaign
    id="hik-home" brand="hikvision" image="/images/hikvision/campaign.webp"
    alt={ar ? "مجموعة كاميرات Hikvision وجهاز تسجيل شبكي" : "Hikvision camera collection and network recorder"}
    label={<p className="hik-wordmark" dir="ltr">HIK<span>VISION</span></p>}
    title={ar ? <>رؤية أوضح.<br />حماية أذكى.</> : <>A clearer view.<br />Smarter protection.</>}
    description={ar ? "من تفاصيل المداخل إلى اتساع الساحات. اكتشف كاميرات وتقنيات تسجيل تختار منها ما يناسب موقعك." : "From entrance details to open courtyards. Explore cameras and recording technology to suit your site."}
    action={ar ? "اكتشف حلول Hikvision" : "Explore Hikvision solutions"} to="/hikvision"
    footer={<p className="hik-hero-foot">ColorVu <span /> TandemVu <span /> AcuSense</p>}
  />;
}

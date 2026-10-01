import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Download, Network, Radio, Router, Wifi } from "lucide-react";
import { Seo, SITE_NAME } from "@/components/seo/Seo";
import { useLanguage } from "@/i18n/LanguageContext";
import { ruijieFamilies, type RuijieFamily } from "@/lib/ruijie";
import "@/components/site/ruijie.css";

const icons = { gateway: Router, switch: Network, wifi: Wifi, bridge: Radio };

function FamilySection({ family }: { family: RuijieFamily }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [selected, setSelected] = useState(0);
  const product = family.products[selected];
  const Arrow = ar ? ArrowLeft : ArrowRight;
  return <section id={family.key} className={`ruijie-family ruijie-family-${family.key}`} aria-labelledby={`ruijie-${family.key}-title`}>
    <div className="ruijie-inner">
      <div className="ruijie-family-head">
        <div><span className="ruijie-overline">{family.index} / {family.kicker}</span><h2 id={`ruijie-${family.key}-title`}>{family.title[lang]}</h2></div>
        <p>{family.lead[lang]}</p>
      </div>
      <div className="ruijie-detail">
        <figure className="ruijie-product-visual">
          <span className="ruijie-art-mark" aria-hidden="true">{family.index}</span>
          <img src={product.image} alt={`${product.model} Ruijie Reyee`} width="1100" height="1100" loading="lazy" decoding="async" />
          <figcaption><span>RUIJIE / REYEE</span><bdi>{product.model}</bdi></figcaption>
        </figure>
        <div className="ruijie-product-content">
          {family.products.length > 1 && <fieldset className="ruijie-models"><legend>{ar ? "اختر الموديل" : "Select a model"}</legend><div>{family.products.map((item, index) => <button type="button" key={item.id} aria-pressed={index === selected} onClick={() => setSelected(index)}><bdi>{item.model}</bdi></button>)}</div></fieldset>}
          <div className="ruijie-product-copy" aria-live="polite" aria-atomic="true"><span className="ruijie-selected-label">{ar ? "الموديل المختار" : "SELECTED MODEL"}</span><h3><bdi>{product.model}</bdi></h3><p>{product.summary[lang]}</p></div>
          <dl className="ruijie-specs">{product.specs.map(item => <div key={item.label.en}><dt>{item.label[lang]}</dt><dd><bdi>{item.value}</bdi></dd></div>)}</dl>
          {product.note && <p className="ruijie-note">{product.note[lang]}</p>}
          <div className="ruijie-actions"><Link className="ruijie-primary-link" to={`/products/${product.id}`}>{ar ? "صفحة المنتج" : "Product details"}<Arrow size={18} aria-hidden="true" /></Link><a className="ruijie-pdf-link" href={product.pdf} download><Download size={17} aria-hidden="true" />{ar ? "الداتا شيت" : "Datasheet"}<span>PDF</span></a></div>
          <Link className="ruijie-quote-link" to={`/quote?product=${product.id}`}>{ar ? "اطلب عرض سعر لهذا الموديل" : "Request a quote for this model"}<ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>
      </div>
    </div>
  </section>;
}

export default function Ruijie() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  return <main className="ruijie-page" dir={ar ? "rtl" : "ltr"}>
    <Seo title={`${ar ? "حلول الشبكات Ruijie Reyee" : "Ruijie Reyee network solutions"} | ${SITE_NAME}`} description={ar ? "تعرّف على بوابات Ruijie Reyee وسويتشات PoE ونقاط الوصول Wi‑Fi والجسور اللاسلكية لدى أفق البصرة. مواصفات أصلية وملفات داتا شيت لكل موديل." : "Explore Ruijie Reyee gateways, PoE switches, Wi-Fi access points and wireless bridges at UFUK AL-Basra, with original datasheets for each model."} path="/ruijie" image="/images/ruijie/campaign.webp" lang={lang} />
    <section className="ruijie-hero" aria-labelledby="ruijie-title" dir="ltr">
      <img src="/images/ruijie/campaign.webp" alt={ar ? "مجموعة من معدات شبكة Ruijie Reyee" : "Ruijie Reyee networking equipment"} width="1672" height="941" fetchPriority="high" />
      <div className="ruijie-hero-shade" aria-hidden="true" />
      <div className="ruijie-hero-copy" dir={ar ? "rtl" : "ltr"}><span className="ruijie-wordmark">Ruijie <i>/</i> Reyee</span><span className="ruijie-overline">NETWORK SOLUTIONS / UFUK AL-BASRA</span><h1 id="ruijie-title">{ar ? <>من أول منفذ<br /><em>إلى أبعد نقطة.</em></> : <>From the first port<br /><em>to the farthest point.</em></>}</h1><p>{ar ? "اختيارات واضحة لكل طبقة من شبكتك: التوجيه، توزيع الطاقة، التغطية، وربط المواقع." : "Clear choices for every layer of your network: routing, power distribution, coverage and site links."}</p><a href="#ruijie-path" className="ruijie-primary-link">{ar ? "استكشف المنظومة" : "Explore the lineup"}<ArrowDown size={18} aria-hidden="true" /></a></div>
    </section>
    <section id="ruijie-path" className="ruijie-path" aria-labelledby="ruijie-path-title"><div className="ruijie-inner"><div className="ruijie-path-intro"><span className="ruijie-overline">THE NETWORK / 01—04</span><h2 id="ruijie-path-title">{ar ? "أربع وظائف. شبكة واحدة." : "Four roles. One network."}</h2><p>{ar ? "اتبع مسار الإشارة من بوابة الإنترنت إلى الأجهزة داخل المبنى أو إلى موقع آخر، ثم اختر الموديل المناسب." : "Follow the signal from the internet gateway to devices inside the building or at another site, then choose a model."}</p></div><nav className="ruijie-path-grid" aria-label={ar ? "أقسام حلول Ruijie" : "Ruijie solution categories"}>{ruijieFamilies.map(family => { const Icon = icons[family.key as keyof typeof icons]; return <a href={`#${family.key}`} key={family.key}><span className="ruijie-path-top"><Icon size={27} strokeWidth={1.45} aria-hidden="true" /><bdi>{family.index}</bdi></span><strong>{family.title[lang]}</strong><span className="ruijie-path-foot"><bdi>{family.kicker}</bdi><Arrow size={18} aria-hidden="true" /></span></a>; })}</nav></div></section>
    {ruijieFamilies.map(family => <FamilySection key={family.key} family={family} />)}
    <section className="ruijie-closing"><div className="ruijie-inner"><span className="ruijie-overline">RUIJIE / REYEE × UFUK AL-BASRA</span><h2>{ar ? "ما الذي تحتاجه شبكتك فعلًا؟" : "What does your network really need?"}</h2><p>{ar ? "أرسل لنا مساحة الموقع، عدد الأجهزة وطبيعة الاستخدام. نساعدك في اختيار البوابة والسويتش والتغطية المناسبة." : "Share your site size, device count and use case. We can help select the right gateway, switch and coverage."}</p><Link className="ruijie-primary-link" to="/quote">{ar ? "اطلب استشارة وعرض سعر" : "Request advice and a quote"}<Arrow size={18} aria-hidden="true" /></Link></div></section>
    <p className="ruijie-source ruijie-inner">{ar ? "المواصفات والصور التفصيلية من Ruijie Reyee. ملفات PDF الرسمية متاحة لكل موديل. قد يختلف الأداء الفعلي باختلاف تصميم الشبكة وظروف الموقع." : "Specifications and detail images are from Ruijie Reyee. Official PDFs are available for each model. Actual performance varies with network design and site conditions."}</p>
  </main>;
}

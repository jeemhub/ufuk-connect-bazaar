import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowRight, Download, EthernetPort, Factory, Network, Server } from "lucide-react";
import { Seo, SITE_NAME } from "@/components/seo/Seo";
import { useLanguage } from "@/i18n/LanguageContext";
import { onvFamilies, type OnvFamily } from "@/lib/onv";
import "@/components/site/onv.css";

const icons = { compact: EthernetPort, managed: Network, rack: Server, industrial: Factory };

function OnvExplorer({ family }: { family: OnvFamily }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [selected, setSelected] = useState(0);
  const product = family.products[selected];
  const Arrow = ar ? ArrowLeft : ArrowRight;
  return <section className={`onv-explorer onv-explorer-${family.key}`} id={family.key} aria-labelledby={`onv-${family.key}-title`}>
    <div className="onv-container">
      <header className="onv-explorer-head"><div><span className="onv-kicker">{family.index} / {family.code}</span><h2 id={`onv-${family.key}-title`}>{family.title[lang]}</h2></div><p>{family.lead[lang]}</p></header>
      <div className="onv-product-stage">
        <figure className="onv-product-image"><span className="onv-image-index" aria-hidden="true">{family.index}</span><img key={product.image} src={product.image} alt={`${product.model} ONV switch`} width="1000" height="800" loading="lazy" decoding="async" /><figcaption><span>ONV / SWITCHING</span><bdi>{product.model}</bdi></figcaption></figure>
        <div className="onv-product-details">
          {family.products.length > 1 && <fieldset className="onv-model-picker"><legend>{ar ? "اختر الموديل" : "Select a model"}</legend><div>{family.products.map((item, i) => <button key={item.id} type="button" aria-pressed={selected === i} onClick={() => setSelected(i)}><bdi>{item.model}</bdi></button>)}</div></fieldset>}
          <div aria-live="polite" aria-atomic="true" className="onv-selected"><span className="onv-kicker">{ar ? "الموديل المختار" : "SELECTED MODEL"}</span><h3><bdi>{product.model}</bdi></h3><p>{product.summary[lang]}</p></div>
          <dl className="onv-specs">{product.specs.map(item => <div key={item.label.en}><dt>{item.label[lang]}</dt><dd><bdi>{item.value}</bdi></dd></div>)}</dl>
          {product.note && <p className="onv-note">{product.note[lang]}</p>}
          <div className="onv-actions"><Link className="onv-button" to={`/products/${product.id}`}>{ar ? "تفاصيل المنتج" : "Product details"}<Arrow size={18} aria-hidden="true" /></Link><a className="onv-pdf" href={product.pdf} download><Download size={17} aria-hidden="true" />{ar ? "تحميل الداتا شيت" : "Download datasheet"}<bdi>PDF</bdi></a></div>
          <Link className="onv-quote" to={`/quote?product=${product.id}`}>{ar ? "اطلب عرض سعر لهذا الموديل" : "Request a quote for this model"}<Arrow size={16} aria-hidden="true" /></Link>
        </div>
      </div>
    </div>
  </section>;
}

export default function Onv() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  return <main className="onv-page" dir={ar ? "rtl" : "ltr"}>
    <Seo title={`${ar ? "حلول ONV للشبكات وPoE" : "ONV PoE network solutions"} | ${SITE_NAME}`} description={ar ? "استكشف سويتشات ONV PoE للمراقبة والشبكات: موديلات مدمجة وGigabit ومُدارة وصناعية، مع مواصفات وملفات داتا شيت رسمية." : "Explore ONV PoE switches for surveillance and networks: compact, Gigabit, managed and industrial models with official datasheets."} path="/onv" image="/images/onv/campaign.webp" lang={lang} />
    <section className="onv-hero" dir="ltr" aria-labelledby="onv-title"><img src="/images/onv/campaign.webp" alt={ar ? "مجموعة سويتشات ONV للشبكات" : "A selection of ONV networking switches"} width="1672" height="941" fetchPriority="high" /><div className="onv-hero-shade" aria-hidden="true" /><div className="onv-hero-content" dir={ar ? "rtl" : "ltr"}><span className="onv-wordmark"><bdi>ONV</bdi></span><span className="onv-kicker">PoE / SWITCHING / FIBER</span><h1 id="onv-title">{ar ? <>شبكة تعمل.<br /><em>وأجهزتك معها.</em></> : <>A network that works.<br /><em>Devices that stay on.</em></>}</h1><p>{ar ? "من أول كاميرا إلى آخر نقطة في الموقع. حلول ONV تجمع نقل البيانات والطاقة وربط الفايبر حسب حجم مشروعك." : "From the first camera to the far edge of the site. ONV brings data, power and fiber connections together for your project."}</p><a className="onv-button" href="#onv-options">{ar ? "استكشف الأجهزة" : "Explore the hardware"}<ArrowDown size={18} aria-hidden="true" /></a></div></section>
    <section className="onv-options" id="onv-options" aria-labelledby="onv-options-title"><div className="onv-container"><div className="onv-options-intro"><span className="onv-kicker">THE RIGHT SWITCH / THE RIGHT PLACE</span><h2 id="onv-options-title">{ar ? "ابدأ بطبيعة موقعك." : "Start with your site."}</h2><p>{ar ? "لكل موقع احتياج مختلف من عدد المنافذ، سرعة الاتصال، إدارة الشبكة والتغذية. اختر الفئة لتعرف الموديل وتقرأ نشرته الرسمية." : "Each site needs a different port count, link speed, management level and power setup. Pick a role to explore its model and official datasheet."}</p></div><nav className="onv-options-grid" aria-label={ar ? "فئات أجهزة ONV" : "ONV device categories"}>{onvFamilies.map(f => { const Icon = icons[f.key as keyof typeof icons]; return <a href={`#${f.key}`} key={f.key}><span className="onv-option-top"><Icon size={27} strokeWidth={1.4} aria-hidden="true" /><bdi>{f.index}</bdi></span><strong>{f.title[lang]}</strong><span className="onv-option-bottom"><bdi>{f.code}</bdi><Arrow size={17} aria-hidden="true" /></span></a>; })}</nav></div></section>
    {onvFamilies.map(f => <OnvExplorer family={f} key={f.key} />)}
    <section className="onv-ending"><div className="onv-container"><span className="onv-kicker">ONV × UFUK AL-BASRA</span><h2>{ar ? "دعنا نحدد السويتش المناسب لمشروعك." : "Let's select the right switch for your project."}</h2><p>{ar ? "أخبرنا بعدد الكاميرات ونقاط الوصول، أطوال التمديد ومتطلبات الطاقة. سنساعدك في تحديد الموديل والملحقات المناسبة." : "Tell us your camera and access-point count, cable runs and power needs. We'll help match the model and accessories."}</p><Link className="onv-button" to="/quote">{ar ? "اطلب عرض سعر" : "Request a quote"}<Arrow size={18} aria-hidden="true" /></Link></div></section>
    <p className="onv-source onv-container">{ar ? "المواصفات والصور التفصيلية من ONV. صورة البنر توضيحية. قد تختلف ملحقات SFP ومزودات الطاقة حسب الموديل؛ تحقق من ملف PDF الخاص به." : "Specifications and detail images are from ONV. Campaign artwork is illustrative. SFP modules and power supplies vary by model; see each model's PDF."}</p>
  </main>;
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowDown, Download, ShieldCheck, Sun, Cable } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Seo, SITE_NAME } from "@/components/seo/Seo";
import "./bluestorm-cable.css";

const productId = "f3b76e0a-f1c2-47be-8a44-22d70ed3bce0";
const banner = "/images/bluestorm-feature/cable-reel-banner.jpg";
const datasheet = "/datasheets/bluestorm-cat6-sftp-outdoor.pdf";
const content = {
  ar: {
    title: "قوة الاتصال. من الداخل.",
    description: "كيبل BlueStorm CAT6 SFTP للتركيبات الخارجية. نحاس صلب وتدريع متعدد الطبقات، داخل غلاف صُمّم لمواجهة العوامل الجوية.",
    product: "عرض السعر والتوفر", quote: "اطلب عرض سعر", discover: "اكتشف ما وراء الغلاف",
    stats: ["طول البكرة", "نحاس صلب", "أزواج ملتفة", "نطاق التردد"],
    inside: "هندسة من الداخل", insideTitle: "كل طبقة تؤدي دوراً.",
    insideBody: "تعرّف على تركيب الكيبل، من الموصلات إلى الغلاف الخارجي. اختر إحدى الطبقات لاستكشاف وظيفتها.",
    layers: [
      { title: "موصلات النحاس", label: "23 AWG · 4 PAIRS", body: "أربعة أزواج بموصلات نحاس صلب عارٍ بقياس 23 AWG، وقطر اسمي للموصل 0.58 ± 0.008 مم. عزل HDPE وفاصل داخلي ينظّمان بنية الكيبل." },
      { title: "التدريع المعدني", label: "ALUMINUM FOIL + BRAID", body: "رقائق ألمنيوم وشبكة تدريع معدنية مع سلك تصريف. طبقات تحيط بالأزواج الداخلية للمساعدة في الحد من التداخل الكهرومغناطيسي." },
      { title: "الغلاف الخارجي", label: "PE JACKET · OUTDOOR", body: "غلاف PE أسود مقاوم للعوامل الجوية، مع مواد للحماية من الأشعة فوق البنفسجية وخيوط للحد من مرور الماء داخل الكيبل." },
    ],
    illustration: "تصوّر توضيحي للطبقات؛ راجع الداتا شيت للرسم والمقاسات الفنية.",
    ready: "مهيّأ للعمل في الخارج", readyTitle: "تفاصيل تخدم موقع العمل.",
    benefits: [
      { title: "حماية خارجية", body: "غلاف PE وتقنية للحد من مرور الماء، للاستخدام في تطبيقات الشبكات الخارجية." },
      { title: "قياس أسهل أثناء التركيب", body: "ترقيم طول مطبوع كل متر يساعد الفني في حساب الكمية المستخدمة." },
      { title: "شبكات وطاقة", body: "تطبيقات Ethernet من 10BASE-T إلى 1000BASE-T، وتطبيقات الطاقة عبر الشبكة PoE." },
    ],
    specTitle: "المواصفات، بوضوح.", specIntro: "مختارات من الداتا شيت الرسمي للطراز BS-OSFTP6-305M.", download: "تحميل الداتا شيت", source: "المصدر: BlueStorm · CAT6 SFTP Outdoor",
    specs: [
      ["التصنيف", "CAT6 SFTP"], ["طول التعبئة", "305 ± 1.0 m"], ["الموصلات", "23 AWG · Solid Bare Copper"], ["عدد الأزواج", "4P"], ["عزل الموصل", "HDPE"], ["التدريع", "Aluminum foil + braid + drain wire"], ["الغلاف", "Black PE"], ["القطر الخارجي", "7.6 ± 0.2 mm"], ["نطاق التردد", "1–250 MHz"], ["درجة حرارة التركيب", "−30°C to +70°C"],
    ],
    closing: "ابدأ شبكتك باختيار مدروس.", closingBody: "تعرّف على السعر والتوفر، أو اطلب عرض سعر لكميات مشروعك من فريق أفق البصرة.",
    reelAlt: "بكرة BlueStorm خشبية ملفوف عليها كيبل CAT6 SFTP أسود", cutawayAlt: "مقطع توضيحي لطبقات كيبل الشبكات، يظهر التدريع والأزواج النحاسية الملتفة",
  },
  en: {
    title: "Connection starts within.",
    description: "BlueStorm CAT6 SFTP cable for outdoor installations. Solid copper and layered shielding, inside a jacket designed for exposure to the elements.",
    product: "View price and availability", quote: "Request a quote", discover: "Look beneath the jacket",
    stats: ["Reel length", "Solid copper", "Twisted pairs", "Frequency range"],
    inside: "Engineered from within", insideTitle: "Every layer has a purpose.",
    insideBody: "Explore the cable from its conductors to its outer jacket. Select a layer to learn what it does.",
    layers: [
      { title: "Copper conductors", label: "23 AWG · 4 PAIRS", body: "Four pairs of 23 AWG solid bare copper conductors with a nominal diameter of 0.58 ± 0.008 mm. HDPE insulation and an internal separator organize the cable structure." },
      { title: "Metallic shielding", label: "ALUMINUM FOIL + BRAID", body: "Aluminum foil and metallic braid with a drain wire. Shielding surrounds the internal pairs to help reduce electromagnetic interference." },
      { title: "Outdoor jacket", label: "PE JACKET · OUTDOOR", body: "A weather-resistant black PE jacket with UV-blocking materials and water-blocking yarn to limit water passage inside the cable." },
    ],
    illustration: "Illustrative cutaway. Refer to the datasheet for the technical drawing and dimensions.",
    ready: "Made for outdoor work", readyTitle: "Details that serve the installation.",
    benefits: [
      { title: "Outdoor protection", body: "A PE jacket and water-blocking construction for outdoor network applications." },
      { title: "Measure as you install", body: "Length markings printed every metre help installers track cable use." },
      { title: "Data and power", body: "Ethernet applications from 10BASE-T through 1000BASE-T, and Power over Ethernet applications." },
    ],
    specTitle: "The specifications. Clearly.", specIntro: "Selected specifications from the official BS-OSFTP6-305M datasheet.", download: "Download datasheet", source: "Source: BlueStorm · CAT6 SFTP Outdoor",
    specs: [
      ["Category", "CAT6 SFTP"], ["Packing length", "305 ± 1.0 m"], ["Conductors", "23 AWG · Solid Bare Copper"], ["Pair count", "4P"], ["Insulation", "HDPE"], ["Shielding", "Aluminum foil + braid + drain wire"], ["Jacket", "Black PE"], ["Outer diameter", "7.6 ± 0.2 mm"], ["Frequency range", "1–250 MHz"], ["Installation temperature", "−30°C to +70°C"],
    ],
    closing: "Build on a considered choice.", closingBody: "Check current pricing and availability, or ask the UFUK AL-Basra team for a project quote.",
    reelAlt: "BlueStorm wooden reel wound with black outdoor CAT6 SFTP cable", cutawayAlt: "Illustrative network cable cutaway showing shielding and twisted copper pairs",
  },
};

export default function BlueStormCable() {
  const { lang } = useLanguage();
  const c = content[lang];
  const [layer, setLayer] = useState(0);
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const icons = [Sun, ShieldCheck, Cable];
  const productPath = `/products/${productId}`;
  return (
    <div className="bs-cable">
      <Seo title={`BlueStorm CAT6 SFTP Outdoor | ${SITE_NAME}`} description={c.description} path="/bluestorm/cat6-sftp-outdoor" image={banner} type="product" lang={lang} jsonLd={{ "@context": "https://schema.org", "@type": "Product", name: "BlueStorm CAT6 SFTP Outdoor Cable 305m", sku: "BS-OSFTP6-305M", brand: { "@type": "Brand", name: "BlueStorm" }, image: `https://ufukalbasra.com${banner}`, description: c.description }} />
      <section className="bs-cable-hero" aria-labelledby="cable-title">
        <img src={banner} alt={c.reelAlt} width={1672} height={941} fetchPriority="high" className="bs-cable-hero-image" />
        <div className="bs-cable-hero-shade" aria-hidden="true" />
        <div className="bs-cable-hero-inner">
          <div className="bs-cable-hero-copy">
            <p className="bs-eyebrow"><bdi>BlueStorm / BS-OSFTP6-305M</bdi></p>
            <h1 id="cable-title">{c.title}</h1>
            <p className="bs-cable-description">{c.description}</p>
            <div className="bs-actions">
              <Link className="bs-button" to={productPath}>{c.product}<Arrow size={17} aria-hidden="true" /></Link>
              <Link className="bs-button bs-button-outline" to={`/quote?product=${productId}`}>{c.quote}</Link>
            </div>
            <a href="#cable-construction" className="bs-discover">{c.discover}<ArrowDown size={16} aria-hidden="true" /></a>
          </div>
        </div>
      </section>

      <div className="bs-stat-strip">
        {["305 m", "23 AWG", "4", "250 MHz"].map((value, i) => <div key={value}><strong dir="ltr">{value}</strong><span>{c.stats[i]}</span></div>)}
      </div>

      <section id="cable-construction" className="bs-construction bs-section" aria-labelledby="construction-title">
        <div className="bs-reveal">
          <p className="bs-eyebrow">{c.inside}</p><h2 id="construction-title">{c.insideTitle}</h2><p className="bs-muted bs-intro">{c.insideBody}</p>
          <div className="bs-layer-buttons" role="group" aria-label={c.inside}>
            {c.layers.map((item, i) => <button key={item.label} type="button" aria-pressed={layer === i} aria-controls="cable-layer-detail" onClick={() => setLayer(i)}><span dir="ltr">0{i + 1}</span>{item.title}<Arrow size={17} aria-hidden="true" /></button>)}
          </div>
          <div id="cable-layer-detail" className="bs-layer-detail" aria-live="polite" aria-atomic="true">
            <div key={layer} className="bs-layer-enter"><p className="bs-eyebrow"><bdi>{c.layers[layer].label}</bdi></p><p>{c.layers[layer].body}</p></div>
          </div>
        </div>
        <figure className="bs-cutaway bs-reveal">
          <div className="bs-cutaway-frame"><img src="/images/bluestorm-feature/cable-cutaway.jpg" alt={c.cutawayAlt} loading="lazy" decoding="async" width={1536} height={1024} /></div>
          <figcaption>{c.illustration}</figcaption>
        </figure>
      </section>

      <section className="bs-benefits" aria-labelledby="outdoor-title">
        <div className="bs-section">
          <div className="bs-reveal"><p className="bs-eyebrow">{c.ready}</p><h2 id="outdoor-title">{c.readyTitle}</h2></div>
          <div className="bs-benefit-grid">{c.benefits.map((item, i) => { const Icon = icons[i]; return <article key={item.title} className="bs-reveal"><Icon size={27} strokeWidth={1.3} aria-hidden="true" /><h3>{item.title}</h3><p>{item.body}</p></article>; })}</div>
        </div>
      </section>

      <section className="bs-specs bs-section bs-reveal" aria-labelledby="cable-specs-title">
        <div><p className="bs-eyebrow"><bdi>BS-OSFTP6-305M</bdi></p><h2 id="cable-specs-title">{c.specTitle}</h2><p className="bs-muted bs-intro">{c.specIntro}</p><a className="bs-button" href={datasheet} target="_blank" rel="noopener noreferrer">{c.download}<Download size={17} aria-hidden="true" /></a><p className="bs-source">{c.source}</p></div>
        <table><caption className="sr-only">{c.specIntro}</caption><tbody>{c.specs.map(([key, value]) => <tr key={key}><th scope="row">{key}</th><td><bdi>{value}</bdi></td></tr>)}</tbody></table>
      </section>

      <section className="bs-closing bs-reveal"><p className="bs-eyebrow">BlueStorm × UFUK AL-Basra</p><h2>{c.closing}</h2><p>{c.closingBody}</p><div className="bs-actions"><Link className="bs-button" to={productPath}>{c.product}<Arrow size={17} aria-hidden="true" /></Link><Link className="bs-button bs-button-outline" to={`/quote?product=${productId}`}>{c.quote}</Link></div></section>
    </div>
  );
}

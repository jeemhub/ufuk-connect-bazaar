import { Link } from "react-router-dom";
import { Download, ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Seo, SITE_NAME } from "@/components/seo/Seo";
import { HikvisionHero } from "@/components/site/HikvisionSection";
import { hikvisionProducts } from "@/lib/hikvision";

export default function Hikvision() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  return (
    <div className="hik-page" dir={ar ? "rtl" : "ltr"}>
      <Seo title={`Hikvision | ${ar ? "حلول المراقبة والتسجيل" : "Surveillance & recording"} | ${SITE_NAME}`} description={ar ? "اكتشف كاميرات Hikvision ColorVu وPanoramic وTandemVu ومسجلات AcuSense لدى أفق البصرة. مواصفات واضحة وداتا شيت لكل جهاز." : "Explore Hikvision ColorVu, panoramic and TandemVu cameras and AcuSense recording at UFUK AL-Basra, with product specifications and datasheets."} path="/hikvision" image="/images/hikvision/campaign.webp" lang={lang} />
      <HikvisionHero landing />
      <section className="hik-selector hik-wrap" id="hik-products" aria-labelledby="hik-selection-title">
        <div className="hik-section-heading"><h2 id="hik-selection-title">{ar ? "كل مساحة، لها اختيارها." : "The right view for your space."}</h2><p>{ar ? "ابدأ بما تحتاج مراقبته، ثم تعرّف على الجهاز." : "Start with what you need to monitor, then explore the device."}</p></div>
        <nav className="hik-use-nav" aria-label={ar ? "اختيار جهاز المراقبة" : "Choose a surveillance device"}>
          {hikvisionProducts.map(p => <a href={`#${p.slug}`} key={p.slug}><span>{p[lang].use}</span><strong>{p.family}</strong><Arrow size={19} aria-hidden="true" /></a>)}
        </nav>
      </section>
      <div className="hik-products">
        {hikvisionProducts.map((p, index) => { const c = p[lang]; return (
          <section key={p.slug} id={p.slug} className={`hik-product ${index % 2 ? "hik-product-reverse" : ""}`} aria-labelledby={`${p.slug}-title`}>
            <div className="hik-product-inner hik-wrap">
              <figure className={`hik-product-art hik-art-${p.slug}`}>
                <span className="hik-art-family" aria-hidden="true">{p.family}</span>
                <img src={p.image} alt={`${p.family} — ${p.model}`} width={p.slug === "acusense" ? 500 : 800} height={p.slug === "acusense" ? 184 : 800} loading="lazy" decoding="async" />
                <figcaption><span className="hik-red-line" />{p.family}</figcaption>
              </figure>
              <div className="hik-product-copy">
                <p className="hik-model"><bdi>{p.model}</bdi></p>
                <h2 id={`${p.slug}-title`}>{c.name}</h2>
                <p className="hik-body">{c.body}</p>
                <dl className="hik-spec-grid">{c.specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd><bdi>{value}</bdi></dd></div>)}</dl>
                <details className="hik-detail"><summary>{ar ? "تفاصيل تساعدك على الاختيار" : "More to help you choose"}<Plus size={17} aria-hidden="true" /></summary><p>{c.detail}</p></details>
                <div className="hik-actions"><Link className="hik-button" to={`/products/${p.id}`}>{ar ? "السعر وتفاصيل المنتج" : "Price & product details"}<Arrow size={17} aria-hidden="true" /></Link><a className="hik-download" href={`/datasheets/hikvision/${p.pdf}`} target="_blank" rel="noopener noreferrer">{ar ? "الداتا شيت" : "Datasheet"}<Download size={18} aria-hidden="true" /><span className="sr-only">{ar ? "PDF — يفتح في نافذة جديدة" : "PDF — opens in a new tab"}</span></a></div>
                <Link className="hik-quote-link" to={`/quote?product=${p.id}`}>{ar ? "اطلب عرض سعر لهذا الجهاز" : "Request a quote for this device"}</Link>
              </div>
            </div>
          </section>
        ); })}
      </div>
      <section className="hik-closing">
        <div className="hik-wrap hik-closing-inner"><div><p className="hik-closing-brand">Hikvision × {ar ? "أفق البصرة" : "UFUK AL-Basra"}</p><h2>{ar ? "لنختَر التغطية المناسبة لموقعك." : "Let’s find the right coverage for your site."}</h2><p>{ar ? "شاركنا مساحة الموقع ونقاط المراقبة المطلوبة. يساعدك فريقنا في اختيار الكاميرات والتسجيل والتخزين المناسب." : "Tell us about your site and the areas you need to monitor. Our team can help select cameras, recording and storage."}</p></div><div className="hik-closing-actions"><Link className="hik-button" to="/quote">{ar ? "اطلب عرض سعر لمشروعك" : "Request a project quote"}<Arrow size={17} aria-hidden="true" /></Link><Link className="hik-download" to="/products?brand=HIKVISION">{ar ? "تصفّح جميع منتجات Hikvision" : "Browse all Hikvision products"}</Link></div></div>
      </section>
      <p className="hik-source hik-wrap">{ar ? "المواصفات المختارة مأخوذة من نشرات Hikvision المرتبطة بكل جهاز. يُحدّد التوافق والتخزين وفق الموديل وإعدادات النظام." : "Selected specifications are based on the Hikvision datasheet linked for each device. Compatibility and storage depend on the model and system configuration."}</p>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowRight, BatteryCharging, Download, Sun, Zap } from "lucide-react";
import { Seo, SITE_NAME } from "@/components/seo/Seo";
import { useLanguage } from "@/i18n/LanguageContext";
import { energyInverters, energyBatteries, energyUps, type EnergyProduct } from "@/lib/energy";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/site/ProductCard";
import type { Product } from "@/data/mockData";
import "@/components/site/energy.css";

function ProductExplorer({ id, number, title, lead, products, catalog, catalogLoading, initial = 0 }: {
  id: string; number: string; title: string; lead: string; products: EnergyProduct[]; catalog?: Product[]; catalogLoading?: boolean; initial?: number;
}) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [selected, setSelected] = useState(initial);
  const p = products[selected];
  const Arrow = ar ? ArrowLeft : ArrowRight;
  return <section className={`energy-explorer energy-explorer-${id}`} id={id} aria-labelledby={`${id}-title`}>
    <div className="energy-wrap">
      <div className="energy-section-heading"><div><span className="energy-eyebrow">{number} / {id === "ups" ? "BLUESTORM" : "MUST ENERGY"}</span><h2 id={`${id}-title`}>{title}</h2></div><p>{lead}</p></div>
      <div className="energy-product-layout">
        <figure className="energy-product-art">
          <span className="energy-art-word" aria-hidden="true">{id === "inverters" ? "CONVERT" : id === "batteries" ? "STORE" : "PROTECT"}</span>
          <img key={p.image} src={p.image} alt={`${id === "ups" ? "BlueStorm" : "MUST"} — ${p.series}`} width="1000" height="1000" loading="lazy" decoding="async" />
          <figcaption><span>{p.pdf ? (ar ? "صورة السلسلة من الداتا شيت" : "Series image from the datasheet") : (ar ? "صورة المنتج من المتجر" : "Product image from the catalog")}</span><bdi>{p.series}</bdi></figcaption>
        </figure>
        <div className="energy-product-info">
          <fieldset className="energy-model-picker"><legend>{ar ? "اختر الموديل" : "Select a model"}</legend><div>{products.map((item, i) => <button key={item.id} type="button" aria-pressed={i === selected} onClick={() => setSelected(i)}><bdi>{item.choice}</bdi></button>)}</div></fieldset>
          <div className="energy-selected" aria-live="polite" aria-atomic="true"><p className="energy-model"><bdi>{p.model}</bdi></p><p className="energy-power" dir="ltr"><strong>{p.power}</strong><span>{p.unit}</span></p><p className="energy-product-description">{p.summary[lang]}</p></div>
          <dl className="energy-specs">{p.specs.map(s => <div key={s.label.en}><dt>{s.label[lang]}</dt><dd><bdi>{s.value}</bdi></dd></div>)}</dl>
          <p className="energy-product-note">{p.note[lang]}</p>
          <div className="energy-actions"><Link className="energy-button" to={`/products/${p.id}`}>{ar ? "السعر وتفاصيل المنتج" : "Price & product details"}<Arrow size={17} aria-hidden="true" /></Link>{p.pdf && <a className="energy-download" href={p.pdf} download><Download size={18} aria-hidden="true" />{ar ? "تحميل الداتا شيت" : "Download datasheet"}<span>PDF</span></a>}</div>
          <Link className="energy-quote-link" to={`/quote?product=${p.id}`}>{ar ? "اطلب عرض سعر لهذا الموديل" : "Request a quote for this model"}</Link>
        </div>
      </div>
      {catalog && <div className="energy-catalog" aria-busy={catalogLoading}>
        <div className="energy-catalog-heading"><div><span className="energy-eyebrow">{ar ? "الموديلات الموجودة في المتجر" : "AVAILABLE IN THE CATALOG"}</span><h3>{id === "inverters" ? (ar ? "جميع عواكس MUST" : "All MUST inverters") : (ar ? "جميع بطاريات الليثيوم" : "All lithium batteries")}</h3></div><span className="energy-catalog-count">{catalogLoading ? "…" : String(catalog.length).padStart(2, "0")}</span></div>
        {catalogLoading ? <p className="energy-catalog-status" role="status">{ar ? "جارٍ تحميل المنتجات…" : "Loading products…"}</p> : catalog.length ? <div className="energy-catalog-grid">{catalog.map(product => <ProductCard key={product.id} product={product} imageFit="contain" />)}</div> : <p className="energy-catalog-status">{ar ? "تعذر عرض قائمة المنتجات الآن. تصفّح الموديلات المميزة أعلاه." : "The catalog is unavailable right now. Browse the featured models above."}</p>}
      </div>}
    </div>
  </section>;
}

export default function Energy() {
  const { lang } = useLanguage();
  const { products: catalogProducts, loading: catalogLoading } = useProducts({ activeOnly: true });
  const mustInverters = catalogProducts.filter(product => product.brand.toLowerCase() === "must" && /inverter|\binv\b|عاكس|انفرتر/i.test(`${product.nameEn} ${product.nameAr}`));
  const lithiumBatteries = catalogProducts.filter(product => /lifepo|lithium|ليثيوم/i.test(`${product.nameEn} ${product.nameAr}`));
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const sections = [
    { id: "inverters", icon: Sun, title: ar ? "عواكس MUST" : "MUST inverters", subtitle: ar ? "إدارة الطاقة الشمسية" : "Manage solar energy" },
    { id: "batteries", icon: BatteryCharging, title: ar ? "بطاريات الليثيوم" : "Lithium batteries", subtitle: ar ? "طاقة محفوظة لوقت الحاجة" : "Store energy for later" },
    { id: "ups", icon: Zap, title: "BlueStorm UPS", subtitle: ar ? "إسناد لأجهزتك وأعمالك" : "Back up your equipment" },
  ];
  return <div className="energy-page" dir={ar ? "rtl" : "ltr"}>
    <Seo title={`${ar ? "حلول الطاقة | MUST وBlueStorm" : "Energy solutions | MUST & BlueStorm"} | ${SITE_NAME}`} description={ar ? "عواكس MUST الشمسية، بطاريات الليثيوم LiFePO4، وأجهزة BlueStorm UPS لدى أفق البصرة. قارن الموديلات واطلب عرض سعر." : "Explore MUST solar inverters, LiFePO4 batteries and BlueStorm UPS at UFUK AL-Basra. Compare models and request a quote."} path="/energy" image="/images/energy/campaign.webp" lang={lang} />
    <section className="energy-hero" aria-labelledby="energy-hero-title" dir="ltr">
      <img className="energy-hero-image" src="/images/energy/campaign.webp" width="1672" height="941" alt={ar ? "حلول الطاقة من MUST وBlueStorm" : "MUST and BlueStorm energy solutions"} fetchPriority="high" />
      <div className="energy-hero-shade" aria-hidden="true" />
      <div className="energy-hero-copy" dir={ar ? "rtl" : "ltr"}>
        <p className="energy-hero-brands"><bdi>MUST <span>×</span> BlueStorm</bdi></p>
        <p className="energy-eyebrow">{ar ? "حلول الطاقة من أفق البصرة" : "ENERGY SOLUTIONS BY UFUK AL-BASRA"}</p>
        <h1 id="energy-hero-title">{ar ? <>طاقة تدير يومك.<br /><em>بكل ثقة.</em></> : <>Energy for your day.<br /><em>Confidence for tomorrow.</em></>}</h1>
        <p className="energy-hero-lead">{ar ? "من تحويل طاقة الشمس إلى تخزينها وإسناد أجهزتك. اكتشف العاكس والبطارية وUPS المناسب لاحتياجك." : "From solar conversion to storage and equipment backup. Discover the right inverter, battery and UPS for your needs."}</p>
        <a className="energy-button" href="#energy-selection">{ar ? "استكشف المنتجات" : "Explore the range"}<ArrowDown size={18} aria-hidden="true" /></a>
      </div>
    </section>
    <section className="energy-selection energy-wrap" id="energy-selection" aria-labelledby="energy-selection-title">
      <div className="energy-section-heading"><div><span className="energy-eyebrow">{ar ? "توليد. تخزين. إسناد." : "CONVERT. STORE. PROTECT."}</span><h2 id="energy-selection-title">{ar ? "ثلاثة أدوار. اختيار أوضح." : "Three roles. A clearer choice."}</h2></div><p>{ar ? "ابدأ بالدور الذي تحتاجه، ثم اختر الموديل لتظهر مواصفاته ومنتجاته المتاحة." : "Start with the role you need, then select a model to see its specifications and available products."}</p></div>
      <nav className="energy-category-nav" aria-label={ar ? "أقسام الطاقة" : "Energy categories"}>{sections.map(({ id, icon: Icon, title, subtitle }, i) => <a href={`#${id}`} key={id}><span className="energy-nav-top"><Icon size={26} strokeWidth={1.4} aria-hidden="true" /><span>0{i + 1}</span></span><h3>{title}</h3><span className="energy-nav-bottom">{subtitle}<Arrow size={20} aria-hidden="true" /></span></a>)}</nav>
    </section>
    <ProductExplorer id="inverters" number="01" title={ar ? "ابدأ من الشمس." : "Start with the sun."} lead={ar ? "سلاسل ECO وEXP وPRO. قدرات وخصائص مختلفة لتختار العاكس المناسب لمنظومتك." : "ECO, EXP and PRO series. Different outputs and features to match your solar system."} products={energyInverters} catalog={mustInverters} catalogLoading={catalogLoading} initial={2} />
    <ProductExplorer id="batteries" number="02" title={ar ? "خزّن اليوم. استفد لاحقًا." : "Store today. Use it later."} lead={ar ? "اختر بطارية الليثيوم المناسبة من الموديلات الموجودة في المتجر، بما فيها MUST بجهد 51.2 فولت وسعة 300Ah." : "Explore the lithium batteries in our catalog, including the MUST 51.2V 300Ah model."} products={energyBatteries} catalog={lithiumBatteries} catalogLoading={catalogLoading} initial={2} />
    <div className="energy-storage-strip"><div className="energy-wrap"><p>{ar ? "توسعة سلسلة LP1600" : "LP1600 SERIES EXPANSION"}</p><strong><bdi>15</bdi><span>{ar ? "وحدة كحد أقصى بالتوازي لسلسلة LP1600" : "LP1600 units maximum in parallel"}</span></strong><p>{ar ? "تخص هذه المعلومة موديلات LP1600 ذات 200Ah فقط. يحدد تصميم المنظومة توافق الجهد والاتصال وعدد الوحدات المناسب." : "This specification applies only to the 200Ah LP1600 models. System design determines voltage and communication compatibility and the appropriate number of units."}</p></div></div>
    <ProductExplorer id="ups" number="03" title={ar ? "إسناد يواكب أعمالك." : "Backup for your business."} lead={ar ? "أجهزة BlueStorm بتقنية Online أو Line Interactive، مع خيارات برجية وأجهزة مخصصة للرفوف." : "BlueStorm Online and Line Interactive UPS, with tower and rack options."} products={energyUps} initial={2} />
    <section className="energy-comparison energy-wrap" aria-labelledby="energy-comparison-title"><span className="energy-eyebrow">{ar ? "اختيار التقنية" : "CHOOSING A TECHNOLOGY"}</span><h2 id="energy-comparison-title">{ar ? "ما الفرق بين نوعَي UPS؟" : "Which UPS technology fits?"}</h2><div className="energy-comparison-grid"><article><span>01</span><h3>Online</h3><p>{ar ? "تحويل مزدوج، موجة جيبية نقية وانتقال من الكهرباء إلى البطارية بزمن 0ms في موديلات BS-KS وBS-3K-RM المعروضة." : "Double conversion, pure sine wave output and 0ms AC-to-battery transfer on the featured BS-KS and BS-3K-RM models."}</p></article><article><span>02</span><h3>Line Interactive</h3><p>{ar ? "تنظيم جهد AVR وموجة جيبية محاكاة. موديل 3000VA LCD ينتقل عادةً خلال 4–8ms، وبحد أقصى 13ms." : "AVR voltage regulation and simulated sine wave output. The 3000VA LCD model typically transfers in 4–8ms, with a 13ms maximum."}</p></article></div></section>
    <section className="energy-closing"><div className="energy-wrap"><span className="energy-eyebrow">MUST × BlueStorm / {ar ? "أفق البصرة" : "UFUK AL-BASRA"}</span><h2>{ar ? "لنصمّم اختيارك على قياس احتياجك." : "Let’s match the system to your needs."}</h2><p>{ar ? "أخبرنا بالأجهزة، قدرتها ومدة الإسناد المطلوبة. نساعدك في اختيار العاكس والبطاريات أو UPS المناسب." : "Tell us about your equipment, its power requirements and the backup time you need. We can help you select an inverter, batteries or UPS."}</p><Link className="energy-button" to="/quote">{ar ? "اطلب عرض سعر لمنظومتك" : "Request a system quote"}<Arrow size={18} aria-hidden="true" /></Link></div></section>
    <p className="energy-source energy-wrap">{ar ? "مواصفات الموديلات الموثقة مأخوذة من ملفات الشركة المصنّعة، ومواصفات موديل 300Ah من بيانات المنتج في المتجر. داتا شيت غير متاحة لكل الموديلات. يعتمد التوافق وزمن الإسناد على تصميم المنظومة والحمل الفعلي." : "Documented model specifications come from manufacturer datasheets; 300Ah model details come from the catalog listing. Not every model has a datasheet. Compatibility and runtime depend on system design and actual load."}</p>
  </div>;
}

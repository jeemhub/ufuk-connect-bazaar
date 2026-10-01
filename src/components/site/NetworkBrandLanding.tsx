import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowRight, Cable, ChevronDown, Network, Radio, Router, Search, Server, SlidersHorizontal, Wifi, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Seo, SITE_NAME } from "@/components/seo/Seo";
import { ProductCard } from "@/components/site/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { useLanguage } from "@/i18n/LanguageContext";
import { groupNetworkBrandProducts, networkBrandGroups, type NetworkBrand } from "@/lib/networkBrandCatalog";
import { normalizeSearchText, searchTokens } from "@/lib/search";
import "./network-brand.css";

const brandDetails = {
  mikrotik: {
    name: "MikroTik", image: "/images/mikrotik/campaign.webp", path: "/mikrotik",
    hero: { ar: <>شبكتك،<br />بكل إمكاناتها.</>, en: <>A network<br />built to adapt.</> },
    lead: { ar: "راوترات وسويتشات وتغطية لاسلكية وربط بين المواقع. استكشف أجهزة MikroTik الموجودة في كتالوج أفق البصرة، ثم افتح الموديل الذي يناسبك.", en: "Routers, switches, wireless coverage and links between sites. Explore the MikroTik devices in our catalog, then open the model that fits your project." },
    intro: { ar: "اختر الدور، ثم الجهاز.", en: "Choose the role, then the device." },
    introText: { ar: "رتبنا الأجهزة بحسب وظيفتها في الشبكة. يمكنك تصفح كل فئة أو البحث عن اسم موديل محدد.", en: "Devices are organized by their role in a network. Browse a category or search for a specific model." },
    closing: { ar: "دعنا نختار البنية المناسبة لمشروعك.", en: "Let's choose the right network setup." },
    closingText: { ar: "أخبرنا بعدد المستخدمين ونوع الربط والموقع، وسنساعدك في تحديد أجهزة MikroTik الملائمة.", en: "Tell us about your users, links and site; we can help identify the MikroTik devices that fit." },
    seo: { ar: "حلول MikroTik للشبكات", en: "MikroTik network solutions" },
    description: { ar: "تصفح راوترات وسويتشات MikroTik وأجهزة Wi‑Fi والربط اللاسلكي الخارجي المتوفرة في كتالوج أفق البصرة.", en: "Explore MikroTik routers, switches, Wi-Fi devices and outdoor wireless equipment available at UFUK AL-Basra." },
  },
  huawei: {
    name: "Huawei", image: "/images/huawei/campaign.webp", path: "/huawei",
    hero: { ar: <>بوابة وسويتش.<br />وتغطية.</>, en: <>Gateway. Switch.<br />Coverage.</> },
    lead: { ar: "بوابات، سويتشات، نقاط وصول، أجهزة ONT ووحدات ضوئية. استعرض تشكيلة Huawei المتوفرة في موقع أفق البصرة حسب وظيفة كل جهاز.", en: "Gateways, switches, access points, ONTs and optical modules. Explore the Huawei range in our live catalog by device role." },
    intro: { ar: "من بوابة الدخول إلى آخر نقطة وصول.", en: "From gateway to the last access point." },
    introText: { ar: "ابحث في المنتجات المتوفرة أو انتقل إلى الفئة التي تحتاجها؛ تفاصيل كل موديل وسعره في صفحة المنتج.", en: "Search available products or jump to the role you need; each product page has model details and its price." },
    closing: { ar: "جهّز شبكة موقعك كوحدة متكاملة.", en: "Build your site as one connected network." },
    closingText: { ar: "شاركنا عدد نقاط الشبكة، متطلبات PoE وتغطية Wi‑Fi والربط الضوئي لنقترح التشكيلة المناسبة.", en: "Share your network port count, PoE needs, Wi-Fi coverage and optical links so we can suggest a suitable lineup." },
    seo: { ar: "حلول Huawei للشبكات والفايبر", en: "Huawei network and fiber solutions" },
    description: { ar: "تصفح سويتشات ونقاط وصول وبوابات Huawei eKit وأجهزة ONT ووحدات SFP المتوفرة في أفق البصرة.", en: "Explore Huawei eKit switches, access points, gateways, ONTs and SFP modules available at UFUK AL-Basra." },
  },
} as const;

const groupIcons: Record<string, LucideIcon> = {
  routing: Router, switching: Network, wifi: Wifi, wireless: Radio, modules: Cable,
  gateways: Router, switches: Network, access: Wifi, controllers: SlidersHorizontal, optics: Server,
};

export function NetworkBrandLanding({ brand }: { brand: NetworkBrand }) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const content = brandDetails[brand];
  const categories = networkBrandGroups[brand];
  const { products, loading, error } = useProducts({ activeOnly: true });
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const groups = useMemo(() => groupNetworkBrandProducts(products, brand), [products, brand]);
  const tokens = useMemo(() => searchTokens(query), [query]);
  const results = useMemo(() => Object.fromEntries(categories.map(category => [category.id,
    groups[category.id].filter(product => {
      const haystack = normalizeSearchText(`${product.nameAr} ${product.nameEn} ${product.sku} ${product.subcategory}`);
      return tokens.every(token => haystack.includes(token));
    }),
  ])) as Record<string, typeof products>, [categories, groups, tokens]);
  const total = categories.reduce((count, category) => count + groups[category.id].length, 0);
  const resultCount = categories.reduce((count, category) => count + results[category.id].length, 0);

  return <main className={`network-brand-page network-brand-${brand}`} dir={ar ? "rtl" : "ltr"}>
    <Seo title={`${content.seo[lang]} | ${SITE_NAME}`} description={content.description[lang]} path={content.path} image={content.image} lang={lang} />

    <section className="network-brand-hero" dir="ltr" aria-labelledby={`${brand}-title`}>
      <img src={content.image} alt={ar ? `عرض توضيحي لمعدات ${content.name} للشبكات` : `Illustrative ${content.name} network hardware`} width="1672" height="941" fetchPriority="high" />
      <div className="network-brand-hero-shade" aria-hidden="true" />
      <div className="network-brand-hero-copy" dir={ar ? "rtl" : "ltr"}>
        <span className="network-brand-name" dir="ltr">{content.name}{brand === "huawei" && <small>eKit</small>}</span>
        <h1 id={`${brand}-title`}>{content.hero[lang]}</h1>
        <p>{content.lead[lang]}</p>
        <a href="#network-brand-products" className="network-brand-button">{ar ? "تصفح المنتجات" : "Browse products"}<ArrowDown size={18} aria-hidden="true" /></a>
      </div>
    </section>

    <section className="network-brand-overview" aria-labelledby={`${brand}-overview-title`}><div className="network-brand-inner">
      <div className="network-brand-overview-copy"><div><span className="network-brand-caption">{brand === "huawei" ? "HUAWEI eKIT" : "MIKROTIK"} / UFUK AL-BASRA</span><h2 id={`${brand}-overview-title`}>{content.intro[lang]}</h2></div><div><p>{content.introText[lang]}</p><strong className="network-brand-count" aria-live="polite">{loading ? "…" : total}<small>{ar ? "منتج في التشكيلة" : "products in the range"}</small></strong></div></div>
      <nav className="network-brand-nav" aria-label={ar ? `فئات ${content.name}` : `${content.name} product categories`}>{categories.map(category => { const Icon = groupIcons[category.id]; return <a href={`#${brand}-${category.id}`} key={category.id}><Icon size={25} strokeWidth={1.5} aria-hidden="true" /><span>{category.title[lang]}</span><small>{loading ? "—" : groups[category.id].length}</small><Arrow size={16} aria-hidden="true" /></a>; })}</nav>
    </div></section>

    <section id="network-brand-products" className="network-brand-products" aria-labelledby={`${brand}-products-title`}><div className="network-brand-inner">
      <header className="network-brand-toolbar"><div><span className="network-brand-caption">LIVE PRODUCT CATALOG</span><h2 id={`${brand}-products-title`}>{ar ? `منتجات ${content.name}` : `${content.name} products`}</h2><p>{ar ? "تظهر المنتجات من الكتالوج الحالي، وتتحدث عند إضافة موديلات جديدة." : "Products are pulled from the live catalog and update as new models are added."}</p></div><label className="network-brand-search"><Search size={19} aria-hidden="true" /><span className="sr-only">{ar ? `ابحث في منتجات ${content.name}` : `Search ${content.name} products`}</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={ar ? "اسم المنتج أو رقم الموديل..." : "Product name or model..."} />{query && <button type="button" onClick={() => setQuery("")} aria-label={ar ? "مسح البحث" : "Clear search"}><X size={17} /></button>}</label></header>
      {query && <p className="network-brand-result" role="status">{ar ? `${resultCount} نتيجة لـ «${query}»` : `${resultCount} results for “${query}”`}</p>}
      {loading && <div className="network-brand-state" role="status">{ar ? "جارٍ تحميل المنتجات..." : "Loading products..."}</div>}
      {error && <div className="network-brand-state" role="alert">{ar ? "تعذر تحميل المنتجات. حاول تحديث الصفحة." : "Could not load products. Please refresh the page."}</div>}
      {!loading && !error && resultCount === 0 && <div className="network-brand-state" role="status">{ar ? "لا توجد نتائج مطابقة. جرّب اسمًا أو موديلًا آخر." : "No matching products. Try another name or model."}</div>}
      {!loading && !error && categories.map(category => { const matched = results[category.id]; if (!matched.length) return null; const Icon = groupIcons[category.id]; const showAll = !!query || expanded.includes(category.id); const visible = showAll ? matched : matched.slice(0, 8); return <section className="network-brand-group" id={`${brand}-${category.id}`} key={category.id} aria-labelledby={`${brand}-${category.id}-title`}><header><span className="network-brand-group-icon"><Icon size={28} strokeWidth={1.5} aria-hidden="true" /></span><div className="network-brand-group-copy"><span className="network-brand-caption">{category.code}</span><h3 id={`${brand}-${category.id}-title`}>{category.title[lang]}</h3><p>{category.description[lang]}</p></div><span className="network-brand-group-count">{matched.length}<small>{ar ? "منتج" : "products"}</small></span></header><div className="network-brand-grid">{visible.map(product => <ProductCard key={product.id} product={product} imageFit="contain" />)}</div>{!showAll && matched.length > 8 && <button type="button" className="network-brand-more" onClick={() => setExpanded(previous => [...previous, category.id])}>{ar ? `عرض كل منتجات ${category.title.ar} (${matched.length})` : `View all ${category.title.en} (${matched.length})`}<ChevronDown size={18} aria-hidden="true" /></button>}</section>; })}
    </div></section>

    <section className="network-brand-end"><div className="network-brand-inner"><span className="network-brand-caption">{content.name.toUpperCase()} × UFUK AL-BASRA</span><h2>{content.closing[lang]}</h2><p>{content.closingText[lang]}</p><Link className="network-brand-button" to="/quote">{ar ? "اطلب عرض سعر" : "Request a quote"}<Arrow size={18} aria-hidden="true" /></Link><small>{ar ? "صورة القسم توضيحية؛ صور ومواصفات كل موديل في صفحة المنتج." : "Campaign artwork is illustrative; model images and details are on each product page."}</small></div></section>
  </main>;
}

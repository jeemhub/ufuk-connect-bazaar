import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowRight, Cable, ChevronDown, CircleDot, Gauge, Network, Search, Wrench, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";
import { Seo, SITE_NAME } from "@/components/seo/Seo";
import { useProducts } from "@/hooks/useProducts";
import { useLanguage } from "@/i18n/LanguageContext";
import { fiberCategories, groupFiberProducts, type FiberCategoryId } from "@/lib/fiberCatalog";
import { normalizeSearchText, searchTokens } from "@/lib/search";
import "@/components/site/fiber-optic.css";

const icons: Record<FiberCategoryId, LucideIcon> = {
  cables: Cable,
  patch: CircleDot,
  termination: Network,
  optics: Gauge,
  equipment: Network,
  tools: Wrench,
};

export default function FiberOptic() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const { products, loading, error } = useProducts({ activeOnly: true });
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<FiberCategoryId[]>([]);
  const groups = useMemo(() => groupFiberProducts(products), [products]);
  const tokens = useMemo(() => searchTokens(query), [query]);
  const filtered = useMemo(() => Object.fromEntries(fiberCategories.map(category => [
    category.id,
    groups[category.id].filter(product => {
      const text = normalizeSearchText(`${product.nameAr} ${product.nameEn} ${product.sku} ${product.brand} ${product.subcategory}`);
      return tokens.every(token => text.includes(token));
    }),
  ])) as Record<FiberCategoryId, typeof products>, [groups, tokens]);
  const total = fiberCategories.reduce((sum, category) => sum + groups[category.id].length, 0);
  const resultCount = fiberCategories.reduce((sum, category) => sum + filtered[category.id].length, 0);

  return <main className="fiber-page" dir={ar ? "rtl" : "ltr"}>
    <Seo title={`${ar ? "حلول الفايبر والألياف الضوئية" : "Optical fiber solutions"} | ${SITE_NAME}`}
      description={ar ? "كيابل فايبر، باتش كورد، ODF، سبليترات، وحدات SFP، أجهزة ONT ومعدات فحص ولحام الألياف الضوئية من كتالوج أفق البصرة." : "Shop fiber cables, patch cords, ODFs, splitters, SFP modules, ONT devices, and fiber testing and splicing tools at UFUK AL-Basra."}
      path="/fiber-optic" image="/images/fiber/campaign.webp" lang={lang} />

    <section className="fiber-hero" dir="ltr" aria-labelledby="fiber-title">
      <img className="fiber-hero-image" src="/images/fiber/campaign.webp" alt={ar ? "عرض توضيحي لمعدات الألياف الضوئية" : "Illustrative display of optical fiber equipment"} width="1672" height="941" fetchPriority="high" />
      <div className="fiber-hero-shade" aria-hidden="true" />
      <div className="fiber-hero-copy" dir={ar ? "rtl" : "ltr"}>
        <span className="fiber-eyebrow">OPTICAL FIBER / UFUK AL-BASRA</span>
        <h1 id="fiber-title">{ar ? <>كل ما يلزم<br /><em>لوصلة أبعد.</em></> : <>Everything for<br /><em>a longer connection.</em></>}</h1>
        <p>{ar ? "من أول متر كيبل إلى آخر منفذ ضوئي. مجموعة واسعة من المنتجات الموجودة في كتالوجنا، مرتبة حسب دورها في الشبكة." : "From the first meter of cable to the final optical port. Explore our live catalog, organized by each product's role in the network."}</p>
        <a href="#fiber-range" className="fiber-primary-button">{ar ? "تصفح المجموعة" : "Browse the range"}<ArrowDown size={18} aria-hidden="true" /></a>
      </div>
      <div className="fiber-hero-index" aria-hidden="true">01 — 06 <span>FIBER SOLUTIONS</span></div>
    </section>

    <section className="fiber-intro" aria-labelledby="fiber-intro-title">
      <div className="fiber-container">
        <div className="fiber-intro-heading"><span className="fiber-kicker">THE COMPLETE LINK</span><h2 id="fiber-intro-title">{ar ? <>حلول لكل مرحلة<br />في مسار الإشارة.</> : <>A solution for every stage<br />of the signal path.</>}</h2></div>
        <div className="fiber-intro-aside"><p>{ar ? "ابدأ بالكيبل، ثم اختر الوصلات ووسائل التوزيع والوحدات المناسبة، وأكملها بأدوات الفحص. اضغط على أي منتج لعرض صوره وتفاصيله وسعره الحالي." : "Start with cable, choose the connections, distribution and modules that fit, then finish with test tools. Open any product for images, details and its current price."}</p><span className="fiber-live-count" aria-live="polite">{loading ? "…" : total}<small>{ar ? "منتج ضمن المجموعة" : "products in the range"}</small></span></div>
        <nav className="fiber-path" aria-label={ar ? "فئات منتجات الفايبر" : "Fiber product categories"}>{fiberCategories.map(category => {
          const Icon = icons[category.id];
          return <a href={`#fiber-${category.id}`} key={category.id}><span className="fiber-path-icon"><Icon size={23} strokeWidth={1.6} aria-hidden="true" /></span><span className="fiber-path-number">{category.number} / {category.code}</span><strong>{category.title[lang]}</strong><span className="fiber-path-count">{loading ? "—" : groups[category.id].length}</span></a>;
        })}</nav>
      </div>
    </section>

    <div className="fiber-range" id="fiber-range">
      <div className="fiber-container">
        <div className="fiber-range-toolbar">
          <div><span className="fiber-kicker">EXPLORE THE CATALOG</span><h2>{ar ? "منتجات الفايبر" : "Fiber products"}</h2><p>{ar ? "المنتجات أدناه من الكتالوج المباشر، وتتحدث عند إضافة منتجات جديدة." : "Products below come from the live catalog and update as new items are added."}</p></div>
          <label className="fiber-search"><Search size={19} aria-hidden="true" /><span className="sr-only">{ar ? "ابحث عن منتج فايبر" : "Search fiber products"}</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder={ar ? "ابحث باسم المنتج أو الموديل..." : "Search product name or model..."} type="search" />{query && <button type="button" onClick={() => setQuery("")} aria-label={ar ? "مسح البحث" : "Clear search"}><X size={17} /></button>}</label>
        </div>
        {query && <p className="fiber-search-result" role="status">{ar ? `${resultCount} نتيجة لـ «${query}»` : `${resultCount} results for “${query}”`}</p>}
        {error && <div className="fiber-state" role="alert">{ar ? "تعذر تحميل المنتجات حاليًا. حاول تحديث الصفحة." : "Products could not be loaded. Please refresh the page."}</div>}
        {loading && <div className="fiber-state" role="status">{ar ? "جارٍ تحميل المنتجات..." : "Loading products..."}</div>}
        {!loading && !error && resultCount === 0 && <div className="fiber-state" role="status">{ar ? "لم نعثر على منتج مطابق. جرّب اسمًا أو موديلًا مختلفًا." : "No matching products. Try another name or model."}</div>}
        {!loading && !error && fiberCategories.map(category => {
          const matches = filtered[category.id];
          if (matches.length === 0) return null;
          const Icon = icons[category.id];
          const showAll = Boolean(query) || expanded.includes(category.id);
          const visible = showAll ? matches : matches.slice(0, 8);
          return <section className="fiber-group" id={`fiber-${category.id}`} key={category.id} aria-labelledby={`fiber-${category.id}-title`}>
            <header className="fiber-group-heading"><div className="fiber-group-symbol"><Icon size={28} strokeWidth={1.4} aria-hidden="true" /></div><div className="fiber-group-title"><span className="fiber-kicker">{category.number} / {category.code}</span><h3 id={`fiber-${category.id}-title`}>{category.title[lang]}</h3><p>{category.description[lang]}</p></div><span className="fiber-group-total">{matches.length}<small>{ar ? "منتج" : "products"}</small></span></header>
            <div className="fiber-product-grid">{visible.map(product => <ProductCard key={product.id} product={product} imageFit="contain" />)}</div>
            {!showAll && matches.length > 8 && <button type="button" className="fiber-more" onClick={() => setExpanded(previous => [...previous, category.id])}>{ar ? `عرض كل منتجات ${category.title.ar} (${matches.length})` : `View all ${category.title.en} (${matches.length})`}<ChevronDown size={18} aria-hidden="true" /></button>}
          </section>;
        })}
      </div>
    </div>

    <section className="fiber-ending"><div className="fiber-container"><span className="fiber-kicker">FIBER × UFUK AL-BASRA</span><h2>{ar ? "نبني الرابط من البداية للنهاية." : "Build the link from end to end."}</h2><p>{ar ? "هل تحتاج إلى مطابقة نوع الكيبل والموصلات والوحدات مع مشروعك؟ شاركنا المتطلبات لنساعدك في اختيار التشكيلة المناسبة." : "Need to match cable, connectors and modules to your project? Share your requirements and we will help choose the right combination."}</p><Link className="fiber-primary-button" to="/quote">{ar ? "اطلب عرض سعر" : "Request a quote"}<Arrow size={18} aria-hidden="true" /></Link><small>{ar ? "الصورة الرئيسية توضيحية، وتفاصيل كل منتج تُعرض في صفحته." : "Hero artwork is illustrative; each product's details appear on its own page."}</small></div></section>
  </main>;
}

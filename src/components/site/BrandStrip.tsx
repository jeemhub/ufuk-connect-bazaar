import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, Package } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBrands } from "@/hooks/useBrands";
import type { Product } from "@/data/mockData";
import { optimizedImage, optimizedSrcSet } from "@/lib/img";
import "./brand-gallery.css";

type BrandItem = { id: string; name: string; logo_url: string | null; description?: string | null };
type BrandStory = { ar: string; en: string; fieldAr: string; fieldEn: string; productId: string };

const fallbackBrands: BrandItem[] = [
  { id: "fallback-mikrotik", name: "MikroTik", logo_url: null },
  { id: "fallback-ruijie", name: "Ruijie", logo_url: null },
  { id: "fallback-must", name: "Must", logo_url: null },
  { id: "fallback-ubiquiti", name: "Ubiquiti", logo_url: null },
  { id: "fallback-tp-link", name: "TP-Link", logo_url: null },
  { id: "fallback-blue-storm", name: "Blue Storm", logo_url: null },
  { id: "fallback-huawei", name: "Huawei", logo_url: null },
  { id: "fallback-fanvil", name: "Fanvil", logo_url: null },
];

const stories: Record<string, BrandStory> = {
  mikrotik: { ar: "راوترات وسويتشات تمنح الشبكة تحكمًا مرنًا من نقطة الاتصال إلى قلب البنية التحتية.", en: "Routers and switches for flexible control from the network edge to its core.", fieldAr: "البنية الشبكية", fieldEn: "NETWORK INFRASTRUCTURE", productId: "6aa61b02-e500-4c69-a7ee-fb896611da23" },
  ruijie: { ar: "حلول للشبكات المؤسسية تجمع السويتشات ونقاط الوصول والإدارة السحابية.", en: "Enterprise networking across switches, access points and cloud management.", fieldAr: "شبكات المؤسسات", fieldEn: "ENTERPRISE NETWORKING", productId: "c6a2aac6-7945-474b-8f0b-967a20f1a712" },
  must: { ar: "عواكس للطاقة الشمسية وبطاريات ليثيوم لتوليد الطاقة وتخزينها حسب حاجة المنظومة.", en: "Solar inverters and lithium batteries for energy conversion and storage.", fieldAr: "الطاقة والتخزين", fieldEn: "ENERGY & STORAGE", productId: "2cb4f5d3-d3e6-4836-8d11-14a96a1c0801" },
  ubiquiti: { ar: "معدات اتصال لاسلكي ونقاط وصول لبناء تغطية مستقرة للمواقع المختلفة.", en: "Wireless equipment and access points for dependable site coverage.", fieldAr: "الاتصال اللاسلكي", fieldEn: "WIRELESS CONNECTIVITY", productId: "2514ffaf-7273-4c36-ba31-c78c0e25fcf7" },
  tplink: { ar: "راوترات وسويتشات ونقاط وصول تناسب شبكات المنازل والأعمال.", en: "Routers, switches and access points for home and business networks.", fieldAr: "حلول الاتصال", fieldEn: "CONNECTIVITY", productId: "49017a9a-0c33-4160-a350-b4c1b18d05b6" },
  bluestorm: { ar: "كيابل وتجهيزات فايبر وأنظمة UPS تكمل البنية التقنية من التوصيل إلى إسناد الطاقة.", en: "Cabling, fiber accessories and UPS systems spanning connectivity to power backup.", fieldAr: "الشبكات وإسناد الطاقة", fieldEn: "CABLING & POWER BACKUP", productId: "131bcced-6c40-4eed-9483-689a60df04c0" },
  huawei: { ar: "راوترات وسويتشات وحلول فايبر لتجهيز شبكات الأعمال والاتصالات.", en: "Routers, switches and fiber solutions for business networks and connectivity.", fieldAr: "الشبكات والفايبر", fieldEn: "NETWORKING & FIBER", productId: "c60039ae-e7f4-4ddc-91b4-58892cd1dcb5" },
  fanvil: { ar: "هواتف IP للاتصالات المهنية ومكاتب خدمة العملاء.", en: "IP phones for professional communication and customer-facing teams.", fieldAr: "اتصالات IP", fieldEn: "IP COMMUNICATIONS", productId: "649beaa8-64aa-47d2-9e21-c450f90bcf14" },
};

const positions = [
  { x: 16, y: 22 }, { x: 38, y: 13 }, { x: 68, y: 16 }, { x: 86, y: 33 },
  { x: 86, y: 69 }, { x: 67, y: 84 }, { x: 34, y: 84 }, { x: 14, y: 66 },
];

const brandKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

function BrandVisual({ name, url }: { name: string; url: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!url || failedUrl === url) return <span className="brand-constellation-wordmark" dir="auto">{name}</span>;
  return <img src={optimizedImage(url, { width: 220 }) || url}
    srcSet={optimizedSrcSet(url, [120, 180, 220, 320])} sizes="(max-width: 700px) 68px, 110px"
    alt="" loading="lazy" decoding="async" width={120} height={56}
    onError={() => setFailedUrl(url)} />;
}

function ProductVisual({ product, lang }: { product: Product; lang: "ar" | "en" }) {
  const [failed, setFailed] = useState(false);
  const name = (lang === "ar" ? product.nameAr : product.nameEn) || product.nameData || product.nameEn;
  return failed ? <Package size={62} strokeWidth={1.2} aria-hidden="true" /> : <img src={optimizedImage(product.image, { width: 560 }) || product.image} alt={name} loading="lazy" decoding="async" width={360} height={280} onError={() => setFailed(true)} />;
}

export function BrandStrip({ products }: { products: Product[] }) {
  const { t, lang } = useLanguage();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const { brands, loading } = useBrands({ activeOnly: true });
  const displayBrands: BrandItem[] = (brands?.length ? brands : fallbackBrands).slice(0, 8);
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedIndex = Math.min(activeIndex, displayBrands.length - 1);
  const active = displayBrands[selectedIndex];
  const point = positions[selectedIndex];
  const story = stories[brandKey(active.name)];
  const representative = products.find(product => product.id === story?.productId)
    ?? products.find(product => brandKey(product.brand) === brandKey(active.name) && product.image);
  const description = story ? (ar ? story.ar : story.en)
    : active.description || (ar ? "اكتشف منتجات هذه العلامة ضمن كتالوج أفق البصرة." : "Explore this brand in the UFUK AL-Basra catalog.");
  const brandHref = `/products?brand=${encodeURIComponent(active.name)}`;
  const name = representative && ((ar ? representative.nameAr : representative.nameEn) || representative.nameData || representative.nameEn);

  return <section className="brand-constellation" aria-labelledby="brand-constellation-title" dir={ar ? "rtl" : "ltr"}>
    <div className="brand-constellation-inner">
      <div className="brand-constellation-header">
        <div><span className="brand-constellation-kicker"><span aria-hidden="true" />{ar ? "شبكة من الشركاء" : "A NETWORK OF PARTNERS"}</span><h2 id="brand-constellation-title">{t("trusted_brands")}</h2><p>{ar ? "اختر علامة لتكتشف دورها في منظومة أفق البصرة وأحد منتجاتها." : "Select a brand to see how it fits our solutions and explore a featured product."}</p></div>
        <Link to="/brands" className="brand-constellation-all">{t("view_all_brands")}<Arrow size={18} aria-hidden="true" /></Link>
      </div>

      <div className="brand-constellation-scene" aria-label={ar ? "مشهد العلامات التجارية" : "Connected brand scene"} aria-busy={loading}>
        <span className="brand-constellation-corner brand-constellation-corner-top" aria-hidden="true">UFUK / PARTNER NETWORK</span>
        <span className="brand-constellation-corner brand-constellation-corner-bottom" aria-hidden="true">01 — {String(displayBrands.length).padStart(2, "0")}</span>
        <svg className="brand-constellation-lines" viewBox="0 0 1000 560" preserveAspectRatio="none" aria-hidden="true">
          {displayBrands.map((brand, index) => <line key={brand.id} x1="500" y1="280" x2={positions[index].x * 10} y2={positions[index].y * 5.6} className="brand-constellation-line" />)}
          <line key={active.id} x1="500" y1="280" x2={point.x * 10} y2={point.y * 5.6} className="brand-constellation-line-active" />
          <circle cx={point.x * 10} cy={point.y * 5.6} r="5" className="brand-constellation-endpoint" />
        </svg>
        <div className="brand-constellation-hub"><span className="brand-constellation-hub-mark" aria-hidden="true">U</span><strong>{ar ? "أُفُق البصرة" : "UFUK AL-BASRA"}</strong><span>{ar ? "نربط الحلول" : "CONNECTING SOLUTIONS"}</span></div>
        {displayBrands.map((brand, index) => <button key={brand.id} type="button" className={`brand-constellation-node ${index === selectedIndex ? "is-active" : ""}`} style={{ "--node-x": `${positions[index].x}%`, "--node-y": `${positions[index].y}%`, "--node-index": index } as CSSProperties} aria-label={ar ? `اختر علامة ${brand.name}` : `Select ${brand.name}`} aria-pressed={index === selectedIndex} onClick={() => setActiveIndex(index)}><span className="brand-constellation-node-logo"><BrandVisual name={brand.name} url={brand.logo_url} /></span><span className="brand-constellation-node-name" dir="auto">{brand.name}</span></button>)}
      </div>

      <div className="brand-constellation-detail" key={active.id} aria-live="polite">
        <div className="brand-constellation-product-art">{representative ? <ProductVisual product={representative} lang={lang} /> : <span className="brand-constellation-product-placeholder"><Package size={46} strokeWidth={1.25} aria-hidden="true" /></span>}</div>
        <div className="brand-constellation-detail-copy">
          <span className="brand-constellation-field">{story ? (ar ? story.fieldAr : story.fieldEn) : (ar ? "علامة من شركائنا" : "OUR PARTNER")}</span>
          <h3 dir="auto">{active.name}</h3>
          <p>{description}</p>
          {representative && <span className="brand-constellation-product-name">{ar ? "منتج من العلامة:" : "Featured product:"} <bdi>{name}</bdi></span>}
          <div className="brand-constellation-actions">
            {representative && <Link className="brand-constellation-product-link" to={`/products/${representative.id}`}>{ar ? "شاهد المنتج" : "View product"}<Arrow size={17} aria-hidden="true" /></Link>}
            <Link className="brand-constellation-brand-link" to={brandHref}>{ar ? "كل منتجات العلامة" : "All brand products"}<ArrowUpRight size={17} aria-hidden="true" /></Link>
          </div>
        </div>
        <span className="brand-constellation-detail-count" aria-hidden="true">{String(selectedIndex + 1).padStart(2, "0")} / {String(displayBrands.length).padStart(2, "0")}</span>
      </div>
    </div>
  </section>;
}

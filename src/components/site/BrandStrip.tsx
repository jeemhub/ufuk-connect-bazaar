import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, ArrowUpRight, Pause, Play } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBrands } from "@/hooks/useBrands";
import { optimizedImage, optimizedSrcSet } from "@/lib/img";
import "./brand-gallery.css";

type BrandItem = { id: string; name: string; logo_url: string | null };

const fallbackBrands: BrandItem[] = [
  { id: "fallback-mikrotik", name: "MikroTik", logo_url: null },
  { id: "fallback-ruijie", name: "Ruijie", logo_url: null },
  { id: "fallback-must", name: "Must", logo_url: null },
  { id: "fallback-ubiquiti", name: "Ubiquiti", logo_url: null },
  { id: "fallback-tp-link", name: "TP-Link", logo_url: null },
];

function BrandVisual({ name, url }: { name: string; url: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!url || failedUrl === url) return <span className="brand-gallery-wordmark" dir="auto">{name}</span>;
  return <img src={optimizedImage(url, { width: 200 }) || url}
    srcSet={optimizedSrcSet(url, [120, 200, 320])} sizes="(max-width: 640px) 130px, 180px"
    alt={name} loading="lazy" decoding="async" width={180} height={64}
    onError={() => setFailedUrl(url)} />;
}

export function BrandStrip() {
  const { t, lang } = useLanguage();
  const ar = lang === "ar";
  const { brands, loading } = useBrands({ activeOnly: true });
  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  const moveLight = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse" || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--light-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--light-y", `${event.clientY - rect.top}px`);
  };
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const displayBrands: BrandItem[] = brands?.length ? brands : fallbackBrands;

  return <section ref={sectionRef} onPointerMove={moveLight} className={`brand-gallery ${inView ? "is-in-view" : ""} ${paused ? "is-paused" : ""}`} aria-labelledby="brand-gallery-title" dir={ar ? "rtl" : "ltr"}>
    <div className="brand-gallery-atmosphere" aria-hidden="true"><i /><i /><i /></div>
    <div className="brand-gallery-inner">
      <div className="brand-gallery-intro">
        <span className="brand-gallery-signature"><span aria-hidden="true" />{ar ? "عالم من الحلول" : "A world of solutions"}</span>
        <h2 id="brand-gallery-title">{t("trusted_brands")}</h2>
        <p>{ar ? "أسماء تعرفها. حلول تجمعها أفق البصرة لشبكتك ومشروعك." : "Names you know. Solutions brought together by UFUK AL-Basra for your network and project."}</p>
        <Link className="brand-gallery-all" to="/brands">{t("view_all_brands")}<Arrow size={18} aria-hidden="true" /></Link>
        <button type="button" className="brand-gallery-motion" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}{paused ? (ar ? "تشغيل الحركة" : "Play motion") : (ar ? "إيقاف الحركة" : "Pause motion")}</button><span className="brand-gallery-note">{ar ? "اختر علامة لاستكشاف منتجاتها" : "Choose a brand to explore its products"}</span>
      </div>
      <div className="brand-gallery-wall" aria-busy={loading}>
        {loading ? <><span className="sr-only" role="status">{ar ? "جارٍ تحميل العلامات" : "Loading brands"}</span>{Array.from({ length: 8 }, (_, i) => <div className="brand-gallery-placeholder" key={i} />)}</> : (expanded ? displayBrands : displayBrands.slice(0, 12)).map((brand, index) =>
          <div className="brand-gallery-slot" key={brand.id} style={{ "--brand-index": index % 12 } as CSSProperties}><Link className="brand-gallery-tile" to={`/products?brand=${encodeURIComponent(brand.name)}`} aria-label={ar ? `استكشف منتجات ${brand.name}` : `Explore ${brand.name} products`}>
            <div className="brand-gallery-logo"><BrandVisual name={brand.name} url={brand.logo_url} /></div>
            <div className="brand-gallery-tile-foot"><span dir="auto">{brand.name}</span><ArrowUpRight size={16} aria-hidden="true" /></div>
          </Link></div>
        )}
        {!loading && displayBrands.length > 12 && <button type="button" className="brand-gallery-expand" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? (ar ? "عرض مختصر" : "Show fewer") : (ar ? `استكشف بقية العلامات (${displayBrands.length - 12})` : `Explore more brands (${displayBrands.length - 12})`)}<Arrow size={17} aria-hidden="true" /></button>}
      </div>
    </div>
  </section>;
}

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
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
  return <img src={optimizedImage(url, { width: 520 }) || url}
    srcSet={optimizedSrcSet(url, [220, 360, 520, 720])} sizes="(max-width: 640px) 220px, 420px"
    alt={name} loading="lazy" decoding="async" width={420} height={150}
    onError={() => setFailedUrl(url)} />;
}

export function BrandStrip() {
  const { t, lang } = useLanguage();
  const ar = lang === "ar";
  const { brands, loading } = useBrands({ activeOnly: true });
  const displayBrands: BrandItem[] = brands?.length ? brands : fallbackBrands;
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const visibleBrands = expanded ? displayBrands : displayBrands.slice(0, 8);
  const cycleLength = visibleBrands.length;
  const safeIndex = Math.min(activeIndex, cycleLength - 1);
  const active = visibleBrands[safeIndex];
  const Previous = ar ? ArrowRight : ArrowLeft;
  const Next = ar ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!inView || paused || reducedMotion || cycleLength < 2) return;
    const timer = window.setInterval(() => setActiveIndex(index => (index + 1) % cycleLength), 4800);
    return () => window.clearInterval(timer);
  }, [inView, paused, reducedMotion, cycleLength, activeIndex]);

  const move = (step: number) => setActiveIndex(index => (index + step + cycleLength) % cycleLength);

  return <section ref={sectionRef} className="brand-gallery" aria-labelledby="brand-gallery-title" dir={ar ? "rtl" : "ltr"}>
    <div className="brand-gallery-inner">
      <div className="brand-gallery-header">
        <div><span className="brand-gallery-kicker"><span />{ar ? "شركاء الحلول" : "SOLUTION PARTNERS"}</span><h2 id="brand-gallery-title">{t("trusted_brands")}</h2><p>{ar ? "استكشف العلامات التي تساعدنا على بناء حلول متكاملة لكل مشروع." : "Explore the brands behind the connected solutions we build for every project."}</p></div>
        <Link className="brand-gallery-all" to="/brands">{t("view_all_brands")}<Next size={18} aria-hidden="true" /></Link>
      </div>

      <div className="brand-gallery-experience" aria-busy={loading}>
        <div className="brand-gallery-stage">
          <div className="brand-gallery-rings" aria-hidden="true"><i /><i /><i /></div>
          <span className="brand-gallery-stage-label">UFUK AL-BASRA <span>×</span> {active.name}</span>
          <Link key={active.id} className="brand-gallery-hero-link" to={`/products?brand=${encodeURIComponent(active.name)}`} aria-label={ar ? `استكشف منتجات ${active.name}` : `Explore ${active.name} products`}>
            <BrandVisual name={active.name} url={active.logo_url} />
            <span className="brand-gallery-open"><span>{ar ? "استكشف المنتجات" : "Explore products"}</span><ArrowUpRight size={18} aria-hidden="true" /></span>
          </Link>
          <div className="brand-gallery-stage-footer"><span className="brand-gallery-counter"><bdi>{String(safeIndex + 1).padStart(2, "0")}</bdi><span>/</span><bdi>{String(cycleLength).padStart(2, "0")}</bdi></span><span className="brand-gallery-progress" key={`${active.id}-${paused}-${inView}`}><i style={{ animationPlayState: paused || !inView || reducedMotion ? "paused" : "running" }} /></span><div className="brand-gallery-controls"><button type="button" onClick={() => move(-1)} aria-label={ar ? "العلامة السابقة" : "Previous brand"}><Previous size={18} /></button><button type="button" onClick={() => move(1)} aria-label={ar ? "العلامة التالية" : "Next brand"}><Next size={18} /></button><button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? (ar ? "تشغيل التنقل التلقائي" : "Resume autoplay") : (ar ? "إيقاف التنقل التلقائي" : "Pause autoplay")} aria-pressed={paused}>{paused ? <Play size={16} /> : <Pause size={16} />}</button></div></div>
        </div>

        <div className="brand-gallery-index" aria-label={ar ? "اختر علامة تجارية" : "Choose a brand"}>
          <div className="brand-gallery-index-title"><span>{ar ? "تصفّح العلامات" : "EXPLORE BRANDS"}</span><span>{String(displayBrands.length).padStart(2, "0")}</span></div>
          <div className="brand-gallery-list">{visibleBrands.map((brand, index) => <button type="button" key={brand.id} className="brand-gallery-list-item" aria-pressed={index === safeIndex} onClick={() => setActiveIndex(index)}><span className="brand-gallery-list-number">{String(index + 1).padStart(2, "0")}</span><span dir="auto">{brand.name}</span><ArrowUpRight size={16} aria-hidden="true" /></button>)}</div>
          {!loading && displayBrands.length > 8 && <button type="button" className="brand-gallery-expand" aria-expanded={expanded} onClick={() => { setExpanded(value => !value); setActiveIndex(0); }}>{expanded ? (ar ? "عرض أقل" : "Show fewer") : (ar ? `عرض كل العلامات (${displayBrands.length})` : `View all brands (${displayBrands.length})`)}<Next size={17} aria-hidden="true" /></button>}
        </div>
      </div>
    </div>
  </section>;
}

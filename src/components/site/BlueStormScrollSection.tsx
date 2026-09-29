import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const BlueStormScene = lazy(() => import("./BlueStormScene"));

const copy = {
  ar: [
    { title: "بكرة BlueStorm", body: "خشب طبيعي، لفّات كيبل متراصة، وتفاصيل يمكن استكشافها عن قرب." },
    { title: "اسحب الكيبل", body: "مع التمرير، ينفك الكيبل من البكرة ويتمايل أثناء سحبه." },
    { title: "داخل الكيبل", body: "اقترب من نهاية الكيبل المكشوفة وشاهد الأزواج الأربعة الملتفة وطبقات التدريع." },
  ],
  en: [
    { title: "The BlueStorm reel", body: "Natural wood, tightly wound cable, and details worth a closer look." },
    { title: "Pull the cable", body: "Scroll to unwind the cable and follow its movement." },
    { title: "Inside the cable", body: "Explore the four twisted pairs and shielding layers at the exposed cable end." },
  ],
};

export function BlueStormScrollSection() {
  const { lang } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [stage, setStage] = useState(0);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const stages = copy[lang];
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reducedMotion) return;
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: "450px 0px",
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const distance = Math.max(1, rect.height - window.innerHeight);
      const value = Math.min(1, Math.max(0, -rect.top / distance));
      progress.current = value;
      setStage(value < 0.32 ? 0 : value < 0.68 ? 1 : 2);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [reducedMotion]);

  const handleReady = useCallback(() => setReady(true), []);
  const handleError = useCallback(() => setFailed(true), []);

  if (reducedMotion) {
    return (
      <section ref={sectionRef} aria-label="BlueStorm LAN" className="bg-[#081d3b] px-5 py-16 text-white md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2">
          <img src="/models/bluestorm-lan-reel.png" alt={lang === "ar" ? "بكرة كيبل BlueStorm مع نهاية كيبل مكشوفة" : "BlueStorm cable reel with exposed cable end"} className="mx-auto w-full max-w-xl" loading="lazy" />
          <div>
            <p className="mb-4 text-sm font-semibold text-[#9cc7f6]">BlueStorm LAN</p>
            <h2 id="bluestorm-title" className="text-4xl font-bold leading-tight md:text-5xl">{stages[0].title}</h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-[#c3d2e6]">{stages[0].body}</p>
            <Link to="/products?category=networking" className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              {lang === "ar" ? "تصفح تجهيزات الشبكات" : "Browse networking equipment"}<Arrow size={18} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} aria-label="BlueStorm LAN" className="relative h-[290svh] bg-[#081d3b] text-white">
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-[#081d3b]">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_35%_45%,#173b68_0%,#081d3b_58%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/15" />

        <div aria-hidden className={`pointer-events-none absolute top-[14%] h-[55%] w-full md:top-[3%] md:h-[93%] md:w-[67%] ${lang === "ar" ? "md:left-0" : "md:right-0"}`}>
          <img
            src="/models/bluestorm-lan-reel.png"
            alt=""
            className={`absolute inset-0 h-full w-full object-contain ${ready && !failed ? "opacity-0" : "opacity-100"}`}
            loading="lazy"
          />
          {near && !failed && (
            <Suspense fallback={null}>
              <BlueStormScene progress={progress} onReady={handleReady} onError={handleError} />
            </Suspense>
          )}
        </div>

        <div className={`absolute bottom-[12%] z-10 w-full px-6 md:bottom-auto md:top-[27%] md:w-[31%] md:px-0 ${lang === "ar" ? "md:right-[8%]" : "md:left-[8%]"}`}>
          <div className="mb-5 inline-flex items-center gap-3 text-sm font-semibold text-[#9cc7f6]">
            <span className="h-px w-8 bg-[#9cc7f6]" />BlueStorm LAN
          </div>
          <div className="relative min-h-[154px] md:min-h-[220px]" aria-live="polite">
            <div key={stage} className="animate-fade-in-up">
              <h2 id={stage === 0 ? "bluestorm-title" : undefined} className="text-3xl font-bold leading-[1.18] sm:text-4xl md:text-5xl xl:text-6xl">{stages[stage].title}</h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[#c3d2e6] md:text-lg">{stages[stage].body}</p>
            </div>
          </div>
          <Link to="/products?category=networking" className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            {lang === "ar" ? "تصفح تجهيزات الشبكات" : "Browse networking equipment"}<Arrow size={17} />
          </Link>
        </div>

        <div className="absolute inset-x-6 bottom-6 z-10 flex items-center gap-3 md:inset-x-[8%] md:bottom-10">
          <span className="text-xs font-medium text-white/70">{lang === "ar" ? "مرّر لاستكشاف الموديل" : "Scroll to explore the model"}</span>
          <div aria-hidden className="ms-auto flex w-28 gap-1.5 sm:w-48">
            {stages.map((item, index) => <span key={item.title} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${index <= stage ? "bg-[#91c6ff]" : "bg-white/25"}`} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

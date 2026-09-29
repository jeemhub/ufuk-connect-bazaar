import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, MoveDownRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { useLanguage } from "@/i18n/LanguageContext";

const BlueStormScene = lazy(() => import("@/components/site/BlueStormScene"));
const poster = "/models/bluestorm-lan-reel.png";

export default function BlueStormExperience() {
  const { lang } = useLanguage();
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailed(true), []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(motion.matches);
    update();
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const element = section.current;
    if (!element || reducedMotion) return;
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "500px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (!active || reducedMotion) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const element = section.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const next = Math.min(1, Math.max(0, -rect.top / travel));
      progress.current = next;
      setChapter(next < 0.34 ? 0 : next < 0.72 ? 1 : 2);
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    return () => {
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      cancelAnimationFrame(frame);
    };
  }, [active, reducedMotion]);

  const stories = lang === "ar" ? [
    { number: "01", eyebrow: "البداية", title: "من البكرة تبدأ الحكاية.", body: "تعرّف على بكرة BlueStorm من كل زاوية. مرّر للأسفل لكشف الكيبل الملفوف داخلها." },
    { number: "02", eyebrow: "داخل البكرة", title: "كل لفة، بتفاصيلها.", body: "تتحرك الواجهة الأمامية لتظهر لفات الكيبل الأسود. حرّك الصفحة لتقترب من النهاية الحرة." },
    { number: "03", eyebrow: "عن قرب", title: "حتى آخر سن في RJ45.", body: "اقترب من الرأس الشفاف وشاهد نقاط التلامس الثماني والموصلات الملونة داخله." },
  ] : [
    { number: "01", eyebrow: "The beginning", title: "It starts at the reel.", body: "Meet the BlueStorm reel from every angle. Scroll to reveal the cable wound inside." },
    { number: "02", eyebrow: "Inside the reel", title: "Every turn in detail.", body: "The front flange opens to reveal the black cable. Keep scrolling toward its free end." },
    { number: "03", eyebrow: "Up close", title: "Down to the RJ45 contacts.", body: "Explore the clear plug, eight contact pins and colored conductors inside." },
  ];

  return (
    <>
      <Seo
        title={lang === "ar" ? "بكرة كيبل BlueStorm ثلاثية الأبعاد | أفق البصرة" : "BlueStorm Cable Reel in 3D | UFUK Al-Basra"}
        description={lang === "ar" ? "تجربة تفاعلية ثلاثية الأبعاد لبكرة كيبل BlueStorm وموصل RJ45 من أفق البصرة." : "Explore a BlueStorm LAN cable reel and RJ45 connector in an interactive 3D experience."}
        path="/experience/bluestorm-lan"
        image={poster}
      />
      {reducedMotion ? (
        <section className="bg-[#07152b] px-5 py-20 text-white md:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-300">BLUESTORM · LAN CABLE</p>
              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">{stories[0].title}</h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-slate-300">{stories[0].body} {stories[2].body}</p>
              <Link to="/products?category=networking" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-slate-950">
                {lang === "ar" ? "استعرض كيابل الشبكة" : "Browse network cables"}<Arrow size={18} />
              </Link>
            </div>
            <img src={poster} alt={lang === "ar" ? "تصور ثلاثي الأبعاد لبكرة كيبل BlueStorm ورأس RJ45" : "3D visualization of BlueStorm cable reel and RJ45 plug"} className="w-full" />
          </div>
        </section>
      ) : (
        <section ref={section} className="relative h-[340svh] bg-[#07152b] text-white" aria-label={lang === "ar" ? "تجربة بكرة BlueStorm ثلاثية الأبعاد" : "BlueStorm 3D reel experience"}>
          <div className="sticky top-0 h-svh overflow-hidden">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_60%_48%,#1d4774_0%,#0b2343_37%,#07152b_72%)]" />
            <div aria-hidden className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(147,197,253,.13)_1px,transparent_1px),linear-gradient(90deg,rgba(147,197,253,.13)_1px,transparent_1px)] [background-size:70px_70px]" />
            <div aria-hidden className="absolute end-[10%] top-[18%] h-[48vw] w-[48vw] rounded-full border border-white/5" />
            <div aria-hidden className="absolute end-[15%] top-[24%] h-[38vw] w-[38vw] rounded-full border border-white/5" />

            <img
              src={poster}
              alt=""
              aria-hidden
              className={`pointer-events-none absolute inset-0 mx-auto h-full max-h-[900px] w-full object-contain p-5 pt-24 transition-opacity duration-700 md:ms-[23%] md:w-[76%] ${ready ? "opacity-0" : "opacity-100"}`}
            />
            {active && !failed && (
              <Suspense fallback={null}>
                <BlueStormScene progress={progress} lang={lang as "ar" | "en"} onReady={onReady} onError={onError} />
              </Suspense>
            )}

            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 mx-auto flex max-w-7xl items-center justify-between px-5 pt-28 text-[11px] font-semibold tracking-[0.2em] text-sky-200/80 md:px-8 md:pt-32">
              <span>UFUK AL-BASRA / BLUESTORM</span>
              <span className="hidden md:inline">3D PRODUCT EXPERIENCE</span>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-[12%] z-10 mx-auto max-w-7xl px-5 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:px-8">
              <div className="relative h-56 max-w-[490px] md:h-80">
                {stories.map((story, index) => (
                  <div
                    key={story.number}
                    aria-hidden={chapter !== index}
                    className={`absolute inset-0 flex flex-col justify-end transition-all duration-500 md:justify-center ${chapter === index ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
                  >
                    <div className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.28em] text-sky-300">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-300/40">{story.number}</span>
                      {story.eyebrow}
                    </div>
                    <h1 className="max-w-[470px] text-balance text-3xl font-black leading-[1.14] drop-shadow-lg md:text-5xl lg:text-6xl">{story.title}</h1>
                    <p className="mt-4 max-w-[410px] text-sm leading-7 text-slate-200 drop-shadow md:text-base">{story.body}</p>
                    {index === 2 && (
                      <Link
                        to="/products?category=networking"
                        className="pointer-events-auto mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-sky-100"
                      >
                        {lang === "ar" ? "استعرض كيابل الشبكة" : "Browse network cables"}<Arrow size={17} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 mx-auto flex max-w-7xl items-center justify-between px-5 md:px-8">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <MoveDownRight size={17} />
                {lang === "ar" ? "مرّر لاستكشاف التفاصيل" : "Scroll to explore"}
              </div>
              <div className="flex gap-2" aria-hidden>
                {stories.map((story, index) => <span key={story.number} className={`h-1.5 rounded-full transition-all duration-300 ${index === chapter ? "w-8 bg-sky-300" : "w-1.5 bg-white/30"}`} />)}
              </div>
            </div>
          </div>
        </section>
      )}
      <section className="bg-slate-950 px-5 py-16 text-center text-white md:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-300">UFUK AL-BASRA</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black md:text-4xl">{lang === "ar" ? "الشبكات تبدأ من وصلة موثوقة." : "Reliable networks start with the connection."}</h2>
        <Link to="/products?category=networking" className="mt-7 inline-flex items-center gap-2 border-b border-sky-300 pb-1 text-sm font-bold text-sky-200 hover:text-white">
          {lang === "ar" ? "استكشف المنتجات" : "Explore products"}<Arrow size={16} />
        </Link>
      </section>
    </>
  );
}

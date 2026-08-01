import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Cable, ShieldCheck, Sun, Truck, Zap, Star, Sparkles, Award, Users, Wrench, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { categories } from "@/data/mockData";
import { ProductCard } from "@/components/site/ProductCard";
import { useEffect } from "react";
import { Seo, SITE_NAME } from "@/components/seo/Seo";
import { useProducts } from "@/hooks/useProducts";
import { HeroSlider } from "@/components/site/HeroSlider";
import { BrandStrip } from "@/components/site/BrandStrip";
import { useReveal } from "@/hooks/useReveal";
import { CountUp } from "@/components/site/CountUp";

const Home = () => {
  const { t, lang } = useLanguage();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const { products } = useProducts({ activeOnly: true });
  const featured = products.slice(0, 8);

  // reveal refs
  const catHead = useReveal<HTMLDivElement>();
  const catGrid = useReveal<HTMLDivElement>();
  const statsRef = useReveal<HTMLDivElement>();
  const featHead = useReveal<HTMLDivElement>();
  const featGrid = useReveal<HTMLDivElement>();
  const ctaRef = useReveal<HTMLDivElement>();

  useEffect(() => {
    document.title = `${t("brand")} — ${t("brand_tagline")}`;
    const desc = lang === "ar"
      ? "أُفُق البصرة: موزع معتمد لحلول MikroTik و Ruijie و Must — شبكات، طاقة شمسية، UPS في العراق."
      : "UFUK AL-Basra: Authorized distributor of MikroTik, Ruijie, Must — networking, solar, UPS in Iraq.";
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
    m.setAttribute("content", desc);
  }, [t, lang]);

  const catIcons: Record<string, any> = { networking: Cable, solar: Sun, ups: Zap, accessories: ShieldCheck };

  return (
    <>
      <Seo
        title={lang === "ar" ? "أُفُق البصرة | شبكات وطاقة شمسية و UPS في العراق" : "UFUK AL-Basra | Networking, Solar & UPS in Iraq"}
        description={
          lang === "ar"
            ? "أُفُق البصرة: موزع معتمد لحلول MikroTik و Ruijie و Must — معدات شبكات، منظومات طاقة شمسية، أنظمة UPS بأسعار الجملة والوكالة في العراق."
            : "UFUK AL-Basra: authorized distributor of MikroTik, Ruijie and Must — networking gear, solar systems and UPS with wholesale & dealer pricing in Iraq."
        }
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "UFUK AL-Basra",
          url: "https://ufukalbasra.com",
          email: "sales@ufukbasra.com.iq",
          telephone: "+964 771 699 2955",
          address: { "@type": "PostalAddress", addressCountry: "IQ", addressLocality: "Basra" },
        }}
      />
      {/* 1. Hero — light mode, rich background */}
      <section className="relative overflow-hidden bg-background text-foreground">
        {/* Soft animated blobs */}
        <div aria-hidden className="absolute -top-32 -start-32 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-3xl animate-blob" />
        <div aria-hidden className="absolute top-1/3 start-1/2 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-primary-glow/15 blur-3xl animate-blob [animation-delay:5s]" />
        <div aria-hidden className="absolute -bottom-40 -end-32 h-[30rem] w-[30rem] rounded-full bg-destructive/15 blur-3xl animate-blob [animation-delay:3s]" />

        {/* Subtle grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.6]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at center, black 35%, transparent 85%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 35%, transparent 85%)",
          }}
        />

        {/* Decorative side vectors (hidden on mobile) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
          {/* Left: networking/circuit lines */}
          <svg className="absolute start-0 top-1/2 h-[420px] w-[280px] -translate-y-1/2 text-primary/30" viewBox="0 0 280 420" fill="none">
            <path d="M10 60 H120 V140 H40 V260 H160 V340 H60" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M10 200 H80 V100 H180 V200 H260" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="120" cy="60" r="4" fill="currentColor" />
            <circle cx="40" cy="140" r="4" fill="currentColor" />
            <circle cx="160" cy="260" r="4" fill="currentColor" />
            <circle cx="180" cy="100" r="4" fill="currentColor" />
            <circle cx="260" cy="200" r="4" fill="currentColor" />
            <circle cx="60" cy="340" r="4" fill="currentColor" />
          </svg>
          {/* Right: sun / solar rays */}
          <svg className="absolute end-6 top-20 h-56 w-56 text-warning/40 animate-spin-slow" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="32" stroke="currentColor" strokeWidth="2" />
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i * 30 * Math.PI) / 180;
              const x1 = 100 + Math.cos(a) * 48;
              const y1 = 100 + Math.sin(a) * 48;
              const x2 = 100 + Math.cos(a) * 78;
              const y2 = 100 + Math.sin(a) * 78;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />;
            })}
          </svg>
          {/* Right-bottom: lightning bolt */}
          <svg className="absolute end-24 bottom-24 h-32 w-32 text-destructive/30 animate-float" viewBox="0 0 64 64" fill="currentColor">
            <path d="M34 2 L10 36 H28 L24 62 L54 24 H34 Z" />
          </svg>
          {/* Left-bottom: dotted arc */}
          <svg className="absolute start-16 bottom-16 h-40 w-40 text-primary/30 animate-float-slow" viewBox="0 0 160 160" fill="none">
            <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 8" />
            <circle cx="80" cy="80" r="45" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 6" />
          </svg>
        </div>

        {/* Floating icon chips */}
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
          <div className="absolute start-[8%] top-[18%] flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-card animate-float">
            <Cable className="h-6 w-6 text-primary" />
          </div>
          <div className="absolute end-[10%] top-[28%] flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-card animate-float-slow">
            <Sun className="h-6 w-6 text-warning" />
          </div>
          <div className="absolute start-[12%] bottom-[22%] flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-card animate-float [animation-delay:1.5s]">
            <Zap className="h-6 w-6 text-destructive" />
          </div>
          <div className="absolute end-[14%] bottom-[26%] flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-card animate-float-slow [animation-delay:2s]">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 py-20 text-center md:px-6 md:py-32 lg:py-40">
          <div className="mb-6 inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-border bg-card/80 px-5 py-2 text-sm font-semibold text-foreground shadow-sm backdrop-blur-md">
            <Sparkles className="h-4 w-4 animate-pulse text-primary" />
            {t("hero_eyebrow")}
          </div>
          <h1 className="text-balance text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl lg:text-[88px]">
            {lang === "ar" ? (
              <span className="bg-gradient-brand bg-clip-text text-transparent">شركة افق البصرة</span>
            ) : (
              <span className="bg-gradient-brand bg-clip-text text-transparent">UFUK AL-BASRA&nbsp;</span>
            )}
          </h1>
          {lang !== "ar" && (
            <h1 className="mt-2 text-balance text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl lg:text-[88px] text-foreground">
              COMPANY
            </h1>
          )}
          <p className="mt-7 mb-10 max-w-3xl animate-fade-in-up [animation-delay:240ms] text-pretty text-lg md:text-2xl leading-relaxed text-muted-foreground whitespace-pre-line">
            {t("hero_sub")}
          </p>

          <div className="mt-2 flex animate-fade-in-up [animation-delay:360ms] flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="group gap-2 h-14 px-8 text-base md:text-lg bg-primary text-primary-foreground shadow-elegant transition-transform hover:scale-[1.03] hover:bg-primary/90">
              <Link to="/products">
                {t("hero_cta_shop")}
                <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 h-14 px-8 text-base md:text-lg border-2 border-border bg-card text-foreground transition-colors hover:bg-accent">
              <Link to="/quote">{t("hero_cta_quote")}</Link>
            </Button>
          </div>

          {/* Inline rating / trust */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 animate-fade-in-up [animation-delay:480ms] text-base text-muted-foreground">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" style={{ animation: `fade-in 0.4s ease-out ${500 + i * 80}ms both` }} />
              ))}
              <span className="ms-1 font-semibold text-foreground">4.9/5</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div>{lang === "ar" ? "+5,000 عميل سعيد" : "5,000+ happy customers"}</div>
            <div className="h-4 w-px bg-border" />
            <div>{lang === "ar" ? "+10 سنوات خبرة" : "10+ years experience"}</div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="relative border-t border-border bg-card/50 backdrop-blur-md">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden md:grid-cols-4 bg-border">
            {[
              { icon: ShieldCheck, label: lang === "ar" ? "ضمان رسمي" : "Official warranty" },
              { icon: Truck, label: lang === "ar" ? "توصيل لكل العراق" : "Nationwide delivery" },
              { icon: Zap, label: lang === "ar" ? "دعم فني 24/7" : "24/7 support" },
              { icon: Cable, label: lang === "ar" ? "تركيب وتشغيل" : "Install & deploy" },
            ].map((f, i) => (
              <div
                key={i}
                className="group flex items-center gap-3 bg-card px-5 py-5 transition-colors hover:bg-accent"
                style={{ animation: `fade-in 0.5s ease-out ${600 + i * 120}ms both` }}
              >
                <f.icon className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
                <div className="text-sm md:text-base font-semibold text-foreground">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Trusted brands strip */}
      <BrandStrip />

      {/* 3. Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div ref={catHead} className="reveal mb-10 flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {lang === "ar" ? "الفئات" : "Categories"}
            </div>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">{t("explore_categories")}</h2>
          </div>
        </div>
        <div ref={catGrid} className="reveal grid gap-4 md:grid-cols-4">
          {categories.map((c, i) => {
            const Icon = catIcons[c.key] || Cable;
            return (
              <Link
                key={c.key}
                to={`/products?category=${c.key}`}
                className="group surface-card relative flex flex-col items-start gap-3 overflow-hidden p-6 transition-all duration-500 hover:-translate-y-2 hover:border-primary/40 hover:shadow-elegant"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div aria-hidden className="absolute -end-8 -top-8 h-28 w-28 rounded-full bg-primary/5 transition-all duration-500 group-hover:scale-[3] group-hover:bg-primary/10" />
                <div aria-hidden className="absolute -bottom-10 -start-10 h-24 w-24 rounded-full bg-destructive/0 transition-all duration-700 group-hover:bg-destructive/5" />
                <div className="relative rounded-lg bg-gradient-brand p-3 shadow-glow transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="relative text-lg font-bold">{lang === "ar" ? c.ar : c.en}</h3>
                <div className="relative text-xs text-muted-foreground">{c.subs.length} {t("subcategories")}</div>
                <span className="relative mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {t("view_all")}
                  <Arrow className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3.5 Stats */}
      <section className="bg-gradient-hero py-16 text-primary-foreground">
        <div ref={statsRef} className="reveal mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 md:grid-cols-4 md:px-6">
          {[
            { icon: Users, end: 5000, suffix: "+", label: lang === "ar" ? "عميل سعيد" : "Happy clients" },
            { icon: Award, end: 10, suffix: "+", label: lang === "ar" ? "سنوات خبرة" : "Years experience" },
            { icon: Wrench, end: 1200, suffix: "+", label: lang === "ar" ? "مشروع منجز" : "Projects done" },
            { icon: Globe2, end: 18, label: lang === "ar" ? "محافظة مغطاة" : "Provinces covered" },
          ].map((s, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-6 backdrop-blur-md transition-all hover:-translate-y-1 hover:bg-primary-foreground/10"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/10 transition-transform group-hover:scale-110">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="text-3xl font-extrabold tracking-tight md:text-4xl">
                <CountUp end={s.end} suffix={s.suffix ?? ""} />
              </div>
              <div className="mt-1 text-sm text-primary-foreground/70">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Featured blog posts slider */}
      <HeroSlider />

      {/* 5. Featured */}
      <section className="bg-secondary/30 py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div ref={featHead} className="reveal mb-8 flex items-end justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {lang === "ar" ? "الأكثر طلباً" : "Top picks"}
              </div>
              <h2 className="mt-2 text-2xl font-bold md:text-3xl">{t("featured_products")}</h2>
            </div>
            <Link to="/products" className="story-link text-sm font-semibold text-primary">
              {t("view_all")} →
            </Link>
          </div>
          <div ref={featGrid} className="reveal grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p, i) => (
              <div key={p.id} style={{ animation: `fade-in-up 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 60}ms both` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div ref={ctaRef} className="reveal surface-card relative overflow-hidden bg-gradient-brand p-8 text-primary-foreground md:p-12">
          <div aria-hidden className="absolute -top-16 -end-16 h-64 w-64 rounded-full bg-primary-foreground/10 blur-2xl animate-blob" />
          <div aria-hidden className="absolute -bottom-20 -start-10 h-72 w-72 rounded-full bg-destructive/20 blur-3xl animate-blob [animation-delay:2s]" />
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-bold md:text-3xl">{t("hero_cta_quote")}</h3>
              <p className="mt-2 text-primary-foreground/80">{t("quote_sub")}</p>
            </div>
            <Button asChild size="lg" className="group gap-2 bg-primary-foreground text-primary transition-transform hover:scale-105 hover:bg-primary-foreground/90">
              <Link to="/quote">
                {t("submit")}
                <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;

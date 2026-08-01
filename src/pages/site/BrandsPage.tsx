import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Seo, SITE_NAME } from "@/components/seo/Seo";
import { ArrowRight, ArrowLeft, Sparkles, ShieldCheck, Award, TrendingUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBrands } from "@/hooks/useBrands";

export default function BrandsPage() {
  const { t, lang } = useLanguage();
  const isRtl = lang === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const { brands, loading } = useBrands({ activeOnly: true });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    document.title = `${t("brands_page_title")} — ${t("brand")}`;
  }, [t, lang]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const totalBrands = brands?.length ?? 0;

  return (
    <div className="relative">
      <Seo
        title={lang === "ar" ? `العلامات التجارية — MikroTik، Ruijie، Must | ${SITE_NAME}` : `Brands — MikroTik, Ruijie, Must | ${SITE_NAME}`}
        description={
          lang === "ar"
            ? "العلامات التجارية التي نوزّعها رسمياً في العراق: MikroTik، Ruijie، Must وغيرها — معدات شبكات وطاقة شمسية وأنظمة UPS أصلية بضمان."
            : "Brands we officially distribute in Iraq: MikroTik, Ruijie, Must and more — genuine networking, solar and UPS equipment with warranty."
        }
        path="/brands"
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 text-primary-foreground md:py-28">
        {/* Parallax animated blobs */}
        <div
          aria-hidden
          className="absolute -top-32 -start-32 h-96 w-96 rounded-full bg-primary-glow/30 blur-3xl animate-blob will-change-transform"
          style={{ transform: `translate3d(${scrollY * 0.15}px, ${scrollY * 0.3}px, 0)` }}
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -end-32 h-96 w-96 rounded-full bg-destructive/20 blur-3xl animate-blob [animation-delay:3s] will-change-transform"
          style={{ transform: `translate3d(${-scrollY * 0.12}px, ${-scrollY * 0.2}px, 0)` }}
        />
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 h-72 w-72 rounded-full bg-primary-foreground/10 blur-3xl will-change-transform"
          style={{ transform: `translate3d(-50%, calc(-50% + ${scrollY * 0.1}px), 0)` }}
        />

        {/* Animated grid pattern with parallax */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            transform: `translate3d(0, ${scrollY * 0.25}px, 0)`,
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />

        {/* Floating sparkles */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-primary-foreground/40 animate-pulse"
              style={{
                left: `${(i * 17 + 8) % 95}%`,
                top: `${(i * 23 + 12) % 80}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${2 + (i % 3)}s`,
                transform: `translate3d(0, ${-scrollY * (0.05 + (i % 4) * 0.03)}px, 0)`,
              }}
            />
          ))}
        </div>

        <div
          className="relative mx-auto max-w-7xl px-4 md:px-6"
          style={{
            transform: `translate3d(0, ${scrollY * 0.18}px, 0)`,
            opacity: Math.max(0, 1 - scrollY / 600),
          }}
        >
          <div
            className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md"
            style={{ animation: "fade-in 0.6s ease-out both" }}
          >
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            {t("trusted_brands")}
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <h1
            className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl"
            style={{ animation: "fade-in-up 0.7s ease-out 0.1s both" }}
          >
            <span className="bg-gradient-to-b from-primary-foreground to-primary-foreground/60 bg-clip-text text-transparent">
              {t("brands_page_title")}
            </span>
          </h1>
          <p
            className="mt-4 max-w-2xl text-primary-foreground/85 md:text-lg"
            style={{ animation: "fade-in-up 0.7s ease-out 0.25s both" }}
          >
            {t("brands_page_sub")}
          </p>

          {/* Stat chips */}
          <div
            className="mt-8 flex flex-wrap items-center gap-3"
            style={{ animation: "fade-in-up 0.7s ease-out 0.4s both" }}
          >
            <div className="group flex items-center gap-2 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-primary-foreground/15">
              <Award className="h-4 w-4 transition-transform group-hover:rotate-12" />
              <span className="text-sm font-bold">{totalBrands}+</span>
              <span className="text-xs opacity-80">{t("trusted_brands")}</span>
            </div>
            <div className="group flex items-center gap-2 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-primary-foreground/15">
              <TrendingUp className="h-4 w-4 transition-transform group-hover:scale-110" />
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Bottom fade into page */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent"
        />
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl border border-border/60 bg-card/60" />
            ))}
          </div>
        ) : (brands?.length ?? 0) === 0 ? (
          <p className="text-center text-muted-foreground">{t("no_brands_yet")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {brands!.map((b, i) => (
              <Link
                key={b.id}
                to={`/products?brand=${encodeURIComponent(b.name)}`}
                className="group surface-card relative flex h-44 flex-col items-center justify-between overflow-hidden p-6 transition-all duration-500 hover:-translate-y-2 hover:border-primary/40 hover:shadow-elegant"
                style={{ animation: `fade-in-up 0.5s ease-out ${i * 60}ms both` }}
              >
                {/* Animated gradient sweep */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/15 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full rtl:translate-x-full rtl:group-hover:-translate-x-full"
                />
                {/* Soft top glow line */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-6 top-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-primary to-transparent transition-transform duration-500 group-hover:scale-x-100"
                />
                {/* Bottom accent bar */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-primary via-primary/70 to-transparent transition-transform duration-500 group-hover:scale-x-100 rtl:origin-right"
                />

                <div className="relative flex h-20 w-full items-center justify-center">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.name} loading="lazy" className="max-h-16 w-auto object-contain transition-all duration-500 group-hover:scale-110 group-hover:-rotate-2" />
                  ) : (
                    <span className="text-2xl font-extrabold tracking-tight text-foreground/80 transition-colors duration-500 group-hover:text-primary">{b.name}</span>
                  )}
                </div>
                <div className="relative flex w-full items-center justify-between">
                  <span className="text-sm font-bold transition-transform duration-500 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">{b.name}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 -translate-x-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0 rtl:translate-x-2 rtl:group-hover:translate-x-0">
                    {t("view_products")}
                    <Arrow className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

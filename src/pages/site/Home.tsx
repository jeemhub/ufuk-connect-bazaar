import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Cable, ShieldCheck, Sun, Truck, Zap, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { categories } from "@/data/mockData";
import { ProductCard } from "@/components/site/ProductCard";
import { useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { HeroSlider } from "@/components/site/HeroSlider";
import { BrandStrip } from "@/components/site/BrandStrip";

const Home = () => {
  const { t, lang } = useLanguage();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const { products } = useProducts({ activeOnly: true });
  const featured = products.slice(0, 8);

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
      {/* 1. Trusted brands strip — moved to top */}
      <BrandStrip />

      {/* 2. Hero — refined */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        {/* Ambient glows */}
        <div aria-hidden className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 15% 20%, hsl(217 91% 55% / 0.45), transparent 45%), radial-gradient(circle at 85% 80%, hsl(0 84% 50% / 0.3), transparent 45%)" }} />
        {/* Subtle grid */}
        <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-12 md:px-6 md:py-24 lg:py-28">
          {/* Left content */}
          <div className="md:col-span-7 lg:col-span-7">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              {t("hero_eyebrow")}
            </div>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.1] tracking-tight md:text-5xl lg:text-[64px]">
              {t("hero_title")}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base text-primary-foreground/85 md:text-lg">
              {t("hero_sub")}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2 bg-primary-foreground text-primary shadow-elegant hover:bg-primary-foreground/90">
                <Link to="/products">{t("hero_cta_shop")}<Arrow className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <Link to="/quote">{t("hero_cta_quote")}</Link>
              </Button>
            </div>

            {/* Inline rating / trust */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-primary-foreground/85">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ms-1 font-semibold">4.9/5</span>
              </div>
              <div className="h-4 w-px bg-primary-foreground/20" />
              <div>{lang === "ar" ? "+5,000 عميل سعيد" : "5,000+ happy customers"}</div>
              <div className="h-4 w-px bg-primary-foreground/20" />
              <div>{lang === "ar" ? "+10 سنوات خبرة" : "10+ years experience"}</div>
            </div>
          </div>

          {/* Right visual card stack */}
          <div className="relative md:col-span-5 lg:col-span-5">
            <div className="relative mx-auto aspect-square w-full max-w-md">
              {/* Big card */}
              <div className="absolute inset-0 rotate-[-4deg] rounded-3xl border border-primary-foreground/15 bg-primary-foreground/5 p-6 backdrop-blur-xl shadow-elegant">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand shadow-glow">
                    <Cable className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-primary-foreground/60">Enterprise</div>
                    <div className="text-lg font-bold">Networking</div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {["Routers", "Switches", "AP", "Cables"].map((n) => (
                    <div key={n} className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-3 text-sm">
                      {n}
                    </div>
                  ))}
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -end-2 rotate-[6deg] rounded-2xl border border-primary-foreground/20 bg-background/90 p-4 text-foreground shadow-elegant backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400/20">
                    <Sun className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Solar</div>
                    <div className="text-sm font-bold">{lang === "ar" ? "أنظمة كاملة" : "Full Systems"}</div>
                  </div>
                </div>
              </div>
              {/* Floating UPS chip */}
              <div className="absolute -top-3 -start-3 rotate-[-8deg] rounded-2xl border border-primary-foreground/20 bg-background/90 p-3 text-foreground shadow-elegant backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold">UPS · 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="relative border-t border-primary-foreground/10 bg-primary-foreground/5 backdrop-blur-md">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden md:grid-cols-4">
            {[
              { icon: ShieldCheck, label: lang === "ar" ? "ضمان رسمي" : "Official warranty" },
              { icon: Truck, label: lang === "ar" ? "توصيل لكل العراق" : "Nationwide delivery" },
              { icon: Zap, label: lang === "ar" ? "دعم فني 24/7" : "24/7 support" },
              { icon: Cable, label: lang === "ar" ? "تركيب وتشغيل" : "Install & deploy" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-gradient-hero px-5 py-4">
                <f.icon className="h-5 w-5 text-primary-foreground/80" />
                <div className="text-sm font-semibold">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Categories — directly under hero */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              {lang === "ar" ? "الفئات" : "Categories"}
            </div>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">{t("explore_categories")}</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {categories.map((c) => {
            const Icon = catIcons[c.key] || Cable;
            return (
              <Link key={c.key} to={`/products?category=${c.key}`}
                className="group surface-card relative flex flex-col items-start gap-3 overflow-hidden p-6 transition-all hover:-translate-y-1 hover:shadow-elegant">
                <div className="absolute -end-6 -top-6 h-24 w-24 rounded-full bg-primary/5 transition-all group-hover:scale-150 group-hover:bg-primary/10" />
                <div className="relative rounded-lg bg-gradient-brand p-3 shadow-glow"><Icon className="h-6 w-6 text-primary-foreground" /></div>
                <h3 className="relative text-lg font-bold">{lang === "ar" ? c.ar : c.en}</h3>
                <div className="relative text-xs text-muted-foreground">{c.subs.length} {t("subcategories")}</div>
                <span className="relative mt-auto text-sm font-semibold text-primary group-hover:underline">{t("view_all")} →</span>
              </Link>
            );
        </div>
      </section>

      {/* 4. Featured blog posts slider */}
      <HeroSlider />

      {/* 5. Featured */}
      <section className="bg-secondary/30 py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                {lang === "ar" ? "الأكثر طلباً" : "Top picks"}
              </div>
              <h2 className="mt-2 text-2xl font-bold md:text-3xl">{t("featured_products")}</h2>
            </div>
            <Link to="/products" className="text-sm font-semibold text-primary hover:underline">{t("view_all")} →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* 6. CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="surface-card relative overflow-hidden bg-gradient-brand p-8 text-primary-foreground md:p-12">
          <div aria-hidden className="absolute -top-16 -end-16 h-64 w-64 rounded-full bg-primary-foreground/10 blur-2xl" />
          <div aria-hidden className="absolute -bottom-20 -start-10 h-72 w-72 rounded-full bg-destructive/20 blur-3xl" />
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-bold md:text-3xl">{t("hero_cta_quote")}</h3>
              <p className="mt-2 text-primary-foreground/80">{t("quote_sub")}</p>
            </div>
            <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Link to="/quote">{t("submit")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;

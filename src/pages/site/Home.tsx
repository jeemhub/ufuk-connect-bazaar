import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Cable, ShieldCheck, Sun, Truck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { categories } from "@/data/mockData";
import { ProductCard } from "@/components/site/ProductCard";
import { useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { HeroSlider } from "@/components/site/HeroSlider";

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
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, hsl(217 91% 55% / 0.4), transparent 40%), radial-gradient(circle at 80% 80%, hsl(0 84% 50% / 0.25), transparent 40%)" }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            {t("hero_eyebrow")}
          </div>
          <h1 className="max-w-3xl text-balance text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            {t("hero_title")}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-primary-foreground/80 md:text-xl">{t("hero_sub")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Link to="/products">{t("hero_cta_shop")}<Arrow className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/quote">{t("hero_cta_quote")}</Link>
            </Button>
          </div>

          {/* Trust bar */}
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: ShieldCheck, label: lang === "ar" ? "ضمان رسمي" : "Official warranty" },
              { icon: Truck, label: lang === "ar" ? "توصيل لكل العراق" : "Nationwide delivery" },
              { icon: Zap, label: lang === "ar" ? "دعم فني 24/7" : "24/7 support" },
              { icon: Cable, label: lang === "ar" ? "تركيب وتشغيل" : "Install & deploy" },
            ].map((f, i) => (
              <div key={i} className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-3 backdrop-blur-md">
                <f.icon className="mb-2 h-5 w-5 text-primary-foreground/80" />
                <div className="text-xs font-semibold">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured blog posts slider */}
      <HeroSlider />

      {/* Brands */}
      <section className="border-b border-border bg-secondary/40 py-8">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("trusted_brands")}</div>
          <div className="mt-4 grid grid-cols-3 gap-6 md:grid-cols-5">
            {["MikroTik", "Ruijie", "Must", "Ubiquiti", "TP-Link"].map((b) => (
              <div key={b} className="text-center text-lg font-extrabold tracking-tight text-foreground/60 md:text-xl">{b}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-bold md:text-3xl">{t("explore_categories")}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {categories.map((c) => {
            const Icon = catIcons[c.key] || Cable;
            return (
              <Link key={c.key} to={`/products?category=${c.key}`}
                className="group surface-card flex flex-col items-start gap-3 p-6 transition-all hover:-translate-y-1 hover:shadow-elegant">
                <div className="rounded-lg bg-gradient-brand p-3 shadow-glow"><Icon className="h-6 w-6 text-primary-foreground" /></div>
                <h3 className="text-lg font-bold">{lang === "ar" ? c.ar : c.en}</h3>
                <div className="text-xs text-muted-foreground">{c.subs.length} {t("subcategories")}</div>
                <span className="mt-auto text-sm font-semibold text-primary group-hover:underline">{t("view_all")} →</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      <section className="bg-secondary/30 py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-2xl font-bold md:text-3xl">{t("featured_products")}</h2>
            <Link to="/products" className="text-sm font-semibold text-primary hover:underline">{t("view_all")} →</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="surface-card overflow-hidden bg-gradient-brand p-8 text-primary-foreground md:p-12">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
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

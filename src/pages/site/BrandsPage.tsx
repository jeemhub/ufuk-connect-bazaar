import { Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBrands } from "@/hooks/useBrands";

export default function BrandsPage() {
  const { t, lang } = useLanguage();
  const isRtl = lang === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const { brands, loading } = useBrands({ activeOnly: true });

  useEffect(() => {
    document.title = `${t("brands_page_title")} — ${t("brand")}`;
  }, [t, lang]);

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero py-16 text-primary-foreground md:py-20">
        <div aria-hidden className="absolute -top-32 -start-32 h-96 w-96 rounded-full bg-primary-glow/30 blur-3xl animate-blob" />
        <div aria-hidden className="absolute -bottom-32 -end-32 h-96 w-96 rounded-full bg-destructive/20 blur-3xl animate-blob [animation-delay:3s]" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            {t("trusted_brands")}
          </div>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            {t("brands_page_title")}
          </h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/85 md:text-lg">
            {t("brands_page_sub")}
          </p>
        </div>
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
                <div aria-hidden className="absolute -end-10 -top-10 h-32 w-32 rounded-full bg-primary/5 transition-all duration-700 group-hover:scale-[2.5] group-hover:bg-primary/10" />
                <div className="relative flex h-20 w-full items-center justify-center">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.name} loading="lazy" className="max-h-16 w-auto object-contain transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <span className="text-2xl font-extrabold tracking-tight text-foreground/80">{b.name}</span>
                  )}
                </div>
                <div className="relative flex w-full items-center justify-between">
                  <span className="text-sm font-bold">{b.name}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
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

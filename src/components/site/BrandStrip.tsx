import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBrands } from "@/hooks/useBrands";

function BrandLogo({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        loading="lazy"
        className="max-h-14 w-auto object-contain transition-all duration-500 group-hover/card:scale-110"
      />
    );
  }
  // Fallback: stylish initial badge + name so the strip never feels empty
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-base font-black text-primary ring-1 ring-primary/30 transition-all duration-500 group-hover/card:scale-110 group-hover/card:shadow-glow">
        {initial}
      </span>
      <span className="font-extrabold tracking-tight text-lg text-foreground whitespace-nowrap transition-colors group-hover/card:text-primary">
        {name}
      </span>
    </div>
  );
}

export function BrandStrip() {
  const { t, lang } = useLanguage();
  const isRtl = lang === "ar";
  const { brands, loading } = useBrands({ activeOnly: true });

  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const list = brands ?? [];
  // Triple the list for an ultra-smooth seamless loop
  const loop = list.length > 0 ? [...list, ...list, ...list] : [];

  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-gradient-to-b from-secondary/40 via-background to-secondary/30">
      {/* Animated ambient blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-24 start-1/4 h-56 w-56 rounded-full bg-primary/15 blur-3xl animate-pulse" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 end-1/4 h-56 w-56 rounded-full bg-destructive/10 blur-3xl animate-pulse [animation-delay:1.5s]" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-14">
        {/* Heading row */}
        <div className="mb-10 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/60" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              {t("trusted_brands")}
            </span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-primary/60" />
            <Sparkles className="h-4 w-4 text-primary animate-pulse [animation-delay:0.5s]" />
          </div>

          <Link
            to="/brands"
            className="group inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-glow"
          >
            {t("view_all_brands")}
            <Arrow className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>

        {/* Conveyor */}
        {loading || list.length === 0 ? (
          <div className="flex w-full gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-24 w-60 shrink-0 animate-pulse rounded-2xl border border-border/60 bg-card/60"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="brand-conveyor group relative overflow-hidden">
            <div
              className={`flex w-max gap-5 ${isRtl ? "animate-conveyor-rtl" : "animate-conveyor"} group-hover:[animation-play-state:paused]`}
            >
              {loop.map((b, i) => (
                <Link
                  key={`${b.id}-${i}`}
                  to={`/products?brand=${encodeURIComponent(b.name)}`}
                  aria-label={b.name}
                  className="group/card relative flex h-24 w-60 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-card/80 px-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:scale-[1.03] hover:border-primary/50 hover:bg-card hover:shadow-elegant"
                >
                  {/* shimmer sweep on hover */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/10 to-transparent transition-transform duration-700 group-hover/card:translate-x-full"
                  />
                  <BrandLogo name={b.name} url={b.logo_url} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

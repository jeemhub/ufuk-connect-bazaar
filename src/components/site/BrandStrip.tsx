import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBrands } from "@/hooks/useBrands";

function BrandLogo({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        loading="lazy"
        className="max-h-12 w-auto object-contain opacity-90 transition-all duration-300 group-hover/card:opacity-100 group-hover/card:scale-105"
      />
    );
  }
  return (
    <span className="font-extrabold tracking-tight text-xl text-foreground/80 whitespace-nowrap transition-colors group-hover/card:text-primary">
      {name}
    </span>
  );
}

export function BrandStrip() {
  const { t, lang } = useLanguage();
  const isRtl = lang === "ar";
  const { brands, loading } = useBrands({ activeOnly: true });

  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const list = brands ?? [];
  // duplicate for seamless marquee loop (only when we have items)
  const loop = list.length > 0 ? [...list, ...list] : [];

  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-gradient-to-b from-secondary/40 via-background to-secondary/30">
      {/* Decorative blobs to remove the "white flash" feeling */}
      <div aria-hidden className="pointer-events-none absolute -top-24 start-1/4 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 end-1/4 h-56 w-56 rounded-full bg-destructive/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        {/* Heading row */}
        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-primary/60" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              {t("trusted_brands")}
            </span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-primary/60" />
          </div>

          <Link
            to="/brands"
            className="group inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-glow"
          >
            {t("view_all_brands")}
            <Arrow className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>

        {/* Marquee or skeleton */}
        {loading || list.length === 0 ? (
          <div className="flex w-full gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 w-56 shrink-0 animate-pulse rounded-xl border border-border/60 bg-card/60"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="marquee-mask group relative overflow-hidden">
            <div
              className={`flex w-max gap-4 ${isRtl ? "animate-marquee-rtl" : "animate-marquee"} group-hover:[animation-play-state:paused]`}
            >
              {loop.map((b, i) => (
                <Link
                  key={`${b.id}-${i}`}
                  to={`/products?brand=${encodeURIComponent(b.name)}`}
                  aria-label={b.name}
                  className="group/card flex h-20 w-56 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card/80 px-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card hover:shadow-elegant"
                >
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

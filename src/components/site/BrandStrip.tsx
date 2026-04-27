import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBrands } from "@/hooks/useBrands";

function BrandVisual({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        loading="lazy"
        className="max-h-12 w-auto object-contain transition-all duration-500 group-hover/card:scale-110"
      />
    );
  }
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent text-xl font-black text-primary ring-1 ring-primary/30 shadow-inner transition-all duration-500 group-hover/card:rotate-6 group-hover/card:scale-110">
        {initial}
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

  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Decorative grid pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute -top-20 start-1/3 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-20 end-1/3 h-72 w-72 rounded-full bg-destructive/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
        {/* Heading */}
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              {t("trusted_brands")}
            </span>
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
          </div>
          <h2 className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl">
            {t("trusted_brands")}
          </h2>
          <span className="mt-3 block h-1 w-20 rounded-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
        </div>

        {/* Brand grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl border border-border/60 bg-card/60"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-10 text-center text-sm text-muted-foreground">
            —
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {list.slice(0, 10).map((b, i) => (
              <Link
                key={b.id}
                to={`/products?brand=${encodeURIComponent(b.name)}`}
                aria-label={b.name}
                style={{ animationDelay: `${i * 70}ms` }}
                className="group/card relative flex h-32 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm transition-all duration-500 animate-fade-in hover:-translate-y-1.5 hover:border-primary/50 hover:bg-card hover:shadow-elegant"
              >
                {/* Corner accent */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-px -end-px h-8 w-8 rounded-bl-2xl bg-gradient-to-br from-primary/30 to-transparent opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
                />
                {/* Glow */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.18),transparent_60%)] opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
                />
                <BrandVisual name={b.name} url={b.logo_url} />
                <span className="relative text-xs font-bold tracking-tight text-foreground/80 transition-colors group-hover/card:text-primary">
                  {b.name}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 flex justify-center">
          <Link
            to="/brands"
            className="group inline-flex items-center gap-2 rounded-full border border-primary/40 bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-2.5 text-sm font-semibold text-primary transition-all hover:from-primary hover:to-primary hover:text-primary-foreground hover:shadow-glow"
          >
            {t("view_all_brands")}
            <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

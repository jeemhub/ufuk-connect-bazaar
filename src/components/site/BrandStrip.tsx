import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBrands } from "@/hooks/useBrands";

type BrandItem = { id: string; name: string; logo_url: string | null };

const fallbackBrands: BrandItem[] = [
  { id: "fallback-mikrotik", name: "MikroTik", logo_url: null },
  { id: "fallback-ruijie", name: "Ruijie", logo_url: null },
  { id: "fallback-must", name: "Must", logo_url: null },
  { id: "fallback-ubiquiti", name: "Ubiquiti", logo_url: null },
  { id: "fallback-tp-link", name: "TP-Link", logo_url: null },
];

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
  const list: BrandItem[] = brands ?? [];
  const displayBrands = list.length > 0 ? list : fallbackBrands;
  const copiesPerLoop = Math.max(8, Math.ceil(18 / displayBrands.length));
  const loopBrands = Array.from({ length: copiesPerLoop }, () => displayBrands).flat();

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

        {/* Brand marquees */}
        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-28 w-48 shrink-0 animate-pulse rounded-2xl border border-border/60 bg-card/60"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="relative space-y-5">
            {/* Edge fade masks */}
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background via-background/80 to-transparent md:w-40" />
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background via-background/80 to-transparent md:w-40" />

            {/* Row 1: scroll left */}
            <div className="overflow-hidden" dir="ltr">
              <div className="flex w-max animate-marquee [animation-duration:160s]">
                {[0, 1].map((group) => (
                  <div key={group} aria-hidden={group === 1} className="flex shrink-0 gap-4 pe-4">
                    {loopBrands.map((b, i) => (
                      <Link
                        key={`r1-${group}-${b.id}-${i}`}
                        to={`/products?brand=${encodeURIComponent(b.name)}`}
                        aria-label={b.name}
                        className="group/card relative flex h-28 w-52 shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/50 hover:bg-card hover:shadow-elegant"
                      >
                        <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/15 to-transparent transition-transform duration-[900ms] ease-out group-hover/card:translate-x-full" />
                        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-primary via-primary/70 to-transparent transition-transform duration-500 group-hover/card:scale-x-100" />
                        <BrandVisual name={b.name} url={b.logo_url} />
                        <span className="relative text-xs font-bold tracking-tight text-foreground/80 transition-colors group-hover/card:text-primary">
                          {b.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>

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

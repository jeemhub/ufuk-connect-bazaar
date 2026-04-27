import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

type Brand = {
  name: string;
  render: () => JSX.Element;
};

const brands: Brand[] = [
  {
    name: "MikroTik",
    render: () => (
      <span className="font-extrabold tracking-tight text-2xl whitespace-nowrap">
        <span className="text-foreground">Mikro</span>
        <span className="text-primary">Tik</span>
      </span>
    ),
  },
  {
    name: "Ruijie",
    render: () => (
      <span className="font-extrabold tracking-tight text-2xl whitespace-nowrap">
        <span className="text-destructive">Ruijie</span>
        <span className="ms-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground align-middle">
          Networks
        </span>
      </span>
    ),
  },
  {
    name: "Must",
    render: () => (
      <span className="font-black tracking-[0.18em] text-2xl uppercase whitespace-nowrap">
        <span className="text-foreground">M</span>
        <span className="text-primary">U</span>
        <span className="text-foreground">S</span>
        <span className="text-destructive">T</span>
      </span>
    ),
  },
  {
    name: "Ubiquiti",
    render: () => (
      <span className="font-light tracking-[0.2em] text-2xl uppercase text-foreground whitespace-nowrap">
        ubiquiti
      </span>
    ),
  },
  {
    name: "TP-Link",
    render: () => (
      <span className="font-extrabold tracking-tight text-2xl whitespace-nowrap">
        <span className="text-primary">tp</span>
        <span className="text-foreground">-link</span>
      </span>
    ),
  },
];

export function BrandStrip() {
  const { t, lang } = useLanguage();
  const isRtl = lang === "ar";
  // duplicate the list to make a seamless loop
  const loop = [...brands, ...brands];

  return (
    <section className="border-y border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-border" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {t("trusted_brands")}
          </span>
          <span className="h-px w-10 bg-border" />
        </div>

        {/* Marquee */}
        <div className="marquee-mask group relative overflow-hidden">
          <div
            className={`flex w-max gap-4 ${isRtl ? "animate-marquee-rtl" : "animate-marquee"} group-hover:[animation-play-state:paused]`}
          >
            {loop.map((b, i) => (
              <Link
                key={`${b.name}-${i}`}
                to={`/products?brand=${encodeURIComponent(b.name)}`}
                aria-label={b.name}
                className="flex h-20 w-56 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card px-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant"
              >
                <div className="opacity-70 transition-opacity duration-300 hover:opacity-100">
                  {b.render()}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

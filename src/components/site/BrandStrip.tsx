import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

type Brand = {
  name: string;
  // Typographic logo: customized wordmark since real trademarks are unavailable
  render: () => JSX.Element;
};

const brands: Brand[] = [
  {
    name: "MikroTik",
    render: () => (
      <span className="font-extrabold tracking-tight text-2xl">
        <span className="text-foreground">Mikro</span>
        <span className="text-primary">Tik</span>
      </span>
    ),
  },
  {
    name: "Ruijie",
    render: () => (
      <span className="font-extrabold tracking-tight text-2xl">
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
      <span className="font-black tracking-[0.18em] text-2xl uppercase">
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
      <span className="font-light tracking-[0.2em] text-2xl uppercase text-foreground">
        ubiquiti
      </span>
    ),
  },
  {
    name: "TP-Link",
    render: () => (
      <span className="font-extrabold tracking-tight text-2xl">
        <span className="text-primary">tp</span>
        <span className="text-foreground">-link</span>
      </span>
    ),
  },
];

export function BrandStrip() {
  const { t } = useLanguage();
  return (
    <section className="border-b border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-4 flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-border" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {t("trusted_brands")}
          </span>
          <span className="h-px w-8 bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {brands.map((b) => (
            <Link
              key={b.name}
              to={`/products?brand=${encodeURIComponent(b.name)}`}
              aria-label={b.name}
              className="group flex h-20 items-center justify-center rounded-xl border border-border/60 bg-card px-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant"
            >
              <div className="opacity-80 transition-opacity group-hover:opacity-100">
                {b.render()}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

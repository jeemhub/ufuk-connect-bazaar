import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, ArrowLeft, Package, FileText, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import { img } from "@/lib/img";

type Suggestion =
  | { kind: "product"; id: string; label: string; sub?: string; image?: string; to: string }
  | { kind: "page"; label: string; sub?: string; to: string };

export function GlobalSearch() {
  const { t, lang } = useLanguage();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const navigate = useNavigate();
  const { products } = useProducts({ activeOnly: true });
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const pages: Suggestion[] = useMemo(
    () => [
      { kind: "page", label: t("nav_shop"), to: "/products" },
      { kind: "page", label: t("nav_projects"), to: "/projects" },
      { kind: "page", label: t("nav_blog"), to: "/blog" },
      { kind: "page", label: t("nav_about"), to: "/about" },
      { kind: "page", label: t("request_quote"), to: "/quote" },
      { kind: "page", label: ar ? "الأدوات" : "Tools", to: "/tools" },
      { kind: "page", label: ar ? "العلامات التجارية" : "Brands", to: "/brands" },
    ],
    [t, ar]
  );

  const norm = (s: string) =>
    (s || "")
      .toLowerCase()
      .replace(/[\u064B-\u0652]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .trim();

  const results: Suggestion[] = useMemo(() => {
    const term = norm(q);
    if (!term) return [];
    const tokens = term.split(/\s+/).filter(Boolean);
    const match = (hay: string) => tokens.every((tk) => hay.includes(tk));

    const prod: Suggestion[] = products
      .filter((p: any) =>
        match(norm([p.nameAr, p.nameEn, p.nameData, p.brand, p.category, p.sku].filter(Boolean).join(" ")))
      )
      .slice(0, 6)
      .map((p: any) => ({
        kind: "product" as const,
        id: p.id,
        label: (ar ? p.nameAr || p.nameEn : p.nameEn || p.nameAr) || p.nameData || p.sku,
        sub: p.brand,
        image: p.images?.[0],
        to: `/products/${p.id}`,
      }));

    const pg = pages.filter((p) => match(norm(p.label))).slice(0, 3);
    return [...prod, ...pg];
  }, [q, products, pages, ar]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    navigate(`/products?q=${encodeURIComponent(q.trim())}`);
  };

  const chips = ar
    ? ["راوتر MikroTik", "انفرتر Must", "بطارية", "سويج Ruijie", "بانل شمسي"]
    : ["MikroTik router", "Must inverter", "Battery", "Ruijie switch", "Solar panel"];

  return (
    <div ref={boxRef} className="relative mx-auto w-full max-w-2xl animate-fade-in-up [animation-delay:120ms]">
      {/* Glow ring */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -inset-1 rounded-[1.6rem] bg-gradient-brand opacity-0 blur-xl transition-opacity duration-500 ${
          focused ? "opacity-40" : "opacity-20"
        }`}
      />
      <form
        onSubmit={submit}
        className="relative flex items-center gap-2 rounded-3xl border border-border bg-card/90 p-2 shadow-elegant backdrop-blur-xl"
      >
        <Search className="ms-3 h-5 w-5 shrink-0 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          placeholder={ar ? "ابحث عن أي شيء في الموقع…" : "Search anything on the site…"}
          className="h-11 border-0 bg-transparent text-base shadow-none focus-visible:ring-0 md:text-lg"
          aria-label={ar ? "بحث في الموقع" : "Search the site"}
        />
        <Button type="submit" size="lg" className="h-11 gap-2 rounded-2xl px-5 shadow-elegant">
          <span className="hidden sm:inline">{ar ? "بحث" : "Search"}</span>
          <Arrow className="h-4 w-4" />
        </Button>
      </form>

      {/* Quick chips */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => navigate(`/products?q=${encodeURIComponent(c)}`)}
            className="rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
          >
            {c}
          </button>
        ))}
      </div>

      {/* Suggestions */}
      {open && q.trim() && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-card/95 text-start shadow-elegant backdrop-blur-xl animate-fade-in">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              {ar ? "لا توجد نتائج" : "No results"}
            </div>
          ) : (
            <ul className="max-h-80 divide-y divide-border overflow-y-auto">
              {results.map((r) => (
                <li key={`${r.kind}-${r.to}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      navigate(r.to);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-start transition-colors hover:bg-accent"
                  >
                    {r.kind === "product" ? (
                      r.image ? (
                        <img
                          src={img(r.image, 80)}
                          alt=""
                          loading="lazy"
                          className="h-10 w-10 shrink-0 rounded-lg border border-border object-contain bg-background"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </span>
                      )
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{r.label}</span>
                      {r.sub && <span className="block truncate text-xs text-muted-foreground">{r.sub}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => submit()}
            className="w-full border-t border-border bg-secondary/40 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-accent"
          >
            {ar ? `عرض كل نتائج "${q}"` : `See all results for "${q}"`}
          </button>
        </div>
      )}
    </div>
  );
}

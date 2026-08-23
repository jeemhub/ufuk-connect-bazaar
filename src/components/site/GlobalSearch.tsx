import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Layers,
  Loader2,
  Package,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useProducts } from "@/hooks/useProducts";
import { optimizedImage } from "@/lib/img";
import { categories } from "@/data/mockData";
import { expandTokens, foldSearchText, matchesAllTokens, normalizeSearchText, searchTokens } from "@/lib/search";

type SuggestionKind = "product" | "category" | "brand" | "page";

type Suggestion = {
  kind: SuggestionKind;
  key: string;
  label: string;
  sub?: string;
  image?: string;
  to: string;
};

// Categories and brands are capped at a few rows each and are the fastest way to the
// right shelf, so they sit above the product matches.
const GROUP_ORDER: SuggestionKind[] = ["category", "brand", "product", "page"];

const KIND_ICON = {
  product: Package,
  category: Layers,
  brand: Tag,
  page: FileText,
} as const;

/** Wraps the parts of `text` that matched the query so they stand out in the list. */
function HighlightedLabel({ text, tokens }: { text: string; tokens: string[] }) {
  const parts = useMemo(() => {
    if (!tokens.length) return null;
    const folded = foldSearchText(text);
    const ranges: Array<[number, number]> = [];

    for (const token of tokens) {
      let from = 0;
      for (;;) {
        const at = folded.indexOf(token, from);
        if (at === -1) break;
        ranges.push([at, at + token.length]);
        from = at + token.length;
      }
    }
    if (!ranges.length) return null;

    ranges.sort((a, b) => a[0] - b[0]);
    const merged: Array<[number, number]> = [];
    for (const range of ranges) {
      const last = merged[merged.length - 1];
      if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
      else merged.push([...range]);
    }
    return merged;
  }, [text, tokens]);

  if (!parts) return <>{text}</>;

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  parts.forEach(([start, end], i) => {
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      <mark key={i} className="rounded-[3px] bg-primary/15 px-0.5 font-bold text-primary">
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}

export function GlobalSearch() {
  const { t, lang } = useLanguage();
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const navigate = useNavigate();
  const { products, loading } = useProducts({ activeOnly: true });

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);

  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filtering runs over the whole catalogue on every keystroke; deferring it keeps
  // typing responsive on large lists.
  const deferredQ = useDeferredValue(q);
  const tokens = useMemo(() => searchTokens(deferredQ), [deferredQ]);
  const matchTokens = useMemo(() => expandTokens(tokens), [tokens]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const pages: Suggestion[] = useMemo(
    () =>
      [
        { label: t("nav_shop"), to: "/products" },
        { label: t("nav_projects"), to: "/projects" },
        { label: t("nav_blog"), to: "/blog" },
        { label: t("nav_about"), to: "/about" },
        { label: t("request_quote"), to: "/quote" },
        { label: ar ? "الأدوات" : "Tools", to: "/tools" },
        { label: ar ? "العلامات التجارية" : "Brands", to: "/brands" },
      ].map((p) => ({ kind: "page" as const, key: `page:${p.to}`, ...p })),
    [t, ar]
  );

  // Categories also match on their subcategory names, so "بطارية" surfaces the
  // "الطاقة الشمسية" shelf even though the word isn't in the category title.
  const categorySuggestions = useMemo(
    () =>
      categories.map((c) => ({
        suggestion: {
          kind: "category" as const,
          key: `category:${c.key}`,
          label: ar ? c.ar : c.en,
          sub: ar ? c.subs.map((s) => s.ar).join(" · ") : c.subs.map((s) => s.en).join(" · "),
          to: `/products?category=${c.key}`,
        } satisfies Suggestion,
        haystack: normalizeSearchText(
          [c.ar, c.en, ...c.subs.flatMap((s) => [s.ar, s.en])].join(" ")
        ),
      })),
    [ar]
  );

  /** Product haystacks are normalized once per catalogue load, not per keystroke. */
  const indexedProducts = useMemo(() => {
    const categoryLabels = new Map(categories.map((c) => [c.key, `${c.ar} ${c.en}`]));
    return products.map((p) => ({
      product: p,
      haystack: normalizeSearchText(
        [
          p.nameAr,
          p.nameEn,
          p.nameData,
          p.brand,
          p.subcategory,
          p.sku,
          categoryLabels.get(p.category) ?? p.category,
        ]
          .filter(Boolean)
          .join(" ")
      ),
      name: normalizeSearchText((ar ? p.nameAr || p.nameEn : p.nameEn || p.nameAr) || ""),
    }));
  }, [products, ar]);

  const brandSuggestions = useMemo(() => {
    const names = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
    return names.map((name) => ({
      suggestion: {
        kind: "brand" as const,
        key: `brand:${name}`,
        label: name,
        sub: ar ? "كل منتجات هذه العلامة" : "All products from this brand",
        to: `/products?brand=${encodeURIComponent(name)}`,
      } satisfies Suggestion,
      haystack: normalizeSearchText(name),
    }));
  }, [products, ar]);

  const results: Suggestion[] = useMemo(() => {
    if (!tokens.length) return [];
    const [firstToken] = tokens;

    const matchedProducts = indexedProducts
      .filter((entry) => matchesAllTokens(entry.haystack, matchTokens))
      // Names that start with what was typed are almost always what the user meant.
      .sort((a, b) => {
        const rank = (n: string) => (n.startsWith(firstToken) ? 0 : n.includes(firstToken) ? 1 : 2);
        return rank(a.name) - rank(b.name);
      })
      .slice(0, 6)
      .map(({ product: p }) => ({
        kind: "product" as const,
        key: `product:${p.id}`,
        label: (ar ? p.nameAr || p.nameEn : p.nameEn || p.nameAr) || p.nameData || p.sku,
        sub: [p.brand, p.subcategory].filter(Boolean).join(" · "),
        image: p.image,
        to: `/products/${p.id}`,
      }));

    const pick = (list: { suggestion: Suggestion; haystack: string }[], limit: number) =>
      list.filter((e) => matchesAllTokens(e.haystack, matchTokens)).slice(0, limit).map((e) => e.suggestion);

    return [
      ...pick(categorySuggestions, 3),
      ...pick(brandSuggestions, 3),
      ...matchedProducts,
      ...pick(
        pages.map((p) => ({ suggestion: p, haystack: normalizeSearchText(p.label) })),
        3
      ),
    ];
  }, [tokens, matchTokens, indexedProducts, categorySuggestions, brandSuggestions, pages, ar]);

  /** Grouped for display, carrying the flat index each row has for keyboard nav. */
  const groups = useMemo(() => {
    const labels: Record<SuggestionKind, string> = {
      product: ar ? "المنتجات" : "Products",
      category: ar ? "الأقسام" : "Categories",
      brand: ar ? "العلامات التجارية" : "Brands",
      page: ar ? "صفحات الموقع" : "Pages",
    };
    let index = 0;
    return GROUP_ORDER.map((kind) => ({
      kind,
      label: labels[kind],
      items: results.filter((r) => r.kind === kind).map((suggestion) => ({ suggestion, index: index++ })),
    })).filter((g) => g.items.length > 0);
  }, [results, ar]);

  const hasQuery = q.trim().length > 0;
  const panelOpen = open && hasQuery;
  const stale = q !== deferredQ;
  const busy = loading || stale;
  // The "see all results" row sits right after the suggestions in the keyboard order.
  const seeAllIndex = results.length;

  useEffect(() => setActive(-1), [deferredQ]);

  useEffect(() => {
    if (active < 0) return;
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const goTo = (to: string) => {
    setOpen(false);
    setActive(-1);
    inputRef.current?.blur();
    navigate(to);
  };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!q.trim()) return;
    goTo(`/products?q=${encodeURIComponent(q.trim())}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (!panelOpen) return;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const last = seeAllIndex;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((prev) => {
        const next = prev + step;
        if (next > last) return 0;
        if (next < 0) return last;
        return next;
      });
      return;
    }
    if (e.key === "Enter" && active >= 0 && active < results.length) {
      e.preventDefault();
      goTo(results[active].to);
    }
  };

  const chips = ar
    ? ["راوتر MikroTik", "انفرتر Must", "بطارية", "سويج Ruijie", "بانل شمسي"]
    : ["MikroTik router", "Must inverter", "Battery", "Ruijie switch", "Solar panel"];

  return (
    // The hero's siblings animate `transform`, which paints them in the positioned
    // layer; without an explicit z-index here the suggestion panel renders beneath them.
    <div ref={boxRef} className="relative z-30 mx-auto w-full max-w-2xl animate-fade-in-up [animation-delay:120ms]">
      {/* The form and its suggestion panel share a wrapper so the panel is anchored to
          the input itself rather than to the quick-chips row underneath it. */}
      <div className="relative z-50">
        <div
          aria-hidden
          className={`pointer-events-none absolute -inset-1 rounded-[1.75rem] bg-gradient-brand blur-xl transition-opacity duration-500 ${
            focused ? "opacity-40" : "opacity-[0.18]"
          }`}
        />
        <form
          onSubmit={submit}
          role="search"
          className={`relative flex items-center gap-1.5 rounded-3xl border bg-card/95 p-2 shadow-elegant backdrop-blur-xl transition-colors duration-300 ${
            focused ? "border-primary/60" : "border-border"
          }`}
        >
          <span className="grid h-11 w-10 shrink-0 place-items-center text-muted-foreground">
            {busy && hasQuery ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <Search className={`h-5 w-5 transition-colors ${focused ? "text-primary" : ""}`} />
            )}
          </span>

          <Input
            ref={inputRef}
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
            onKeyDown={onKeyDown}
            placeholder={ar ? "ابحث عن منتج أو قسم…" : "Search for a product or category…"}
            className="h-11 border-0 bg-transparent px-0 text-base shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0 md:text-lg"
            aria-label={ar ? "بحث في الموقع" : "Search the site"}
            role="combobox"
            aria-expanded={panelOpen}
            aria-controls="global-search-listbox"
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `global-search-option-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
          />

          {hasQuery && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setActive(-1);
                inputRef.current?.focus();
              }}
              aria-label={ar ? "مسح البحث" : "Clear search"}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <Button type="submit" size="lg" className="h-11 shrink-0 gap-2 rounded-2xl px-5 shadow-elegant">
            <span className="hidden sm:inline">{ar ? "بحث" : "Search"}</span>
            <Arrow className="h-4 w-4" />
          </Button>
        </form>

        {panelOpen && (
          <div className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border border-border bg-card text-start shadow-elegant animate-fade-in">
            {busy && results.length === 0 ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {ar ? "جارٍ البحث…" : "Searching…"}
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-semibold text-foreground">
                  {ar ? "لا توجد نتائج مطابقة" : "No matching results"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ar
                    ? "جرّب اسماً أقصر، أو اسم العلامة التجارية، أو رقم الموديل."
                    : "Try a shorter name, the brand, or the model number."}
                </p>
              </div>
            ) : (
              <div
                ref={listRef}
                id="global-search-listbox"
                role="listbox"
                className="max-h-[min(60vh,22rem)] overflow-y-auto overscroll-contain"
              >
                {groups.map((group) => (
                  <div key={group.kind} role="group" aria-label={group.label} className="py-1">
                    <p className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </p>
                    <div>
                      {group.items.map(({ suggestion, index }) => {
                        const Icon = KIND_ICON[suggestion.kind];
                        const isActive = index === active;
                        return (
                            <button
                              key={suggestion.key}
                              type="button"
                              id={`global-search-option-${index}`}
                              data-idx={index}
                              role="option"
                              aria-selected={isActive}
                              onMouseEnter={() => setActive(index)}
                              onClick={() => goTo(suggestion.to)}
                              className={`flex w-full items-center gap-3 px-3 py-2.5 text-start transition-colors ${
                                isActive ? "bg-accent" : "hover:bg-accent/60"
                              }`}
                            >
                              {suggestion.kind === "product" && suggestion.image ? (
                                <img
                                  src={optimizedImage(suggestion.image, { width: 80 })}
                                  alt=""
                                  loading="lazy"
                                  className="h-10 w-10 shrink-0 rounded-lg border border-border bg-background object-contain"
                                />
                              ) : (
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-background">
                                  <Icon className="h-4 w-4 text-muted-foreground" />
                                </span>
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-foreground">
                                  <HighlightedLabel text={suggestion.label} tokens={tokens} />
                                </span>
                                {suggestion.sub && (
                                  <span className="block truncate text-xs text-muted-foreground">{suggestion.sub}</span>
                                )}
                              </span>
                              <Arrow
                                className={`h-4 w-4 shrink-0 text-muted-foreground transition-opacity ${
                                  isActive ? "opacity-100" : "opacity-0"
                                }`}
                              />
                            </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              data-idx={seeAllIndex}
              onMouseEnter={() => setActive(seeAllIndex)}
              onClick={() => submit()}
              className={`w-full border-t border-border px-4 py-2.5 text-sm font-semibold text-primary transition-colors ${
                active === seeAllIndex ? "bg-accent" : "bg-secondary/40 hover:bg-accent"
              }`}
            >
              {ar ? `عرض كل النتائج عن «${q.trim()}»` : `See all results for “${q.trim()}”`}
            </button>
          </div>
        )}
      </div>

      {/* Quick chips — kept in the layout while suggestions are open so the page
          below them doesn't jump, but faded out to keep the panel readable. */}
      <div
        aria-hidden={panelOpen}
        className={`mt-3 flex flex-wrap items-center justify-center gap-2 transition-opacity duration-200 ${
          panelOpen ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            tabIndex={panelOpen ? -1 : 0}
            onClick={() => navigate(`/products?q=${encodeURIComponent(c)}`)}
            className="rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeaturedPosts } from "@/hooks/useBlog";
import { useLanguage } from "@/i18n/LanguageContext";
import { optimizedImage, optimizedSrcSet } from "@/lib/img";

export function HeroSlider() {
  const { t, lang } = useLanguage();
  const isRtl = lang === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const posts = useFeaturedPosts();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (posts.length < 2 || paused) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % posts.length), 6500);
    return () => clearInterval(id);
  }, [posts.length, paused]);

  if (posts.length === 0) return null;

  const go = (dir: 1 | -1) =>
    setIdx((i) => (i + dir + posts.length) % posts.length);

  const Prev = isRtl ? ChevronRight : ChevronLeft;
  const Next = isRtl ? ChevronLeft : ChevronRight;

  return (
    <section
      className="relative py-8 md:py-14"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {/* Ambient background */}
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -start-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -end-24 h-96 w-96 rounded-full bg-destructive/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-[28px] border border-border/60 bg-card shadow-elegant">
          {posts.map((p, i) => {
            const active = i === idx;
            const title = isRtl ? p.title_ar : p.title_en;
            const excerpt = isRtl ? p.excerpt_ar : p.excerpt_en;
            return (
              <div
                key={p.id}
                aria-hidden={!active}
                className={`${
                  active
                    ? "opacity-100 relative"
                    : "opacity-0 pointer-events-none absolute inset-0"
                } transition-opacity duration-700 ease-out`}
              >
                <div className="grid md:grid-cols-12 gap-0 items-stretch min-h-[460px]">
                  {/* Image side */}
                  <div className="relative md:col-span-7 overflow-hidden rounded-2xl md:m-3">
                    {p.cover_url ? (
                      <img
                        src={optimizedImage(p.cover_url, { width: 900 }) ?? p.cover_url}
                        srcSet={optimizedSrcSet(p.cover_url, [600, 900, 1280])}
                        sizes="(max-width: 768px) 100vw, 60vw"
                        alt={title}
                        loading={active ? "eager" : "lazy"}
                        fetchPriority={active ? "high" : "auto"}
                        decoding="async"
                        className={`h-72 md:h-full w-full object-cover rounded-2xl transition-transform duration-[8000ms] ease-out ${
                          active ? "scale-105" : "scale-100"
                        }`}
                      />
                    ) : (
                      <div className="h-72 md:h-full w-full rounded-2xl bg-gradient-hero" />
                    )}
                  </div>

                  {/* Content side */}
                  <div className="relative md:col-span-5 flex flex-col justify-center p-7 md:p-10 lg:p-12">
                    <div
                      className={`inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary transition-all duration-700 ${
                        active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {t("blog_title")}
                    </div>

                    <h2
                      className={`mt-4 text-[26px] md:text-3xl lg:text-[40px] font-extrabold leading-[1.15] tracking-tight text-foreground transition-all duration-700 delay-75 ${
                        active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                      }`}
                    >
                      {title}
                    </h2>

                    {excerpt && (
                      <p
                        className={`mt-4 text-[15px] md:text-base text-muted-foreground line-clamp-3 leading-relaxed transition-all duration-700 delay-150 ${
                          active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                        }`}
                      >
                        {excerpt}
                      </p>
                    )}

                    <div
                      className={`mt-7 flex items-center gap-3 transition-all duration-700 delay-200 ${
                        active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                      }`}
                    >
                      <Button
                        asChild
                        size="lg"
                        className="gap-2 bg-gradient-brand shadow-elegant hover:shadow-glow transition-shadow"
                      >
                        <Link to={`/blog/${p.slug}`}>
                          {t("blog_read_more")}
                          <Arrow className="h-4 w-4" />
                        </Link>
                      </Button>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        <span className="font-semibold text-foreground">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="mx-1.5">/</span>
                        {String(posts.length).padStart(2, "0")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Arrows */}
          {posts.length > 1 && (
            <>
              <button
                type="button"
                aria-label="previous"
                onClick={() => go(-1)}
                className="group absolute top-1/2 start-3 md:start-5 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-background/80 backdrop-blur border border-border/60 shadow-card flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
              >
                <Prev className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="next"
                onClick={() => go(1)}
                className="group absolute top-1/2 end-3 md:end-5 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-background/80 backdrop-blur border border-border/60 shadow-card flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
              >
                <Next className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Progress dots */}
          {posts.length > 1 && (
            <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 z-10">
              {posts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  aria-label={`slide-${i + 1}`}
                  aria-current={i === idx}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === idx
                      ? "bg-primary w-10"
                      : "bg-foreground/20 hover:bg-foreground/40 w-4"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

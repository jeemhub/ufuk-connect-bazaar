import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeaturedPosts } from "@/hooks/useBlog";
import { useLanguage } from "@/i18n/LanguageContext";

export function HeroSlider() {
  const { t, lang } = useLanguage();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const posts = useFeaturedPosts();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (posts.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % posts.length), 6000);
    return () => clearInterval(id);
  }, [posts.length]);

  if (posts.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-secondary/30">
      <div className="relative mx-auto max-w-7xl">
        {posts.map((p, i) => (
          <div
            key={p.id}
            className={`${i === idx ? "opacity-100" : "opacity-0 pointer-events-none absolute inset-0"} transition-opacity duration-700`}
          >
            {i === idx && (
              <div className="grid md:grid-cols-2 gap-0 items-stretch min-h-[420px]">
                <div className="relative">
                  {p.cover_url ? (
                    <img src={p.cover_url} alt={lang === "ar" ? p.title_ar : p.title_en}
                      className="h-72 md:h-full w-full object-cover" />
                  ) : (
                    <div className="h-72 md:h-full w-full bg-gradient-brand" />
                  )}
                </div>
                <div className="flex flex-col justify-center p-8 md:p-12">
                  <div className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                    {t("blog_title")}
                  </div>
                  <h2 className="text-2xl md:text-4xl font-extrabold leading-tight mb-4">
                    {lang === "ar" ? p.title_ar : p.title_en}
                  </h2>
                  {(lang === "ar" ? p.excerpt_ar : p.excerpt_en) && (
                    <p className="text-muted-foreground mb-6 line-clamp-3">
                      {lang === "ar" ? p.excerpt_ar : p.excerpt_en}
                    </p>
                  )}
                  <div>
                    <Button asChild size="lg" className="gap-2 bg-gradient-brand">
                      <Link to={`/blog/${p.slug}`}>{t("blog_read_more")}<Arrow className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {posts.length > 1 && (
          <div className="flex justify-center gap-2 pb-6">
            {posts.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`slide-${i}`}
                className={`h-2 rounded-full transition-all ${i === idx ? "bg-primary w-8" : "bg-muted-foreground/40 w-2"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

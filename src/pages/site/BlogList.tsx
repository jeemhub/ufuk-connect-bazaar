import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePublishedPosts } from "@/hooks/useBlog";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogList() {
  const { t, lang } = useLanguage();
  const { posts, loading } = usePublishedPosts();

  useEffect(() => {
    document.title = `${t("blog_title")} — ${t("brand")}`;
  }, [t]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold">{t("blog_title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("blog_subtitle")}</p>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center text-muted-foreground py-16">{t("blog_no_posts")}</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} to={`/blog/${p.slug}`}
              className="surface-card group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-elegant">
              <div className="aspect-video w-full overflow-hidden bg-secondary">
                {p.cover_url ? (
                  <img src={optimizedImage(p.cover_url, { width: 600 }) ?? p.cover_url}
                    srcSet={optimizedSrcSet(p.cover_url, [400, 600, 900])}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    alt={lang === "ar" ? p.title_ar : p.title_en}
                    loading="lazy" decoding="async"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="h-full w-full bg-gradient-brand" />
                )}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold line-clamp-2">{lang === "ar" ? p.title_ar : p.title_en}</h3>
                {(lang === "ar" ? p.excerpt_ar : p.excerpt_en) && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                    {lang === "ar" ? p.excerpt_ar : p.excerpt_en}
                  </p>
                )}
                <div className="mt-3 text-xs text-muted-foreground">
                  {new Date(p.published_at ?? p.created_at).toLocaleDateString(lang === "ar" ? "ar" : "en")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

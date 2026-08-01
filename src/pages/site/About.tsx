import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import logo from "@/assets/logo.png";
import { sanitizeHTML } from "@/components/admin/RichTextEditor";
import { Seo, SITE_NAME } from "@/components/seo/Seo";

type Page = {
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  cover_url: string | null;
};

export default function AboutPage() {
  const { t, lang } = useLanguage();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${t("about_title")} — ${t("brand")}`;
    supabase
      .from("site_pages")
      .select("title_ar,title_en,content_ar,content_en,cover_url")
      .eq("key", "about")
      .maybeSingle()
      .then(({ data }) => {
        setPage((data as Page) ?? null);
        setLoading(false);
      });
  }, [t]);

  const title = page ? (lang === "ar" ? page.title_ar : page.title_en) || t("about_title") : t("about_title");
  const content = page ? (lang === "ar" ? page.content_ar : page.content_en) : "";

  return (
    <div className="relative">
      <Seo
        title={lang === "ar" ? `من نحن — أُفُق البصرة | ${SITE_NAME}` : `About Us — UFUK AL-Basra | ${SITE_NAME}`}
        description={
          (lang === "ar" ? page?.content_ar : page?.content_en) ||
          (lang === "ar"
            ? "أُفُق البصرة: موزّع معتمد لحلول MikroTik و Ruijie و Must في العراق — شبكات، طاقة شمسية، UPS، ومشاريع بنية تحتية لتكنولوجيا المعلومات."
            : "UFUK AL-Basra: authorized distributor of MikroTik, Ruijie and Must in Iraq — networking, solar energy, UPS and IT infrastructure projects.")
        }
        path="/about"
        image={page?.cover_url || undefined}
      />
      {/* Hero with large logo */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, hsl(var(--primary)) 0, transparent 40%), radial-gradient(circle at 80% 70%, hsl(var(--primary-glow)) 0, transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                {t("about_subtitle")}
              </div>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-6xl">
                <span className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
                  {title}
                </span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">{t("brand_tagline")}</p>
            </div>
            <div className="order-1 flex justify-center md:order-2">
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute -inset-8 rounded-full bg-gradient-to-br from-primary/30 via-primary/10 to-transparent blur-3xl"
                />
                <div className="relative flex h-64 w-64 items-center justify-center rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_20px_60px_-20px_hsl(217_91%_32%/0.4)] backdrop-blur-xl md:h-80 md:w-80">
                  <img src={logo} alt={t("brand")} className="h-full w-full object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Optional cover image */}
      {page?.cover_url && (
        <section className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="-mt-8 overflow-hidden rounded-2xl border shadow-elegant md:-mt-12">
            <img src={page.cover_url} alt="" className="h-64 w-full object-cover md:h-96" />
          </div>
        </section>
      )}

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 py-16 md:px-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : content && content.trim() !== "" ? (
          <article
            dir={lang === "ar" ? "rtl" : "ltr"}
            className="prose prose-lg max-w-none text-foreground/90 [&_h1]:text-3xl [&_h2]:text-2xl [&_h3]:text-xl [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline [&_img]:rounded-xl [&_img]:my-6 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ps-6 [&_ol]:ps-6"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }}
          />
        ) : (
          <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
            {t("about_empty")}
          </div>
        )}
      </section>
    </div>
  );
}

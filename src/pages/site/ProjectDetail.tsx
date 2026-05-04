import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, MapPin, User, Calendar } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { sanitizeHTML } from "@/components/admin/RichTextEditor";

type Project = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  summary_ar: string | null;
  summary_en: string | null;
  body_ar: string | null;
  body_en: string | null;
  cover_url: string | null;
  gallery: string[];
  client: string | null;
  location: string | null;
  completed_at: string | null;
};

export default function ProjectDetail() {
  const { slug } = useParams();
  const { t, lang } = useLanguage();
  const [p, setP] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle()
      .then(({ data }) => {
        setP((data as Project) ?? null);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (p) document.title = `${lang === "ar" ? p.title_ar : p.title_en} — ${t("projects_title")}`;
  }, [p, lang, t]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <Skeleton className="mb-6 h-10 w-2/3" />
        <Skeleton className="mb-8 h-72 w-full" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center md:px-6">
        <p className="text-muted-foreground">{t("projects_empty")}</p>
        <Link to="/projects" className="mt-4 inline-flex items-center gap-2 text-primary">
          {lang === "ar" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          {t("project_back")}
        </Link>
      </div>
    );
  }

  const title = lang === "ar" ? p.title_ar : p.title_en;
  const summary = lang === "ar" ? p.summary_ar : p.summary_en;
  const body = lang === "ar" ? p.body_ar : p.body_en;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <Link
        to="/projects"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        {lang === "ar" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
        {t("project_back")}
      </Link>

      <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">{title}</h1>
      {summary && <p className="mt-3 text-lg text-muted-foreground">{summary}</p>}

      <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
        {p.client && (
          <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" />{t("project_client")}: <strong className="text-foreground">{p.client}</strong></span>
        )}
        {p.location && (
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{t("project_location")}: <strong className="text-foreground">{p.location}</strong></span>
        )}
        {p.completed_at && (
          <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{t("project_completed")}: <strong className="text-foreground">{new Date(p.completed_at).toLocaleDateString(lang === "ar" ? "ar" : "en")}</strong></span>
        )}
      </div>

      {p.cover_url && (
        <div className="mt-8 overflow-hidden rounded-2xl border shadow-elegant">
          <img src={p.cover_url} alt={title} className="h-72 w-full object-cover md:h-[440px]" />
        </div>
      )}

      {body && body.trim() !== "" && (
        <article
          dir={lang === "ar" ? "rtl" : "ltr"}
          className="prose prose-lg mt-10 max-w-none text-foreground/90 [&_h1]:text-3xl [&_h2]:text-2xl [&_h3]:text-xl [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-primary [&_a]:underline [&_img]:rounded-xl [&_img]:my-6 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ps-6 [&_ol]:ps-6"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(body) }}
        />
      )}

      {p.gallery && p.gallery.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold">{t("project_gallery")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {p.gallery.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-xl border bg-secondary">
                <img src={url} alt="" className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

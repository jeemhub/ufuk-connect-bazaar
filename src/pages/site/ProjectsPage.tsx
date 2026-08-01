import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, ImageIcon } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Seo, SITE_NAME } from "@/components/seo/Seo";

type Project = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  summary_ar: string | null;
  summary_en: string | null;
  cover_url: string | null;
  client: string | null;
  location: string | null;
  completed_at: string | null;
};

export default function ProjectsPage() {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `${t("projects_title")} — ${t("brand")}`;
    supabase
      .from("projects")
      .select("id,slug,title_ar,title_en,summary_ar,summary_en,cover_url,client,location,completed_at")
      .eq("is_published", true)
      .order("sort", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data ?? []) as Project[]);
        setLoading(false);
      });
  }, [t]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <Seo
        title={lang === "ar" ? `مشاريعنا المنفّذة | ${SITE_NAME}` : `Our Projects | ${SITE_NAME}`}
        description={
          lang === "ar"
            ? "مشاريع منفّذة من أُفُق البصرة: منظومات طاقة شمسية، شبكات ألياف ضوئية، أنظمة UPS وبنية تحتية لتكنولوجيا المعلومات في العراق."
            : "Completed projects by UFUK AL-Basra: solar power systems, fiber networks, UPS systems and IT infrastructure across Iraq."
        }
        path="/projects"
      />
      <div className="mb-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          {t("nav_projects")}
        </div>
        <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">{t("projects_title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("projects_subtitle")}</p>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">{t("projects_empty")}</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => {
            const title = lang === "ar" ? p.title_ar : p.title_en;
            const summary = lang === "ar" ? p.summary_ar : p.summary_en;
            return (
              <Link
                key={p.id}
                to={`/projects/${p.slug}`}
                className="surface-card group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-elegant"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-secondary">
                  {p.cover_url ? (
                    <img
                      src={p.cover_url}
                      alt={title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-brand text-primary-foreground">
                      <ImageIcon className="h-10 w-10 opacity-60" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card via-card/40 to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="line-clamp-2 text-lg font-bold">{title}</h3>
                  {summary && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{summary}</p>}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {p.client && <span>👤 {p.client}</span>}
                    {p.location && <span>📍 {p.location}</span>}
                    {p.completed_at && <span>📅 {new Date(p.completed_at).getFullYear()}</span>}
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    {t("project_view")}
                    {lang === "ar" ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

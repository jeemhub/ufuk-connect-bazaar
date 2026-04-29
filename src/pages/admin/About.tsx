import { useEffect, useState } from "react";
import { Save, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

type Page = {
  id: string;
  key: string;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  cover_url: string | null;
};

export default function AdminAbout() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [page, setPage] = useState<Page | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    document.title = `${t("admin_about_title")} — ${t("admin_panel")}`;
    supabase
      .from("site_pages")
      .select("*")
      .eq("key", "about")
      .maybeSingle()
      .then(({ data }) => setPage((data as Page) ?? null));
  }, [t]);

  const update = (patch: Partial<Page>) => setPage((p) => (p ? { ...p, ...patch } : p));

  const onCover = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `about/${user?.id ?? "admin"}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("project-images").upload(path, file, { upsert: true, contentType: file.type });
      if (error) return toast.error(error.message);
      const { data } = supabase.storage.from("project-images").getPublicUrl(path);
      update({ cover_url: data.publicUrl });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!page) return;
    setSaving(true);
    const { error } = await supabase
      .from("site_pages")
      .update({
        title_ar: page.title_ar,
        title_en: page.title_en,
        content_ar: page.content_ar,
        content_en: page.content_en,
        cover_url: page.cover_url,
        updated_by: user?.id ?? null,
      })
      .eq("id", page.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("saved"));
  };

  if (!page) return <div className="p-8 text-center text-muted-foreground">…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("admin_about_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin_about_sub")}</p>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2 bg-gradient-brand">
          <Save className="h-4 w-4" />
          {saving ? "…" : t("admin_blog_save")}
        </Button>
      </div>

      <div className="surface-card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>{t("admin_blog_title_ar")}</Label>
            <Input dir="rtl" value={page.title_ar} onChange={(e) => update({ title_ar: e.target.value })} />
          </div>
          <div>
            <Label>{t("admin_blog_title_en")}</Label>
            <Input value={page.title_en} onChange={(e) => update({ title_en: e.target.value })} />
          </div>
        </div>

        <div>
          <Label>{t("field_cover")}</Label>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-20 w-32 shrink-0 overflow-hidden rounded border bg-secondary">
              {page.cover_url ? (
                <img src={page.cover_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
            </div>
            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
              className="max-w-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onCover(f);
                e.target.value = "";
              }}
            />
            {page.cover_url && (
              <Button type="button" variant="outline" size="sm" onClick={() => update({ cover_url: null })}>
                {t("remove")}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="ar" className="surface-card p-4">
        <TabsList>
          <TabsTrigger value="ar">العربية</TabsTrigger>
          <TabsTrigger value="en">English</TabsTrigger>
        </TabsList>
        <TabsContent value="ar" className="mt-3">
          <RichTextEditor
            value={page.content_ar}
            onChange={(html) => update({ content_ar: html })}
            dir="rtl"
            placeholder="اكتب محتوى صفحة من نحن..."
            minHeight={420}
          />
        </TabsContent>
        <TabsContent value="en" className="mt-3">
          <RichTextEditor
            value={page.content_en}
            onChange={(html) => update({ content_en: html })}
            dir="ltr"
            placeholder="Write the About page content..."
            minHeight={420}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

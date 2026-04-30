import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

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
  is_published: boolean;
  sort: number;
};

const blank: Omit<Project, "id"> = {
  slug: "",
  title_ar: "",
  title_en: "",
  summary_ar: "",
  summary_en: "",
  body_ar: "",
  body_en: "",
  cover_url: "",
  gallery: [],
  client: "",
  location: "",
  completed_at: null,
  is_published: false,
  sort: 0,
};

export default function AdminProjects() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<Omit<Project, "id">>({ ...blank });
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("projects").select("*").order("sort", { ascending: true }).order("created_at", { ascending: false });
    setItems((data ?? []) as Project[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    document.title = `${t("admin_projects_title")} — ${t("admin_panel")}`;
    refresh();
  }, [t, refresh]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...blank });
    setOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      slug: p.slug,
      title_ar: p.title_ar,
      title_en: p.title_en,
      summary_ar: p.summary_ar ?? "",
      summary_en: p.summary_en ?? "",
      body_ar: p.body_ar ?? "",
      body_en: p.body_en ?? "",
      cover_url: p.cover_url ?? "",
      gallery: p.gallery ?? [],
      client: p.client ?? "",
      location: p.location ?? "",
      completed_at: p.completed_at,
      is_published: p.is_published,
      sort: p.sort,
    });
    setOpen(true);
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${folder}/${user?.id ?? "admin"}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await supabase.storage.from("project-images").upload(path, file, { upsert: false, contentType: file.type, cacheControl: "31536000" });
    if (error) {
      toast.error(error.message);
      return null;
    }
    const { data } = supabase.storage.from("project-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const onCover = async (file: File) => {
    setUploadingCover(true);
    const url = await uploadFile(file, "cover");
    if (url) setForm((f) => ({ ...f, cover_url: url }));
    setUploadingCover(false);
  };

  const onGalleryAdd = async (files: FileList) => {
    setUploadingGallery(true);
    const uploaded: string[] = [];
    for (const f of Array.from(files)) {
      const url = await uploadFile(f, "gallery");
      if (url) uploaded.push(url);
    }
    if (uploaded.length) setForm((f) => ({ ...f, gallery: [...f.gallery, ...uploaded] }));
    setUploadingGallery(false);
  };

  const removeGallery = (idx: number) =>
    setForm((f) => ({ ...f, gallery: f.gallery.filter((_, i) => i !== idx) }));

  const save = async () => {
    if (!form.slug || !form.title_ar || !form.title_en) {
      toast.error(lang === "ar" ? "العنوان والمعرّف مطلوب" : "Slug & titles required");
      return;
    }
    setSaving(true);
    const payload = { ...form, author_id: user?.id ?? null };
    let err;
    if (editing) {
      ({ error: err } = await supabase.from("projects").update(payload).eq("id", editing.id));
    } else {
      ({ error: err } = await supabase.from("projects").insert(payload));
    }
    setSaving(false);
    if (err) return toast.error(err.message);
    toast.success(t("saved"));
    setOpen(false);
    refresh();
  };

  const remove = async (p: Project) => {
    if (!confirm(lang === "ar" ? "هل تريد حذف هذا المشروع؟" : "Delete this project?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("✓");
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin_projects_title")}</h1>
        </div>
        <Button onClick={openNew} className="gap-2 bg-gradient-brand">
          <Plus className="h-4 w-4" />
          {t("admin_projects_new")}
        </Button>
      </div>

      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">{t("projects_empty")}</div>
        ) : (
          <div className="divide-y">
            {items.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-secondary">
                  {p.cover_url ? (
                    <img src={p.cover_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate font-semibold">{lang === "ar" ? p.title_ar : p.title_en}</div>
                    <Badge variant={p.is_published ? "default" : "secondary"}>
                      {p.is_published ? t("admin_blog_status_published") : t("admin_blog_status_draft")}
                    </Badge>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">/{p.slug}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(p)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t("admin_projects_edit") : t("admin_projects_new")}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>{t("admin_blog_slug")}</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                />
              </div>
              <div className="flex items-end gap-3 rounded-md border p-2">
                <div className="flex flex-1 items-center gap-2">
                  <Switch
                    checked={form.is_published}
                    onCheckedChange={(v) => setForm({ ...form, is_published: v })}
                  />
                  <Label className="m-0">{t("field_published")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="m-0 text-xs">Sort</Label>
                  <Input
                    type="number"
                    className="w-20"
                    value={form.sort}
                    onChange={(e) => setForm({ ...form, sort: parseInt(e.target.value || "0") })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>{t("admin_blog_title_ar")}</Label>
                <Input dir="rtl" value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
              </div>
              <div>
                <Label>{t("admin_blog_title_en")}</Label>
                <Input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>{t("project_client")}</Label>
                <Input value={form.client ?? ""} onChange={(e) => setForm({ ...form, client: e.target.value })} />
              </div>
              <div>
                <Label>{t("project_location")}</Label>
                <Input value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <Label>{t("project_completed")}</Label>
                <Input
                  type="date"
                  value={form.completed_at ?? ""}
                  onChange={(e) => setForm({ ...form, completed_at: e.target.value || null })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>{t("field_summary_ar")}</Label>
                <Textarea dir="rtl" rows={2} value={form.summary_ar ?? ""} onChange={(e) => setForm({ ...form, summary_ar: e.target.value })} />
              </div>
              <div>
                <Label>{t("field_summary_en")}</Label>
                <Textarea rows={2} value={form.summary_en ?? ""} onChange={(e) => setForm({ ...form, summary_en: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>{t("field_cover")}</Label>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-20 w-32 shrink-0 overflow-hidden rounded border bg-secondary">
                  {form.cover_url ? (
                    <img src={form.cover_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  disabled={uploadingCover}
                  className="max-w-sm"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onCover(f);
                    e.target.value = "";
                  }}
                />
                {form.cover_url && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, cover_url: "" })}>
                    {t("remove")}
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label>{t("project_gallery")}</Label>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {form.gallery.map((url, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded border bg-secondary">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGallery(idx)}
                      className="absolute end-1 top-1 rounded-full bg-destructive/90 p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed text-xs text-muted-foreground hover:bg-secondary">
                  <Plus className="h-5 w-5" />
                  {t("add_image")}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={uploadingGallery}
                    onChange={(e) => {
                      if (e.target.files?.length) onGalleryAdd(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>

            <Tabs defaultValue="ar">
              <TabsList>
                <TabsTrigger value="ar">{t("field_body_ar")}</TabsTrigger>
                <TabsTrigger value="en">{t("field_body_en")}</TabsTrigger>
              </TabsList>
              <TabsContent value="ar" className="mt-3">
                <RichTextEditor
                  value={form.body_ar ?? ""}
                  onChange={(html) => setForm({ ...form, body_ar: html })}
                  dir="rtl"
                  placeholder="اكتب تفاصيل المشروع..."
                  minHeight={360}
                />
              </TabsContent>
              <TabsContent value="en" className="mt-3">
                <RichTextEditor
                  value={form.body_en ?? ""}
                  onChange={(html) => setForm({ ...form, body_en: html })}
                  dir="ltr"
                  placeholder="Write the project story..."
                  minHeight={360}
                />
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("admin_blog_cancel")}
            </Button>
            <Button onClick={save} disabled={saving} className="bg-gradient-brand">
              {t("admin_blog_save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

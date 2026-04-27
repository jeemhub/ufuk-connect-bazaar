import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Image as ImageIcon, Star, Crop, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAllPostsAdmin, BlogPost } from "@/hooks/useBlog";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { Dropzone } from "@/components/ui/dropzone";
import { Upload } from "lucide-react";

const blank = {
  slug: "",
  title_ar: "",
  title_en: "",
  excerpt_ar: "",
  excerpt_en: "",
  body_ar: "",
  body_en: "",
  cover_url: "",
  status: "draft" as "draft" | "published",
  is_featured: false,
  featured_sort: 0,
};

export default function AdminBlog() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { posts, loading, refresh } = useAllPostsAdmin();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  useEffect(() => {
    document.title = `${t("admin_blog_title")} — ${t("admin_panel")}`;
  }, [t]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...blank });
    setOpen(true);
  };
  const openEdit = (p: BlogPost) => {
    setEditing(p);
    setForm({
      slug: p.slug,
      title_ar: p.title_ar,
      title_en: p.title_en,
      excerpt_ar: p.excerpt_ar ?? "",
      excerpt_en: p.excerpt_en ?? "",
      body_ar: p.body_ar ?? "",
      body_en: p.body_en ?? "",
      cover_url: p.cover_url ?? "",
      status: (p.status as any) ?? "draft",
      is_featured: p.is_featured,
      featured_sort: p.featured_sort,
    });
    setOpen(true);
  };

  const onPickFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const uploadDataUrl = async (dataUrl: string) => {
    setUploading(true);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const path = `${user?.id ?? "admin"}/${Date.now()}-cover.jpg`;
      const { error } = await supabase.storage
        .from("blog-images")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) { toast.error(error.message); return; }
      const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
      setForm((f) => ({ ...f, cover_url: data.publicUrl }));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.slug || !form.title_ar || !form.title_en) {
      toast.error(lang === "ar" ? "العنوان والمعرّف مطلوب" : "Slug & titles required");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      author_id: user?.id ?? null,
      published_at: form.status === "published" ? (editing?.published_at ?? new Date().toISOString()) : null,
    };
    let err;
    if (editing) {
      ({ error: err } = await supabase.from("blog_posts").update(payload).eq("id", editing.id));
    } else {
      ({ error: err } = await supabase.from("blog_posts").insert(payload));
    }
    setSaving(false);
    if (err) return toast.error(err.message);
    toast.success(t("admin_blog_save"));
    setOpen(false);
    refresh();
  };

  const remove = async (p: BlogPost) => {
    if (!confirm(t("admin_blog_confirm_delete"))) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("✓");
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin_blog_title")}</h1>
        </div>
        <Button onClick={openNew} className="gap-2 bg-gradient-brand">
          <Plus className="h-4 w-4" />{t("admin_blog_new")}
        </Button>
      </div>

      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">…</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">{t("blog_no_posts")}</div>
        ) : (
          <div className="divide-y">
            {posts.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-secondary">
                  {p.cover_url ? <img src={p.cover_url} alt="" className="h-full w-full object-cover" /> :
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-semibold truncate">{lang === "ar" ? p.title_ar : p.title_en}</div>
                    <Badge variant={p.status === "published" ? "default" : "secondary"}>
                      {p.status === "published" ? t("admin_blog_status_published") : t("admin_blog_status_draft")}
                    </Badge>
                    {p.is_featured && <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20"><Star className="h-3 w-3" /> Hero</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">/{p.slug}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t("admin_blog_edit") : t("admin_blog_new")}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>{t("admin_blog_slug")}</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} />
              </div>
              <div>
                <Label>{t("admin_blog_status")}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t("admin_blog_status_draft")}</SelectItem>
                    <SelectItem value="published">{t("admin_blog_status_published")}</SelectItem>
                  </SelectContent>
                </Select>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>{t("admin_blog_excerpt_ar")}</Label>
                <Textarea dir="rtl" rows={2} value={form.excerpt_ar} onChange={(e) => setForm({ ...form, excerpt_ar: e.target.value })} />
              </div>
              <div>
                <Label>{t("admin_blog_excerpt_en")}</Label>
                <Textarea rows={2} value={form.excerpt_en} onChange={(e) => setForm({ ...form, excerpt_en: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>{t("admin_blog_body_ar")}</Label>
                <Textarea dir="rtl" rows={8} value={form.body_ar} onChange={(e) => setForm({ ...form, body_ar: e.target.value })} />
              </div>
              <div>
                <Label>{t("admin_blog_body_en")}</Label>
                <Textarea rows={8} value={form.body_en} onChange={(e) => setForm({ ...form, body_en: e.target.value })} />
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t("admin_blog_cover")}</Label>
              <Dropzone
                accept="image/*"
                onFiles={(files) => onPickFile(files[0])}
                disabled={uploading}
                overlayLabel={t("drop_to_upload")}
              >
                <div className="flex flex-col gap-3 rounded-md border border-dashed border-input p-3 sm:flex-row sm:items-center sm:flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    <span>{t("drop_file_here")}</span>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    className="max-w-xs"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onPickFile(f);
                      e.target.value = "";
                    }}
                  />
                  {form.cover_url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => { setCropSrc(form.cover_url); setCropOpen(true); }}
                    >
                      <Crop className="h-4 w-4" />
                      {t("crop_image")}
                    </Button>
                  )}
                  {uploading && (
                    <span className="text-xs text-muted-foreground">…</span>
                  )}
                </div>
              </Dropzone>

              {/* Live preview — how the post will appear on the homepage hero */}
              {form.cover_url && (
                <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-card">
                  <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2">
                    <div className="text-xs font-semibold text-muted-foreground">
                      {lang === "ar" ? "معاينة كما سيظهر للزوار" : "Preview as visitors will see it"}
                    </div>
                    <Badge variant="secondary" className="gap-1 text-[10px]">
                      <Sparkles className="h-3 w-3" /> Hero
                    </Badge>
                  </div>
                  <div className="grid md:grid-cols-12 gap-0 items-stretch min-h-[260px]">
                    <div className="relative md:col-span-7 overflow-hidden">
                      <img
                        src={form.cover_url}
                        alt=""
                        className="h-48 md:h-full w-full object-cover"
                      />
                      <div
                        aria-hidden
                        className={`absolute inset-0 bg-gradient-to-t md:bg-gradient-to-${
                          lang === "ar" ? "l" : "r"
                        } from-card via-card/40 md:via-card/10 to-transparent`}
                      />
                    </div>
                    <div className="md:col-span-5 flex flex-col justify-center p-5 md:p-7">
                      <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                        <Sparkles className="h-3 w-3" />
                        {t("blog_title")}
                      </div>
                      <h3 className="mt-3 text-lg md:text-2xl font-extrabold leading-tight">
                        {(lang === "ar" ? form.title_ar : form.title_en) ||
                          (lang === "ar" ? "عنوان المنشور" : "Post title")}
                      </h3>
                      {(lang === "ar" ? form.excerpt_ar : form.excerpt_en) && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                          {lang === "ar" ? form.excerpt_ar : form.excerpt_en}
                        </p>
                      )}
                      <div className="mt-4">
                        <span className="inline-flex items-center gap-2 rounded-md bg-gradient-brand px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                          {t("blog_read_more")}
                          {lang === "ar" ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
              <div>
                <Label className="m-0">{t("admin_blog_featured")}</Label>
              </div>
              {form.is_featured && (
                <div className="ms-auto flex items-center gap-2">
                  <Label className="text-xs">Sort</Label>
                  <Input type="number" className="w-20" value={form.featured_sort}
                    onChange={(e) => setForm({ ...form, featured_sort: parseInt(e.target.value || "0") })} />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("admin_blog_cancel")}</Button>
            <Button onClick={save} disabled={saving} className="bg-gradient-brand">{t("admin_blog_save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {cropSrc && (
        <ImageCropper
          open={cropOpen}
          src={cropSrc}
          aspect={16 / 10}
          onClose={() => setCropOpen(false)}
          onCropped={(url) => uploadDataUrl(url)}
        />
      )}
    </div>
  );
}

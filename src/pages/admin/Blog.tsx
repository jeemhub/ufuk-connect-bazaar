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

  const onUpload = async (file: File) => {
    setUploading(true);
    const path = `${user?.id ?? "admin"}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    setForm((f) => ({ ...f, cover_url: data.publicUrl }));
    setUploading(false);
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

            <div>
              <Label>{t("admin_blog_cover")}</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.cover_url && <img src={form.cover_url} alt="" className="h-20 w-32 rounded object-cover" />}
                <Input type="file" accept="image/*" disabled={uploading}
                  onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
              </div>
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
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Image as ImageIcon, Loader2, Upload, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBrands, type Brand } from "@/hooks/useBrands";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminBrands() {
  const { t } = useLanguage();
  const { brands, loading, refresh } = useBrands({ activeOnly: false });

  const [editing, setEditing] = useState<Brand | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Brand | null>(null);

  const openNew = () => {
    setEditing({
      id: "",
      name: "",
      slug: "",
      logo_url: null,
      description: null,
      is_active: true,
      sort: (brands?.length ?? 0) + 1,
      created_at: "",
      updated_at: "",
    });
    setOpen(true);
  };

  const openEdit = (b: Brand) => {
    setEditing({ ...b });
    setOpen(true);
  };

  const handleDelete = async (b: Brand) => {
    const { error } = await supabase.from("brands").delete().eq("id", b.id);
    if (error) {
      toast.error(t("error_generic"));
    } else {
      toast.success(t("saved"));
      refresh();
    }
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("brands_admin_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("brands_admin_sub")}</p>
        </div>
        <Button onClick={openNew} className="gap-2 bg-gradient-brand">
          <Plus className="h-4 w-4" /> {t("add_brand")}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(brands ?? []).map((b) => (
            <div key={b.id} className="surface-card group overflow-hidden">
              <div className="flex h-32 items-center justify-center border-b border-border/60 bg-secondary/40">
                {b.logo_url ? (
                  <img src={b.logo_url} alt={b.name} className="max-h-20 w-auto object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                    <span className="text-xs">{t("no_logo")}</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-bold">{b.name}</div>
                    <div className="truncate text-xs text-muted-foreground">/{b.slug}</div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${b.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {b.is_active ? t("is_active") : "—"}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => openEdit(b)}>
                    <Pencil className="h-3.5 w-3.5" /> {t("edit_brand")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setConfirmDelete(b)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <BrandEditor
          open={open}
          onClose={() => setOpen(false)}
          brand={editing}
          onSaved={() => {
            setOpen(false);
            refresh();
          }}
        />
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_brand")}</AlertDialogTitle>
            <AlertDialogDescription>{t("delete_brand_confirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              {t("delete_brand")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BrandEditor({
  open,
  onClose,
  brand,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  brand: Brand;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<Brand>(brand);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setForm(brand), [brand]);

  const onFileChosen = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadCropped = async (dataUrl: string) => {
    setUploading(true);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const path = `${form.slug || slugify(form.name) || "brand"}-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("brand-logos")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("brand-logos").getPublicUrl(path);
      setForm((f) => ({ ...f, logo_url: data.publicUrl }));
      toast.success(t("saved"));
    } catch {
      toast.error(t("error_generic"));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error(t("error_generic"));
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      logo_url: form.logo_url,
      description: form.description,
      is_active: form.is_active,
      sort: form.sort,
    };
    const res = form.id
      ? await supabase.from("brands").update(payload).eq("id", form.id)
      : await supabase.from("brands").insert(payload);
    setSaving(false);
    if (res.error) {
      toast.error(res.error.message || t("error_generic"));
      return;
    }
    toast.success(t("saved"));
    onSaved();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{form.id ? t("edit_brand") : t("add_brand")}</DialogTitle>
            <DialogDescription>{t("brands_admin_sub")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t("brand_name")}</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      name: e.target.value,
                      slug: f.slug || slugify(e.target.value),
                    }))
                  }
                  placeholder="MikroTik"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("brand_slug")}</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="mikrotik"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("brand_description")}</Label>
                <Textarea
                  rows={3}
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{t("sort_order")}</Label>
                  <Input
                    type="number"
                    value={form.sort}
                    onChange={(e) => setForm((f) => ({ ...f, sort: Number(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-end justify-between rounded-md border border-border/60 px-3 py-2">
                  <Label className="text-sm">{t("is_active")}</Label>
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t("brand_logo")}</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFileChosen(f);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {t("upload_logo")}
                </Button>
                {form.logo_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full gap-2"
                    onClick={async () => {
                      // re-crop existing logo
                      try {
                        const blob = await (await fetch(form.logo_url!)).blob();
                        const reader = new FileReader();
                        reader.onload = () => setCropSrc(reader.result as string);
                        reader.readAsDataURL(blob);
                      } catch {
                        toast.error(t("error_generic"));
                      }
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> {t("crop_logo")}
                  </Button>
                )}
              </div>
            </div>

            {/* Live preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Eye className="h-3.5 w-3.5" /> {t("preview_card")}
              </div>
              <div className="rounded-xl border border-border/60 bg-gradient-to-b from-secondary/40 via-background to-secondary/30 p-6">
                <div className="flex h-24 items-center justify-center rounded-lg border border-border/60 bg-card px-6 shadow-sm">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt={form.name || "logo"} className="max-h-16 w-auto object-contain" />
                  ) : (
                    <span className="text-xl font-extrabold tracking-tight text-foreground/80">
                      {form.name || t("no_logo")}
                    </span>
                  )}
                </div>
                <div className="mt-3 text-center text-xs text-muted-foreground">
                  {form.name || "—"} · /{form.slug || "—"}
                </div>
              </div>

              {/* Marquee-style preview to mirror real rendering */}
              <div className="rounded-xl border border-dashed border-border/60 p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("preview")}</div>
                <div className="mt-2 flex h-20 w-full items-center justify-center rounded-lg border border-border/60 bg-card px-6">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt={form.name} className="max-h-12 w-auto object-contain opacity-90" />
                  ) : (
                    <span className="font-extrabold text-xl text-foreground/80">{form.name || "—"}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>{t("cancel")}</Button>
            <Button onClick={save} disabled={saving} className="gap-2 bg-gradient-brand">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {cropSrc && (
        <ImageCropper
          open={!!cropSrc}
          src={cropSrc}
          aspect={16 / 9}
          onClose={() => setCropSrc(null)}
          onCropped={(url) => uploadCropped(url)}
        />
      )}
    </>
  );
}

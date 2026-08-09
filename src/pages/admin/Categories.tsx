import { useEffect, useState } from "react";
import { Plus, FolderTree, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Category = {
  id: string;
  key: string;
  name_ar: string;
  name_en: string;
  sort: number;
};

type Subcategory = {
  id: string;
  category_id: string;
  name_ar: string;
  name_en: string;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || `cat-${Date.now()}`;
}

export default function Categories() {
  const { t, lang } = useLanguage();
  const [cats, setCats] = useState<Category[]>([]);
  const [subs, setSubs] = useState<Subcategory[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Add/Edit category dialog
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catNameAr, setCatNameAr] = useState("");
  const [catNameEn, setCatNameEn] = useState("");
  const [catKey, setCatKey] = useState("");
  const [saving, setSaving] = useState(false);

  // Add subcategory inline state
  const [addSubFor, setAddSubFor] = useState<string | null>(null);
  const [subNameAr, setSubNameAr] = useState("");
  const [subNameEn, setSubNameEn] = useState("");

  async function load() {
    setLoading(true);
    const [{ data: c }, { data: s }, { data: p }] = await Promise.all([
      supabase.from("categories").select("*").order("sort", { ascending: true }),
      supabase.from("subcategories").select("*"),
      supabase.from("products").select("category_id"),
    ]);
    setCats((c as Category[]) ?? []);
    setSubs((s as Subcategory[]) ?? []);
    const ct: Record<string, number> = {};
    (p ?? []).forEach((row: any) => {
      if (row.category_id) ct[row.category_id] = (ct[row.category_id] ?? 0) + 1;
    });
    setCounts(ct);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openAddCat() {
    setEditingCat(null);
    setCatNameAr("");
    setCatNameEn("");
    setCatKey("");
    setCatDialogOpen(true);
  }

  function openEditCat(c: Category) {
    setEditingCat(c);
    setCatNameAr(c.name_ar);
    setCatNameEn(c.name_en);
    setCatKey(c.key);
    setCatDialogOpen(true);
  }

  async function saveCat() {
    if (!catNameAr.trim() && !catNameEn.trim()) {
      toast.error(lang === "ar" ? "أدخل اسم القسم" : "Enter category name");
      return;
    }
    setSaving(true);
    const key = catKey.trim() || slugify(catNameEn || catNameAr);
    if (editingCat) {
      const { error } = await supabase
        .from("categories")
        .update({ name_ar: catNameAr, name_en: catNameEn, key })
        .eq("id", editingCat.id);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(lang === "ar" ? "تم التحديث" : "Updated");
        setCatDialogOpen(false);
        await load();
      }
    } else {
      const { error } = await supabase
        .from("categories")
        .insert({ name_ar: catNameAr, name_en: catNameEn, key, sort: cats.length });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(lang === "ar" ? "تمت الإضافة" : "Added");
        setCatDialogOpen(false);
        await load();
      }
    }
    setSaving(false);
  }

  async function deleteCat(c: Category) {
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) toast.error(error.message);
    else {
      toast.success(lang === "ar" ? "تم الحذف" : "Deleted");
      await load();
    }
  }

  async function addSubcat(catId: string) {
    if (!subNameAr.trim() && !subNameEn.trim()) return;
    const { error } = await supabase
      .from("subcategories")
      .insert({ category_id: catId, name_ar: subNameAr, name_en: subNameEn });
    if (error) toast.error(error.message);
    else {
      setSubNameAr("");
      setSubNameEn("");
      setAddSubFor(null);
      await load();
    }
  }

  async function deleteSub(id: string) {
    const { error } = await supabase.from("subcategories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("categories_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("categories_subtitle")}</p>
        </div>
        <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-brand" onClick={openAddCat}>
              <Plus className="h-4 w-4" /> {t("add_category")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCat
                  ? lang === "ar" ? "تعديل القسم" : "Edit category"
                  : lang === "ar" ? "إضافة قسم" : "Add category"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>{lang === "ar" ? "الاسم بالعربية" : "Name (Arabic)"}</Label>
                <Input value={catNameAr} onChange={(e) => setCatNameAr(e.target.value)} />
              </div>
              <div>
                <Label>{lang === "ar" ? "الاسم بالإنجليزية" : "Name (English)"}</Label>
                <Input value={catNameEn} onChange={(e) => setCatNameEn(e.target.value)} />
              </div>
              <div>
                <Label>{lang === "ar" ? "المعرّف (اختياري)" : "Key (optional)"}</Label>
                <Input value={catKey} onChange={(e) => setCatKey(e.target.value)} placeholder="auto" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCatDialogOpen(false)}>
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={saveCat} disabled={saving} className="bg-gradient-brand">
                {lang === "ar" ? "حفظ" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">{lang === "ar" ? "جارٍ التحميل..." : "Loading..."}</div>
      ) : cats.length === 0 ? (
        <div className="surface-card p-10 text-center text-sm text-muted-foreground">
          {lang === "ar" ? "لا توجد أقسام بعد" : "No categories yet"}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cats.map((c) => {
            const catSubs = subs.filter((s) => s.category_id === c.id);
            const count = counts[c.id] ?? 0;
            return (
              <div key={c.id} className="surface-card overflow-hidden">
                <div className="bg-gradient-brand p-5 text-primary-foreground">
                  <div className="flex items-start justify-between">
                    <FolderTree className="h-6 w-6 opacity-80" />
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditCat(c)}
                        className="rounded p-1.5 hover:bg-white/20"
                        title={lang === "ar" ? "تعديل" : "Edit"}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteCat(c)}
                        className="rounded p-1.5 hover:bg-white/20"
                        title={lang === "ar" ? "حذف" : "Delete"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="mt-3 text-lg font-bold">{lang === "ar" ? c.name_ar : c.name_en}</h3>
                  <div className="mt-1 text-xs opacity-80">{count} {t("products_count")}</div>
                </div>
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("subcategories")}</div>
                    <button
                      onClick={() => {
                        setAddSubFor(addSubFor === c.id ? null : c.id);
                        setSubNameAr("");
                        setSubNameEn("");
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      {addSubFor === c.id ? (lang === "ar" ? "إلغاء" : "Cancel") : (lang === "ar" ? "+ إضافة" : "+ Add")}
                    </button>
                  </div>
                  {addSubFor === c.id && (
                    <div className="mb-3 space-y-2 rounded-md border p-2">
                      <Input
                        placeholder={lang === "ar" ? "الاسم بالعربية" : "Arabic name"}
                        value={subNameAr}
                        onChange={(e) => setSubNameAr(e.target.value)}
                      />
                      <Input
                        placeholder={lang === "ar" ? "الاسم بالإنجليزية" : "English name"}
                        value={subNameEn}
                        onChange={(e) => setSubNameEn(e.target.value)}
                      />
                      <Button size="sm" className="w-full" onClick={() => addSubcat(c.id)}>
                        {lang === "ar" ? "حفظ" : "Save"}
                      </Button>
                    </div>
                  )}
                  {catSubs.length === 0 ? (
                    <div className="text-xs text-muted-foreground">{lang === "ar" ? "لا توجد فئات فرعية" : "No subcategories"}</div>
                  ) : (
                    <ul className="space-y-1.5">
                      {catSubs.map((s) => (
                        <li key={s.id} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 text-sm">
                          <span>{lang === "ar" ? s.name_ar : s.name_en}</span>
                          <button
                            onClick={() => deleteSub(s.id)}
                            className="text-muted-foreground hover:text-destructive"
                            title={lang === "ar" ? "حذف" : "Delete"}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

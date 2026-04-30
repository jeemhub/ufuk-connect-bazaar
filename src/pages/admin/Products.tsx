import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, FileText, Upload, X, ImagePlus, Crop as CropIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatIqd, categories, Product } from "@/data/mockData";
import { StockBadge } from "@/components/admin/StatusBadge";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { useAdminProducts, dbToProduct, type AdminProductRow } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dropzone } from "@/components/ui/dropzone";

const brands = ["MikroTik", "Ruijie", "Must", "Ubiquiti", "TP-Link"] as const;

type EditState = (Product & {
  is_active?: boolean;
  priceWholesale?: number;
  priceDealer?: number;
}) | null;

export default function Products() {
  const { t, lang } = useLanguage();
  const { rows, loading, refetch } = useAdminProducts();
  const list = useMemo(
    () => rows.map((r) => ({
      ...dbToProduct(r),
      is_active: r.is_active,
      priceWholesale: Number(r.price_wholesale_iqd ?? 0),
      priceDealer: Number(r.price_dealer_iqd ?? 0),
    })),
    [rows]
  );
  const [catMap, setCatMap] = useState<Record<string, string>>({}); // key -> uuid
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState<string>("all");
  const [cat, setCat] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditState>(null);
  const [datasheet, setDatasheet] = useState<{ url: string; name: string } | null>(null);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [rawImage, setRawImage] = useState<string>("");
  const [cropOpen, setCropOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("categories").select("id,key").then(({ data }) => {
      const map: Record<string, string> = {};
      (data ?? []).forEach((c: { id: string; key: string }) => { map[c.key] = c.id; });
      setCatMap(map);
    });
  }, []);

  useEffect(() => {
    if (open) {
      setDatasheet(editing?.datasheetUrl ? { url: editing.datasheetUrl, name: editing.datasheetName ?? "datasheet.pdf" } : null);
      setImageSrc(editing?.image ?? "");
      setRawImage("");
    }
  }, [open, editing]);

  const handleDatasheetFile = (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) { toast.error(t("datasheet_invalid")); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error(t("datasheet_too_large")); return; }
    setDatasheet({ url: URL.createObjectURL(file), name: file.name });
  };
  const onPickDatasheet = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (file) handleDatasheetFile(file);
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error(t("image_invalid")); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error(t("image_too_large")); return; }
    const reader = new FileReader();
    reader.onload = () => { setRawImage(String(reader.result || "")); setCropOpen(true); };
    reader.readAsDataURL(file);
  };
  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (file) handleImageFile(file);
  };

  async function uploadCroppedImage(dataUrl: string): Promise<string | null> {
    if (!dataUrl.startsWith("data:") && !dataUrl.startsWith("blob:")) return dataUrl; // already a URL
    const blob = await (await fetch(dataUrl)).blob();
    const ext = blob.type.split("/")[1] || "jpg";
    const path = `products/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, blob, {
      contentType: blob.type, upsert: false,
    });
    if (error) { toast.error(error.message); return null; }
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }

  const [searchParams] = useSearchParams();
  const lowStockOnly = searchParams.get("filter") === "low_stock";

  const filtered = useMemo(() => list.filter((p) => {
    const q = search.toLowerCase();
    const matches = !q || p.nameAr.includes(search) || p.nameEn.toLowerCase().includes(q);
    return matches
      && (brand === "all" || p.brand === brand)
      && (cat === "all" || p.category === cat)
      && (!lowStockOnly || p.stock < 5);
  }), [list, search, brand, cat, lowStockOnly]);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setOpen(true); };

  async function remove(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); refetch();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const f = new FormData(e.currentTarget);

    let finalImage = editing?.image ?? null;
    if (imageSrc && imageSrc !== editing?.image) {
      const uploaded = await uploadCroppedImage(imageSrc);
      if (!uploaded) { setSaving(false); return; }
      finalImage = uploaded;
    }

    const categoryKey = String(f.get("category") || "");
    const brandValue = String(f.get("brand") || "");
    const payload = {
      name_ar: String(f.get("nameAr") || ""),
      name_en: String(f.get("nameEn") || ""),
      desc_ar: String(f.get("descAr") || "") || null,
      desc_en: String(f.get("descEn") || "") || null,
      brand: brandValue && brandValue !== "__none__" ? brandValue : null,
      category_id: categoryKey && categoryKey !== "__none__" ? (catMap[categoryKey] ?? null) : null,
      subcategory: String(f.get("subcategory") || "") || null,
      price_iqd: Number(f.get("priceIqd") || 0),
      price_wholesale_iqd: Number(f.get("priceWholesale") || 0),
      price_dealer_iqd: Number(f.get("priceDealer") || 0),
      stock: Number(f.get("stock") || 0),
      image_url: finalImage,
      datasheet_url: datasheet?.url ?? null,
      datasheet_name: datasheet?.name ?? null,
      is_active: f.get("is_active") === "on",
    };

    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Updated" : "Created");
    setOpen(false); refetch();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("products_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("products_subtitle")}</p>
        </div>
        <Button onClick={openNew} className="gap-2 bg-gradient-brand shadow-elegant hover:opacity-95">
          <Plus className="h-4 w-4" /> {t("add_product")}
        </Button>
      </div>

      <div className="surface-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input placeholder={t("search_products")} value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger><SelectValue placeholder={t("all_brands")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all_brands")}</SelectItem>
              {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger><SelectValue placeholder={t("all_categories")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all_categories")}</SelectItem>
              {categories.map((c) => <SelectItem key={c.key} value={c.key}>{lang === "ar" ? c.ar : c.en}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-end text-sm text-muted-foreground">
            {filtered.length} / {list.length}
          </div>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">{t("product_image")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("product_name")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("product_brand")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("product_category")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("product_price")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("product_stock")}</th>
                <th className="px-4 py-3 text-end font-medium">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">…</td></tr>
              )}
              {!loading && filtered.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-secondary/30">
                  <td className="px-4 py-3"><img src={p.image} alt="" className="h-12 w-12 rounded-md border border-border object-cover" /></td>
                  <td className="px-4 py-3"><div className="font-medium">{lang === "ar" ? p.nameAr : p.nameEn}</div></td>
                  <td className="px-4 py-3">{p.brand}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.subcategory}</td>
                  <td className="px-4 py-3 font-semibold">{formatIqd(p.priceIqd)} {t("currency_iqd")}</td>
                  <td className="px-4 py-3"><StockBadge stock={p.stock} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="h-8 w-8 hover:text-primary"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(p.id)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t("edit_product") : t("new_product")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nameAr">{t("name_ar")}</Label>
              <Input id="nameAr" name="nameAr" defaultValue={editing?.nameAr} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nameEn">{t("name_en")}</Label>
              <Input id="nameEn" name="nameEn" defaultValue={editing?.nameEn} required />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="descAr">{t("description_ar")}</Label>
              <Textarea id="descAr" name="descAr" rows={2} defaultValue={editing?.descAr} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="descEn">{t("description_en")}</Label>
              <Textarea id="descEn" name="descEn" rows={2} defaultValue={editing?.descEn} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand">{t("product_brand")}</Label>
              <select id="brand" name="brand" defaultValue={editing?.brand ?? "__none__"} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="__none__">{lang === "ar" ? "بدون علامة" : "No brand"}</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">{t("product_category")}</Label>
              <select id="category" name="category" defaultValue={editing?.category ?? "__none__"} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="__none__">{lang === "ar" ? "بدون قسم" : "No category"}</option>
                {categories.map((c) => <option key={c.key} value={c.key}>{lang === "ar" ? c.ar : c.en}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subcategory">{t("subcategories")}</Label>
              <Input id="subcategory" name="subcategory" defaultValue={editing?.subcategory} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priceIqd">{t("price_retail")} ({t("currency_iqd")})</Label>
              <Input id="priceIqd" name="priceIqd" type="number" min="0" defaultValue={editing?.priceIqd ?? 0} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">{t("product_stock")}</Label>
              <Input id="stock" name="stock" type="number" min="0" defaultValue={editing?.stock ?? 0} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priceWholesale">{t("price_wholesale")} ({t("currency_iqd")})</Label>
              <Input id="priceWholesale" name="priceWholesale" type="number" min="0" defaultValue={editing?.priceWholesale ?? 0} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priceDealer">{t("price_dealer")} ({t("currency_iqd")})</Label>
              <Input id="priceDealer" name="priceDealer" type="number" min="0" defaultValue={editing?.priceDealer ?? 0} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3 md:col-span-2">
              <Label htmlFor="is_active" className="cursor-pointer">Active / مفعّل</Label>
              <Switch id="is_active" name="is_active" defaultChecked={editing?.is_active ?? true} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{t("product_image_label")}</Label>
              <Dropzone
                accept="image/*"
                onFiles={(files) => handleImageFile(files[0])}
                overlayLabel={t("drop_to_upload")}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start rounded-md border border-dashed border-input p-3">
                  <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary">
                    {imageSrc ? <img src={imageSrc} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-8 w-8 text-muted-foreground" />}
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => imgInputRef.current?.click()} className="gap-2">
                        <Upload className="h-4 w-4" />{imageSrc ? t("change_image") : t("upload_image")}
                      </Button>
                      {imageSrc && rawImage && (
                        <Button type="button" variant="outline" size="sm" onClick={() => setCropOpen(true)} className="gap-2">
                          <CropIcon className="h-4 w-4" />{t("crop_image")}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{t("drop_file_here")}</p>
                    <p className="text-xs text-muted-foreground">{t("image_preview_hint")}</p>
                  </div>
                </div>
              </Dropzone>
              <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="datasheet">{t("datasheet")}</Label>
              {datasheet ? (
                <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2">
                  <a href={datasheet.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 text-sm text-primary hover:underline">
                    <FileText className="h-4 w-4 shrink-0" /><span className="truncate">{datasheet.name}</span>
                  </a>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setDatasheet(null)} className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive" aria-label={t("datasheet_remove")}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Dropzone
                  accept="application/pdf,.pdf"
                  onFiles={(files) => handleDatasheetFile(files[0])}
                  overlayLabel={t("drop_to_upload")}
                >
                  <label htmlFor="datasheet" className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-input bg-background px-3 py-3 text-sm text-muted-foreground transition hover:border-primary hover:text-primary">
                    <Upload className="h-4 w-4" /><span>{t("datasheet_optional")}</span>
                  </label>
                </Dropzone>
              )}
              <input id="datasheet" type="file" accept="application/pdf,.pdf" className="hidden" onChange={onPickDatasheet} />
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>{t("cancel")}</Button>
              <Button type="submit" disabled={saving} className="bg-gradient-brand">
                {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{t("save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ImageCropper open={cropOpen} src={rawImage || imageSrc} onClose={() => setCropOpen(false)} onCropped={(url) => setImageSrc(url)} />
    </div>
  );
}

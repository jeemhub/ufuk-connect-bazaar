import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, FileText, Upload, Download, X, ImagePlus, Crop as CropIcon, Loader2, FileSpreadsheet, Eye, EyeOff, ImageOff, FileQuestion, Type, ChevronDown, Check, Sparkles, DollarSign, Copy } from "lucide-react";
import { ImportProductsDialog } from "@/components/admin/ImportProductsDialog";
import { ImportProductsFullDialog } from "@/components/admin/ImportProductsFullDialog";
import { exportProductsToExcel } from "@/lib/exportProductsExcel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatIqd, categories, Product } from "@/data/mockData";
import { StockBadge } from "@/components/admin/StatusBadge";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { useAdminProducts, dbToProduct, type AdminProductRow } from "@/hooks/useProducts";
import { useBrands } from "@/hooks/useBrands";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dropzone } from "@/components/ui/dropzone";
import { useAuth } from "@/auth/AuthProvider";

// Brands are loaded from the database (see useBrands below)

type EditState = (Product & {
  is_active?: boolean;
  priceWholesale?: number;
  priceDealer?: number;
  nameData?: string | null;
  costUsd?: number;
}) | null;


export default function Products() {
  const { t, lang } = useLanguage();
  const { isAdmin } = useAuth();
  const { rows, loading, refetch } = useAdminProducts();
  const { brands: brandRows } = useBrands({ activeOnly: false });
  const brands = useMemo(() => (brandRows ?? []).map((b) => b.name), [brandRows]);
  const list = useMemo(
    () => rows.map((r) => ({
      ...dbToProduct(r),
      is_active: r.is_active,
      priceWholesale: Number(r.price_wholesale_iqd ?? 0),
      priceDealer: Number(r.price_dealer_iqd ?? 0),
      nameData: (r as AdminProductRow & { name_data?: string | null }).name_data ?? null,
      costUsd: Number((r as AdminProductRow & { cost_usd?: number | null }).cost_usd ?? 0),
    })),
    [rows]
  );
  const [catMap, setCatMap] = useState<Record<string, string>>({}); // key -> uuid
  const [catRows, setCatRows] = useState<{ id: string; key: string; name_ar: string; name_en: string }[]>([]);
  const [subRows, setSubRows] = useState<{ id: string; category_id: string; name_ar: string; name_en: string }[]>([]);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState<string>("all");
  const [cat, setCat] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [editing, setEditing] = useState<EditState>(null);
  const [formCat, setFormCat] = useState<string>("__none__"); // selected category key in dialog
  const [formSubs, setFormSubs] = useState<string[]>([]);
  const [subPopOpen, setSubPopOpen] = useState(false);
  const [datasheet, setDatasheet] = useState<{ url: string; name: string } | null>(null);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [rawImage, setRawImage] = useState<string>("");
  const [cropOpen, setCropOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFullOpen, setImportFullOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [autoFetching, setAutoFetching] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{ url: string; thumb: string; credit: string }[]>([]);
  const [suggestPick, setSuggestPick] = useState<string>("");
  const [urlInput, setUrlInput] = useState<string>("");
  const [costPreview, setCostPreview] = useState<number>(0);

  function autoFetchImage() {
    const form = document.querySelector<HTMLFormElement>("form[data-product-form]");
    const fd = form ? new FormData(form) : null;
    const query =
      String(fd?.get("nameEn") || "").trim() ||
      String(fd?.get("nameData") || "").trim() ||
      String(fd?.get("nameAr") || "").trim();
    if (!query) {
      toast.error(lang === "ar" ? "أدخل اسم المنتج أولاً" : "Enter a product name first");
      return;
    }
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
  }

  function applyImageUrl() {
    const url = urlInput.trim();
    if (!/^https?:\/\/.+/i.test(url)) {
      toast.error(lang === "ar" ? "أدخل رابط صورة صحيح" : "Enter a valid image URL");
      return;
    }
    setImageSrc(url);
    setRawImage("");
    setUrlInput("");
    toast.success(lang === "ar" ? "تم تعيين الصورة" : "Image applied");
  }



  async function handleExport() {
    setExporting(true);
    try {
      const count = await exportProductsToExcel();
      toast.success(lang === "ar" ? `تم تصدير ${count} منتج` : `Exported ${count} products`);
    } catch (e: any) {
      toast.error(e?.message || (lang === "ar" ? "فشل التصدير" : "Export failed"));
    } finally {
      setExporting(false);
    }
  }

  async function loadCatsAndSubs() {
    const [{ data: cats }, { data: subs }] = await Promise.all([
      supabase.from("categories").select("id,key,name_ar,name_en").order("sort", { ascending: true }),
      supabase.from("subcategories").select("id,category_id,name_ar,name_en"),
    ]);
    const list = (cats ?? []) as { id: string; key: string; name_ar: string; name_en: string }[];
    setCatRows(list);
    const map: Record<string, string> = {};
    list.forEach((c) => { map[c.key] = c.id; });
    setCatMap(map);
    setSubRows((subs ?? []) as { id: string; category_id: string; name_ar: string; name_en: string }[]);
  }

  useEffect(() => { loadCatsAndSubs(); }, []);

  useEffect(() => {
    if (open) {
      setDatasheet(editing?.datasheetUrl ? { url: editing.datasheetUrl, name: editing.datasheetName ?? "datasheet.pdf" } : null);
      setImageSrc(editing?.image ?? "");
      setRawImage("");
      setFormCat(editing?.category ?? "__none__");
      const subStr = (editing?.subcategory ?? "").trim();
      setFormSubs(subStr ? subStr.split(",").map((s) => s.trim()).filter(Boolean) : []);
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
      contentType: blob.type, upsert: false, cacheControl: "31536000",
    });
    if (error) { toast.error(error.message); return null; }
    return supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }

  const [searchParams] = useSearchParams();
  const lowStockOnly = searchParams.get("filter") === "low_stock";
  const [missingFilters, setMissingFilters] = useState({
    noDesc: false,
    noName: false,
    noImage: false,
    hidden: false,
    noPrice: false,
  });
  const [showHidden, setShowHidden] = useState(true);


  const isMissingImage = (url?: string) => !url || url.includes("unsplash.com/photo-1606904825846");

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/\s+/g, " ")
      .trim();

  const filtered = useMemo(() => list.filter((p) => {
    const tokens = normalize(search).split(" ").filter(Boolean);
    const catRow = catRows.find((c) => c.key === p.category);
    const haystack = normalize(
      [
        p.id,
        p.sku,
        p.nameAr,
        p.nameEn,
        p.nameData,
        p.descAr,
        p.descEn,
        p.brand,
        p.category,
        catRow?.name_ar,
        catRow?.name_en,
        p.subcategory,
        p.datasheetName,
        p.priceIqd,
        p.priceWholesale,
        p.priceDealer,
        p.costUsd,
        p.stock,
        p.is_active ? "مرئي visible active" : "مخفي hidden inactive",
        (p.priceIqd ?? 0) === 0 ? "بدون سعر no price" : "",
        (p.stock ?? 0) === 0 ? "نافذ out of stock" : "",
      ]
        .filter((v) => v !== null && v !== undefined && v !== "")
        .join(" ")
    );
    const matches = tokens.every((t) => haystack.includes(t));
    if (!matches) return false;

    if (brand !== "all" && p.brand !== brand) return false;
    if (cat !== "all" && p.category !== cat) return false;
    if (lowStockOnly && p.stock >= 5) return false;
    if (missingFilters.noPrice && p.priceIqd > 0) return false;
    if (missingFilters.noDesc && (p.descAr?.trim() || p.descEn?.trim())) return false;
    if (missingFilters.noName && ((p.nameAr?.trim() && p.nameEn?.trim()) || p.is_active === false)) return false;
    if (missingFilters.noImage && !isMissingImage(p.image)) return false;
    if (missingFilters.hidden && p.is_active) return false;
    if (!showHidden && !missingFilters.hidden && p.is_active === false) return false;
    return true;
  }), [list, search, brand, cat, catRows, lowStockOnly, missingFilters, showHidden]);


  async function toggleVisibility(p: Product & { is_active?: boolean }) {
    const next = !p.is_active;
    const { error } = await supabase.from("products").update({ is_active: next }).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success(next ? (lang === "ar" ? "تم إظهار المنتج" : "Product shown") : (lang === "ar" ? "تم إخفاء المنتج" : "Product hidden"));
    refetch();
  }

  const openNew = () => { setEditing(null); setCostPreview(0); setOpen(true); };
  const openEdit = (p: EditState) => { setEditing(p); setCostPreview(p?.costUsd ?? 0); setOpen(true); };

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

    const categoryKey = formCat;
    const brandValue = String(f.get("brand") || "");
    const payload = {
      name_ar: String(f.get("nameAr") || ""),
      name_en: String(f.get("nameEn") || ""),
      name_data: String(f.get("nameData") || "") || null,
      desc_ar: String(f.get("descAr") || "") || null,
      desc_en: String(f.get("descEn") || "") || null,
      brand: brandValue && brandValue !== "__none__" ? brandValue : null,
      category_id: categoryKey && categoryKey !== "__none__" ? (catMap[categoryKey] ?? null) : null,
      subcategory: formSubs.length ? formSubs.join(", ") : null,
      price_iqd: Number(f.get("priceIqd") || 0),
      price_wholesale_iqd: Number(f.get("priceWholesale") || 0),
      price_dealer_iqd: Number(f.get("priceDealer") || 0),
      stock: Number(f.get("stock") || 0),
      cost_usd: Number(f.get("costUsd") || 0),
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
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={handleExport} disabled={exporting} className="gap-2">
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {lang === "ar" ? "تصدير Excel" : "Export to Excel"}
              </Button>
              <Button variant="outline" onClick={() => setImportFullOpen(true)} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" /> {lang === "ar" ? "استيراد تحديث كامل" : "Import full update"}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" /> {lang === "ar" ? "استيراد الرصيد فقط" : "Import stock only"}
          </Button>
          <Button onClick={openNew} className="gap-2 bg-gradient-brand shadow-elegant hover:opacity-95">
            <Plus className="h-4 w-4" /> {t("add_product")}
          </Button>
        </div>
      </div>

      <ImportProductsDialog open={importOpen} onOpenChange={setImportOpen} onDone={refetch} />
      {isAdmin && <ImportProductsFullDialog open={importFullOpen} onOpenChange={setImportFullOpen} onDone={refetch} />}

      <div className="surface-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input placeholder={lang === "ar" ? "بحث شامل (الاسم، Data، العلامة، القسم...)" : "Search all fields (name, Data, brand, category...)"} value={search} onChange={(e) => setSearch(e.target.value)} />
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
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { key: "noName" as const, label: lang === "ar" ? "بدون اسم" : "No name", icon: Type },
            { key: "noDesc" as const, label: lang === "ar" ? "بدون وصف" : "No description", icon: FileQuestion },
            { key: "noImage" as const, label: lang === "ar" ? "بدون صورة" : "No image", icon: ImageOff },
            { key: "noPrice" as const, label: lang === "ar" ? "بدون سعر" : "No price", icon: DollarSign },
            { key: "hidden" as const, label: lang === "ar" ? "المخفية" : "Hidden", icon: EyeOff },
          ].map(({ key, label, icon: Icon }) => {
            const active = missingFilters[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMissingFilters((s) => ({ ...s, [key]: !s[key] }))}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-secondary"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
          <div className="ms-auto flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1">
            <Switch id="show-hidden" checked={showHidden} onCheckedChange={setShowHidden} disabled={missingFilters.hidden} />
            <Label htmlFor="show-hidden" className="cursor-pointer text-xs font-medium text-muted-foreground">
              {lang === "ar" ? "إظهار المنتجات المخفية" : "Show hidden products"}
            </Label>
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
              {!loading && filtered.map((p) => {
                const isOpen = expanded === p.id;
                return (
                <Fragment key={p.id}>
                <tr
                  onClick={() => setExpanded(isOpen ? null : p.id)}
                  className={`cursor-pointer border-t border-border hover:bg-secondary/30 ${isOpen ? "bg-secondary/40" : ""} ${!p.is_active ? "opacity-60" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      <img src={p.image} alt="" className="h-12 w-12 rounded-md border border-border object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const display = lang === "ar" ? p.nameAr : p.nameEn;
                        const hasNames = !!(p.nameAr?.trim() && p.nameEn?.trim());
                        if (!hasNames && p.nameData?.trim()) {
                          return <span className="font-medium text-yellow-500">{p.nameData}</span>;
                        }
                        return <span className="font-medium">{display}</span>;
                      })()}
                      {!p.is_active && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          <EyeOff className="h-3 w-3" />{lang === "ar" ? "مخفي" : "Hidden"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.brand}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.subcategory}</td>
                  <td className="px-4 py-3 font-semibold">{formatIqd(p.priceIqd)} {t("currency_iqd")}</td>
                  <td className="px-4 py-3"><StockBadge stock={p.stock} /></td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-primary"
                        title={lang === "ar" ? "نسخ الاسم في Data" : "Copy data name"}
                        onClick={async () => {
                          const val = p.nameData?.trim();
                          if (!val) { toast.error(lang === "ar" ? "لا يوجد اسم في Data" : "No data name"); return; }
                          try {
                            await navigator.clipboard.writeText(val);
                          } catch {
                            const ta = document.createElement("textarea");
                            ta.value = val; document.body.appendChild(ta); ta.select();
                            document.execCommand("copy"); ta.remove();
                          }
                          toast.success(lang === "ar" ? "تم نسخ الاسم في Data" : "Data name copied");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleVisibility(p)} className="h-8 w-8 hover:text-primary" title={p.is_active ? (lang === "ar" ? "إخفاء" : "Hide") : (lang === "ar" ? "إظهار" : "Show")}>
                        {p.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="h-8 w-8 hover:text-primary"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(p)} className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-t border-border bg-secondary/20">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {[
                          { label: lang === "ar" ? "سعر المفرد" : "Retail price", value: p.priceIqd },
                          { label: lang === "ar" ? "سعر الجملة" : "Wholesale price", value: p.priceWholesale ?? 0 },
                          { label: lang === "ar" ? "سعر الوكيل" : "Dealer price", value: p.priceDealer ?? 0 },
                          { label: lang === "ar" ? "الكلفة (دينار)" : "Cost (IQD)", value: Math.round((p.costUsd ?? 0) * 1500) },
                        ].map((it) => (
                          <div key={it.label} className="rounded-lg border border-border bg-background p-3">
                            <div className="text-xs text-muted-foreground">{it.label}</div>
                            <div className="mt-1 font-semibold">
                              {it.value > 0 ? `${formatIqd(it.value)} ${t("currency_iqd")}` : (lang === "ar" ? "—" : "—")}
                            </div>
                          </div>
                        ))}
                        <div className="rounded-lg border border-border bg-background p-3">
                          <div className="text-xs text-muted-foreground">{lang === "ar" ? "الكلفة (دولار)" : "Cost (USD)"}</div>
                          <div className="mt-1 font-semibold">
                            {(p.costUsd ?? 0) > 0 ? `$${(p.costUsd ?? 0).toFixed(2)}` : "—"}
                          </div>
                        </div>
                        <div className="rounded-lg border border-border bg-background p-3">
                          <div className="text-xs text-muted-foreground">{t("product_stock")}</div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="font-semibold">{p.stock}</span>
                            <StockBadge stock={p.stock} />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
                );
              })}

            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lang === "ar" ? "حذف المنتج؟" : "Delete product?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {lang === "ar"
                ? `لا يمكن التراجع عن هذا الإجراء. سيتم حذف "${confirmDelete?.nameAr || confirmDelete?.nameEn || ""}" نهائياً.`
                : `This action cannot be undone. "${confirmDelete?.nameEn || confirmDelete?.nameAr || ""}" will be permanently deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{lang === "ar" ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmDelete) remove(confirmDelete.id); setConfirmDelete(null); }}
            >
              {lang === "ar" ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t("edit_product") : t("new_product")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} data-product-form className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nameAr">{t("name_ar")}</Label>
              <Input id="nameAr" name="nameAr" defaultValue={editing?.nameAr} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nameEn">{t("name_en")}</Label>
              <Input id="nameEn" name="nameEn" defaultValue={editing?.nameEn} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="nameData">{lang === "ar" ? "الاسم في Data" : "Data name"}</Label>
              <Input id="nameData" name="nameData" defaultValue={editing?.nameData ?? ""} placeholder={lang === "ar" ? "اسم المادة كما في ملف Excel" : "Item name as in Excel sheet"} />
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
              <select
                id="category"
                value={formCat}
                onChange={(e) => { setFormCat(e.target.value); setFormSubs([]); }}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="__none__">{lang === "ar" ? "بدون قسم" : "No category"}</option>
                {catRows.map((c) => <option key={c.key} value={c.key}>{lang === "ar" ? c.name_ar : c.name_en}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("subcategories")}</Label>
              {(() => {
                const catId = formCat !== "__none__" ? catMap[formCat] : null;
                const available = catId ? subRows.filter((s) => s.category_id === catId) : [];
                const labelFor = (s: { name_ar: string; name_en: string }) => (lang === "ar" ? s.name_ar : s.name_en) || s.name_en || s.name_ar;
                const summary = formSubs.length === 0
                  ? (lang === "ar" ? "اختر فئات فرعية" : "Select subcategories")
                  : formSubs.length <= 2
                  ? formSubs.join("، ")
                  : `${formSubs.slice(0, 2).join("، ")} +${formSubs.length - 2}`;
                const toggle = (name: string) =>
                  setFormSubs((prev) => prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]);
                return (
                  <Popover open={subPopOpen} onOpenChange={setSubPopOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        disabled={!catId}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className={formSubs.length ? "" : "text-muted-foreground"}>
                          {catId ? summary : (lang === "ar" ? "اختر القسم أولاً" : "Pick a category first")}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <div className="max-h-64 overflow-y-auto p-1">
                        {available.length === 0 ? (
                          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                            {lang === "ar" ? "لا توجد فئات فرعية لهذا القسم. أضفها من صفحة الأقسام." : "No subcategories for this category. Add them in Categories page."}
                          </div>
                        ) : (
                          available.map((s) => {
                            const name = labelFor(s);
                            const checked = formSubs.includes(name);
                            return (
                              <button
                                type="button"
                                key={s.id}
                                onClick={() => toggle(name)}
                                className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                              >
                                <Checkbox checked={checked} className="pointer-events-none" />
                                <span className="flex-1 text-start">{name}</span>
                                {checked && <Check className="h-4 w-4 text-primary" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })()}
              {formSubs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formSubs.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
                      {s}
                      <button
                        type="button"
                        onClick={() => setFormSubs((prev) => prev.filter((x) => x !== s))}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priceIqd">{t("price_retail")} ({t("currency_iqd")})</Label>
              <Input id="priceIqd" name="priceIqd" type="number" min="0" defaultValue={editing?.priceIqd ?? 0} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priceWholesale">{t("price_wholesale")} ({t("currency_iqd")})</Label>
              <Input id="priceWholesale" name="priceWholesale" type="number" min="0" defaultValue={editing?.priceWholesale ?? 0} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priceDealer">{t("price_dealer")} ({t("currency_iqd")})</Label>
              <Input id="priceDealer" name="priceDealer" type="number" min="0" defaultValue={editing?.priceDealer ?? 0} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">{t("product_stock")}</Label>
              <Input id="stock" name="stock" type="number" min="0" defaultValue={editing?.stock ?? 0} required />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="costUsd">{lang === "ar" ? "كلفة المنتج ($)" : "Product cost ($)"}</Label>
              <Input
                id="costUsd"
                name="costUsd"
                type="number"
                min="0"
                step="0.01"
                defaultValue={editing?.costUsd ?? 0}
                onChange={(e) => setCostPreview(Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                {lang === "ar"
                  ? `= ${formatIqd(Math.round(costPreview * 1500))} ${t("currency_iqd")} — داخلية فقط، لا تظهر للعملاء`
                  : `= ${formatIqd(Math.round(costPreview * 1500))} ${t("currency_iqd")} — internal only, never shown to customers`}
              </p>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3 md:col-span-2">
              <div>
                <Label htmlFor="is_active" className="cursor-pointer">{lang === "ar" ? "إظهار للعملاء" : "Visible to customers"}</Label>
                <p className="mt-1 text-xs text-muted-foreground">{lang === "ar" ? "عند الإطفاء يتم إخفاء المنتج عن الموقع" : "When off, product is hidden from the site"}</p>
              </div>
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
                      <Button type="button" variant="outline" size="sm" onClick={autoFetchImage} className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        {lang === "ar" ? "جلب صورة تلقائياً" : "Auto-fetch image"}
                      </Button>
                      {imageSrc && rawImage && (
                        <Button type="button" variant="outline" size="sm" onClick={() => setCropOpen(true)} className="gap-2">
                          <CropIcon className="h-4 w-4" />{t("crop_image")}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{t("drop_file_here")}</p>
                    <p className="text-xs text-muted-foreground">{t("image_preview_hint")}</p>
                    <p className="text-xs text-muted-foreground">
                      {lang === "ar"
                        ? "سيفتح بحث صور Google في تبويب جديد — انسخ عنوان الصورة ثم الصقه بالأسفل."
                        : "Google Images opens in a new tab — copy the image address, then paste it below."}
                    </p>
                  </div>
                </div>
              </Dropzone>
              <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
              <div className="space-y-1.5">
                <Label htmlFor="imageUrlPaste">{lang === "ar" ? "أو الصق رابط الصورة" : "Or paste image URL"}</Label>
                <div className="flex gap-2">
                  <Input
                    id="imageUrlPaste"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyImageUrl(); } }}
                    placeholder="https://..."
                    dir="ltr"
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={applyImageUrl}>
                    {lang === "ar" ? "تطبيق" : "Apply"}
                  </Button>
                </div>
              </div>
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

      <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{lang === "ar" ? "صور مقترحة" : "Suggested images"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {suggestions.map((s) => (
              <button
                key={s.url}
                type="button"
                onClick={() => setSuggestPick(s.url)}
                className={`overflow-hidden rounded-md border-2 transition ${suggestPick === s.url ? "border-primary" : "border-border"}`}
              >
                <img src={s.thumb} alt={s.credit} className="h-24 w-full object-cover" loading="lazy" />
                <span className="block truncate px-1 py-0.5 text-[10px] text-muted-foreground">{s.credit}</span>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setSuggestOpen(false)}>
              {lang === "ar" ? "رفض" : "Reject"}
            </Button>
            <Button
              type="button"
              className="bg-gradient-brand"
              disabled={!suggestPick}
              onClick={() => { setImageSrc(suggestPick); setRawImage(""); setSuggestOpen(false); }}
            >
              {lang === "ar" ? "اعتماد الصورة" : "Use image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

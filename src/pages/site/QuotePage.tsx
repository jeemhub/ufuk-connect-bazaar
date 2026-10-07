import { unstablePriceMessage } from "@/lib/catalog";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Loader2, MailCheck, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSelection } from "@/catalog/SelectionContext";
import { applicablePrice, productName, validIraqiPhone, normalizePhone } from "@/lib/catalog";
import { useAuth } from "@/auth/AuthProvider";
import { downloadQuoteSummary } from "@/lib/quotePdf";
import { formatIqd } from "@/data/mockData";
import { useProducts, useProduct } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  company: z.string().trim().max(120).optional(),
  message: z.string().trim().max(2000).optional(),
});

const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

export default function QuotePage() {
  const { t, lang } = useLanguage();
  const { pricingTier } = useAuth();
  const [params,setParams] = useSearchParams();
  const productId = params.get("product");
  const { product } = useProduct(productId ?? undefined);
  const { products, loading: productsLoading, error: productsError } = useProducts({activeOnly:true});
  const { quote, setQuoteQty, clearQuote } = useSelection();
  const summaryRef = useRef<HTMLDivElement>(null);
  const [pdfBusy,setPdfBusy] = useState(false);
  const ids = [...new Set([...Object.keys(quote), ...(productId ? [productId] : [])])];
  const quoteProducts = ids.map(id => products.find(p => p.id === id)).filter(p => !!p);
  const quantity = (id: string) => quote[id] ?? 1;
  const estimatedTotal = quoteProducts.reduce((sum,p)=>sum+Math.max(0,applicablePrice(p,pricingTier))*quantity(p.id),0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ full_name: "", phone: "", email: "", company: "", message: "" });

  useEffect(() => { document.title = `${t("quote_title")} · ${t("brand")}`; }, [t]);

  function handleFilesPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    const next = [...files];
    for (const f of picked) {
      if (next.length >= MAX_FILES) { toast.error(t("attachments_too_many")); break; }
      if (!ALLOWED.includes(f.type)) { toast.error(t("attachments_invalid_type")); continue; }
      if (f.size > MAX_SIZE) { toast.error(t("attachments_too_large")); continue; }
      next.push(f);
    }
    setFiles(next);
  }

  function removeFile(idx: number) {
    setFiles(files.filter((_, i) => i !== idx));
  }

  async function uploadAttachments(): Promise<string[]> {
    if (files.length === 0) return [];
    const urls: string[] = [];
    for (const f of files) {
      const ext = f.name.split(".").pop() || "bin";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("quote-attachments").upload(path, f, {
        contentType: f.type,
        upsert: false,
        cacheControl: "31536000",
      });
      if (error) throw error;
      const { data } = supabase.storage.from("quote-attachments").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success || !validIraqiPhone(form.phone)) { toast.error(t("quote_error")); return; }
    if (productsLoading || productsError || quoteProducts.length !== ids.length) {toast.error(lang === "ar" ? "تحقق من المنتجات المختارة قبل الإرسال" : "Check selected products before submitting");return;}
    setBusy(true);
    try {
      const attachments = await uploadAttachments();
      const { error } = await supabase.from("quote_requests").insert({
        full_name: parsed.data.full_name,
        phone: normalizePhone(parsed.data.phone),
        email: parsed.data.email || null,
        company: parsed.data.company || null,
        message: [parsed.data.message, ...quoteProducts.map(p=>`${productName(p,lang)} | SKU: ${p.sku || "—"} | ${lang === "ar" ? "الكمية" : "Quantity"}: ${quantity(p.id)}`)].filter(Boolean).join("\n"),
        product_id: product?.id || null,
        product_name: quoteProducts.map(p=>`${productName(p,lang)} × ${quantity(p.id)}`).join("; ") || null,
        attachments,
      });
      if (error) throw error;
      setDone(true);
      clearQuote();
      toast.success(t("quote_success"));
    } catch {
      toast.error(t("quote_error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold md:text-4xl">{t("quote_title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("quote_sub")}</p>
      </div>

      {!!ids.length && !done && <section className="surface-card mb-6 p-5">
        {!productsLoading && !productsError && ids.filter(id=>!quoteProducts.some(p=>p.id===id)).map(id=><div key={id} className="mb-3 flex items-center justify-between gap-3 rounded-xl border p-3"><span>{lang === "ar" ? "منتج مختار لم يعد متاحًا" : "A selected product is no longer available"}</span><Button variant="outline" onClick={()=>{setQuoteQty(id,0);if(productId===id){const next=new URLSearchParams(params);next.delete("product");setParams(next);}}}>{lang === "ar" ? "إزالة من الطلب" : "Remove from request"}</Button></div>)}
        <div ref={summaryRef} className="bg-white p-4 text-slate-900" dir={lang === "ar" ? "rtl" : "ltr"}>
          <h2 className="mb-3 text-xl font-bold">{lang === "ar" ? "أفق البصرة - ملخص طلب عرض سعر" : "UFUK AL-Basra - quote request summary"}</h2>
          {productsLoading ? <p role="status">{lang === "ar" ? "جارٍ التحميل…" : "Loading…"}</p> : productsError || quoteProducts.length !== ids.length ? <p role="alert">{lang === "ar" ? "تعذر تحميل بعض المنتجات. راجع الاختيارات." : "Some products could not be loaded. Review selections."}</p> : quoteProducts.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-4"><div className="min-w-0 flex-1"><p className="font-semibold">{productName(p,lang)}</p>{p.sku && <p dir="ltr" className="text-xs">SKU: {p.sku}</p>}<p className="text-sm">{lang === "ar" ? "الكمية" : "Quantity"}: {quantity(p.id)} · {p.priceUnstable ? unstablePriceMessage(lang) : applicablePrice(p,pricingTier)>0 ? `${formatIqd(applicablePrice(p,pricingTier))} IQD` : lang === "ar" ? "السعر عند الطلب" : "Price on request"}</p></div></div>)}
          <p className="mt-4 font-bold">{lang === "ar" ? "مجموع المنتجات ذات السعر المعلن (دون التوصيل): " : "Total of priced items (excluding delivery): "}{quoteProducts.some(p => p.priceUnstable) ? (lang === "ar" ? "يُؤكَّد مع الشركة" : "Confirm with the company") : `${formatIqd(estimatedTotal)} IQD`}</p>
          <p className="mt-4 text-xs leading-6">{lang === "ar" ? "هذه قائمة طلب عرض سعر وليست عرضًا نهائيًا أو فاتورة. الأسعار والتوفر والتوصيل تُؤكَّد من المبيعات." : "This is a quote request list, not a final quote or invoice. Sales confirms pricing, availability and delivery."}</p>
        </div>
        <div className="mt-4 space-y-3">{quoteProducts.map(p=><div key={p.id} className="flex flex-wrap items-center gap-2"><Label htmlFor={`quote-qty-${p.id}`} className="min-w-0 flex-1 text-sm">{productName(p,lang)}</Label><Input id={`quote-qty-${p.id}`} type="number" min={1} max={999} className="w-20" value={quantity(p.id)} onChange={e=>setQuoteQty(p.id, Math.max(1,Number(e.target.value)||1))} /><Button type="button" variant="ghost" onClick={()=>{setQuoteQty(p.id,0);if(productId===p.id){const next=new URLSearchParams(params);next.delete("product");setParams(next);}}}>{lang === "ar" ? "إزالة" : "Remove"}</Button></div>)}</div>
        <div className="mt-4 flex flex-wrap gap-3"><Button type="button" variant="outline" disabled={pdfBusy || productsLoading || !!productsError || quoteProducts.length!==ids.length} onClick={async()=>{if(!summaryRef.current)return;setPdfBusy(true);try{await downloadQuoteSummary(summaryRef.current);}catch{toast.error(lang === "ar" ? "تعذر تنزيل الملف" : "Download failed");}finally{setPdfBusy(false);}}}>{lang === "ar" ? "تنزيل ملخص الطلب PDF" : "Download summary PDF"}</Button><Button asChild variant="outline"><a href="/products">{lang === "ar" ? "إضافة منتجات أخرى" : "Add more products"}</a></Button></div>
      </section>}

      {done ? (
        <div className="surface-card p-12 text-center">
          <MailCheck className="mx-auto mb-4 h-12 w-12 text-success" />
          <h2 className="text-2xl font-bold">{t("quote_success")}</h2>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="surface-card space-y-4 p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="quote-full_name">{t("full_name")} *</Label>
              <Input id="quote-full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required maxLength={120} />
            </div>
            <div>
              <Label htmlFor="quote-phone">{t("phone_label")} *</Label>
              <Input id="quote-phone" type="tel" dir="ltr" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required maxLength={30} />
            </div>
            <div>
              <Label htmlFor="quote-email">{t("email_label")}</Label>
              <Input id="quote-email" type="email" dir="ltr" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} />
            </div>
            <div>
              <Label htmlFor="quote-company">{t("company_label")}</Label>
              <Input id="quote-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} maxLength={120} />
            </div>
          </div>
          <div>
            <Label htmlFor="quote-message">{t("message_label")}</Label>
            <Textarea id="quote-message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={2000} />
          </div>

          <div>
            <Label htmlFor="quote-files">{t("attachments_label")}</Label>
            <p className="mt-1 text-xs text-muted-foreground">{t("attachments_hint")}</p>
            <input
              id="quote-files"
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFilesPicked}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= MAX_FILES}
            >
              <Paperclip className="h-4 w-4" />
              {t("attachments_add")}
            </Button>

            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    {f.type.startsWith("image/") ? (
                      <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      aria-label={t("attachments_remove")}
                      className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button type="submit" size="lg" disabled={busy} className="w-full bg-gradient-brand">
            {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {busy && files.length > 0 ? t("attachments_uploading") : t("submit")}
          </Button>
        </form>
      )}
    </div>
  );
}

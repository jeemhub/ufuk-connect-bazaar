import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { Loader2, MailCheck, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageContext";
import { useProduct } from "@/hooks/useProducts";
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
  const [params] = useSearchParams();
  const productId = params.get("product");
  const { product } = useProduct(productId ?? undefined);
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
    if (!parsed.success) { toast.error(t("quote_error")); return; }
    setBusy(true);
    try {
      const attachments = await uploadAttachments();
      const { error } = await supabase.from("quote_requests").insert({
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        company: parsed.data.company || null,
        message: parsed.data.message || null,
        product_id: product?.id || null,
        product_name: product ? (lang === "ar" ? product.nameAr : product.nameEn) : null,
        attachments,
      });
      if (error) throw error;
      setDone(true);
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

      {product && (
        <div className="surface-card mb-6 flex items-center gap-4 p-4">
          <img src={product.image} alt="" className="h-16 w-16 rounded-md object-cover" />
          <div>
            <div className="text-xs text-muted-foreground">{product.brand}</div>
            <div className="font-semibold">{lang === "ar" ? product.nameAr : product.nameEn}</div>
          </div>
        </div>
      )}

      {done ? (
        <div className="surface-card p-12 text-center">
          <MailCheck className="mx-auto mb-4 h-12 w-12 text-success" />
          <h2 className="text-2xl font-bold">{t("quote_success")}</h2>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="surface-card space-y-4 p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>{t("full_name")} *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required maxLength={120} />
            </div>
            <div>
              <Label>{t("phone_label")} *</Label>
              <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required maxLength={30} />
            </div>
            <div>
              <Label>{t("email_label")}</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} />
            </div>
            <div>
              <Label>{t("company_label")}</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} maxLength={120} />
            </div>
          </div>
          <div>
            <Label>{t("message_label")}</Label>
            <Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={2000} />
          </div>

          <div>
            <Label>{t("attachments_label")}</Label>
            <p className="mt-1 text-xs text-muted-foreground">{t("attachments_hint")}</p>
            <input
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

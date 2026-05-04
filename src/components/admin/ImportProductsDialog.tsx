import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

type Row = (string | number | null)[];

/**
 * Fix Arabic text that arrived as mojibake (CP1256 bytes mis-decoded as Latin-1/UTF-8).
 * Detects strings that contain typical mojibake characters and re-decodes them as windows-1256.
 */
function fixArabicMojibake(s: string): string {
  if (!s) return s;
  // If it already contains Arabic characters, leave it alone.
  if (/[\u0600-\u06FF]/.test(s)) return s;
  // Mojibake heuristic: contains characters from the CP1256 high range (À-ÿ etc.)
  if (!/[\u00A0-\u00FF]/.test(s)) return s;
  try {
    const bytes = new Uint8Array(Array.from(s, ch => ch.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder("windows-1256").decode(bytes);
    return /[\u0600-\u06FF]/.test(decoded) ? decoded : s;
  } catch {
    return s;
  }
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}

export function ImportProductsDialog({ open, onOpenChange, onDone }: Props) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [skipHeader, setSkipHeader] = useState(true);
  const [nameCol, setNameCol] = useState(2); // 1-indexed
  const [stockCol, setStockCol] = useState(3);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const reset = () => {
    setFileName(""); setRows([]); setProgress(0);
    setNameCol(2); setStockCol(3); setSkipHeader(true);
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    setParsing(true);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      // codepage 1256 = Arabic (Windows). Helps when .xls files were saved with legacy encoding.
      const wb = XLSX.read(buf, { type: "array", codepage: 1256 });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Row>(ws, { header: 1, defval: null, raw: true });
      // Fix any cells that arrived as mojibake (CP1256 bytes interpreted as Latin-1)
      const fixed = (data as Row[]).map(row =>
        row?.map(cell => (typeof cell === "string" ? fixArabicMojibake(cell) : cell))
      );
      setFileName(file.name);
      setRows(fixed as Row[]);
    } catch (e: any) {
      toast.error(e?.message || (ar ? "تعذّر قراءة الملف" : "Failed to read file"));
    } finally {
      setParsing(false);
    }
  };

  const dataRows = skipHeader ? rows.slice(1) : rows;
  const validRows = dataRows.filter(r => r && r[nameCol - 1] != null && String(r[nameCol - 1]).trim() !== "");
  const preview = validRows.slice(0, 5);

  const handleImport = async () => {
    if (!validRows.length) { toast.error(ar ? "لا توجد صفوف صالحة" : "No valid rows"); return; }
    setImporting(true); setProgress(0);

    // Build map: name_data -> stock (last value wins if duplicates)
    const incoming = new Map<string, number>();
    for (const r of validRows) {
      const name = String(r[nameCol - 1] ?? "").trim();
      if (!name) continue;
      const stockRaw = r[stockCol - 1];
      const stockNum = parseInt(String(stockRaw ?? "0").replace(/[^\d-]/g, ""), 10);
      incoming.set(name, Number.isFinite(stockNum) ? stockNum : 0);
    }

    const names = Array.from(incoming.keys());
    let updated = 0, inserted = 0, fail = 0;

    try {
      // Fetch existing products by name_data in chunks
      const existing = new Map<string, string>(); // name_data -> id
      const lookupChunk = 300;
      for (let i = 0; i < names.length; i += lookupChunk) {
        const slice = names.slice(i, i + lookupChunk);
        const { data, error } = await supabase
          .from("products")
          .select("id, name_data")
          .in("name_data", slice);
        if (error) throw error;
        (data ?? []).forEach((p: any) => { if (p.name_data) existing.set(p.name_data, p.id); });
      }

      const toUpdate: { id: string; stock: number }[] = [];
      const toInsert: any[] = [];
      incoming.forEach((stock, name) => {
        const id = existing.get(name);
        if (id) toUpdate.push({ id, stock });
        else toInsert.push({
          name_ar: "",
          name_en: "",
          name_data: name,
          stock,
          price_iqd: 0,
          price_wholesale_iqd: 0,
          price_dealer_iqd: 0,
          brand: null,
          category_id: null,
          subcategory: null,
          image_url: null,
          is_active: true,
        });
      });

      const total = toUpdate.length + toInsert.length;
      let done = 0;

      // Update existing one-by-one (stock only)
      for (const u of toUpdate) {
        const { error } = await supabase.from("products").update({ stock: u.stock }).eq("id", u.id);
        if (error) fail++; else updated++;
        done++;
        setProgress(Math.round((done / Math.max(1, total)) * 100));
      }

      // Insert new in batches
      const batchSize = 200;
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        const { error } = await supabase.from("products").insert(batch);
        if (error) fail += batch.length; else inserted += batch.length;
        done += batch.length;
        setProgress(Math.round((done / Math.max(1, total)) * 100));
      }
    } catch (e: any) {
      toast.error(e?.message || (ar ? "فشل الاستيراد" : "Import failed"));
      setImporting(false);
      return;
    }

    setImporting(false);
    if (updated > 0) toast.success(ar ? `تم تحديث ${updated} منتج` : `Updated ${updated} products`);
    if (inserted > 0) toast.success(ar ? `تم إضافة ${inserted} منتج جديد` : `Added ${inserted} new products`);
    if (fail > 0) toast.error(ar ? `فشل ${fail}` : `Failed: ${fail}`);
    onDone();
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ar ? "استيراد منتجات من Excel" : "Import products from Excel"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-background p-6 text-sm text-muted-foreground hover:border-primary hover:text-primary">
            {parsing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
            <span>{ar ? "اختر ملف .xlsx أو .xls" : "Choose .xlsx or .xls file"}</span>
            {fileName && (
              <span className="flex items-center gap-1 text-xs text-foreground">
                <FileSpreadsheet className="h-3.5 w-3.5" /> {fileName} — {rows.length} {ar ? "صف" : "rows"}
              </span>
            )}
            <input
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleFile(f); }}
            />
          </label>

          {rows.length > 0 && (
            <>
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <Label htmlFor="skipHeader" className="cursor-pointer">
                  {ar ? "تجاهل الصف الأول (عناوين الأعمدة)" : "Skip first row (header)"}
                </Label>
                <Switch id="skipHeader" checked={skipHeader} onCheckedChange={setSkipHeader} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{ar ? "عمود اسم المادة" : "Name column"}</Label>
                  <Input type="number" min={1} max={rows[0]?.length || 10} value={nameCol}
                    onChange={(e) => setNameCol(Math.max(1, Number(e.target.value) || 1))} />
                </div>
                <div className="space-y-1.5">
                  <Label>{ar ? "عمود الرصيد" : "Stock column"}</Label>
                  <Input type="number" min={1} max={rows[0]?.length || 10} value={stockCol}
                    onChange={(e) => setStockCol(Math.max(1, Number(e.target.value) || 1))} />
                </div>
              </div>

              <div className="rounded-md border border-border">
                <div className="border-b border-border bg-secondary/40 px-3 py-2 text-xs font-medium">
                  {ar ? `معاينة (${validRows.length} صف صالح)` : `Preview (${validRows.length} valid rows)`}
                </div>
                <div className="divide-y divide-border text-sm">
                  {preview.map((r, i) => (
                    <div key={i} className="flex justify-between gap-3 px-3 py-1.5">
                      <span className="truncate">{String(r[nameCol - 1] ?? "")}</span>
                      <span className="text-muted-foreground">{String(r[stockCol - 1] ?? "0")}</span>
                    </div>
                  ))}
                  {!preview.length && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      {ar ? "لا توجد بيانات للمعاينة" : "No data to preview"}
                    </div>
                  )}
                </div>
              </div>

              {importing && <Progress value={progress} />}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={importing}>
            {ar ? "إلغاء" : "Cancel"}
          </Button>
          <Button onClick={handleImport} disabled={importing || !validRows.length} className="bg-gradient-brand">
            {importing && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {ar ? `استيراد ${validRows.length} منتج` : `Import ${validRows.length} products`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

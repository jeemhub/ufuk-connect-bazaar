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
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Row>(ws, { header: 1, defval: null, raw: true });
      setFileName(file.name);
      setRows(data as Row[]);
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
    let ok = 0, fail = 0;
    const payloads = validRows.map(r => {
      const name = String(r[nameCol - 1] ?? "").trim();
      const stockRaw = r[stockCol - 1];
      const stockNum = parseInt(String(stockRaw ?? "0").replace(/[^\d-]/g, ""), 10);
      return {
        name_ar: "",
        name_en: "",
        name_data: name,
        stock: Number.isFinite(stockNum) ? stockNum : 0,
        price_iqd: 0,
        price_wholesale_iqd: 0,
        price_dealer_iqd: 0,
        brand: null,
        category_id: null,
        subcategory: null,
        image_url: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=800&q=80",
        is_active: true,
      };
    });
    const batchSize = 200;
    for (let i = 0; i < payloads.length; i += batchSize) {
      const batch = payloads.slice(i, i + batchSize);
      const { error } = await supabase.from("products").insert(batch);
      if (error) fail += batch.length;
      else ok += batch.length;
      setProgress(Math.round(((i + batch.length) / payloads.length) * 100));
    }
    setImporting(false);
    if (ok > 0) toast.success(ar ? `تم استيراد ${ok} منتج` : `Imported ${ok} products`);
    if (fail > 0) toast.error(ar ? `فشل استيراد ${fail} منتج` : `Failed: ${fail}`);
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

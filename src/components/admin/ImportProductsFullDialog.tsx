import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { PRODUCTS_EXCEL_HEADER } from "@/lib/productsExcelSchema";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}

interface ImportResult {
  updated: number;
  skipped: { id: string; reason: string }[];
  errors: { row?: number; id?: string; reason: string }[];
}

export function ImportProductsFullDialog({ open, onOpenChange, onDone }: Props) {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const [fileName, setFileName] = useState("");
  const [header, setHeader] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setFileName(""); setHeader([]); setRows([]); setResult(null);
  };

  const headerMismatch = header.length > 0 &&
    (header.length !== PRODUCTS_EXCEL_HEADER.length ||
      PRODUCTS_EXCEL_HEADER.some((c, i) => header[i] !== c));

  const handleFile = async (file: File) => {
    setParsing(true);
    setResult(null);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
      const fileHeader = (raw[0] ?? []).map((c) => String(c ?? "").trim());
      const dataRows = raw.slice(1).map((r) =>
        Object.fromEntries(PRODUCTS_EXCEL_HEADER.map((key, i) => [key, r?.[i] ?? null]))
      );
      setFileName(file.name);
      setHeader(fileHeader);
      setRows(dataRows);
    } catch (e: any) {
      toast.error(e?.message || (ar ? "تعذّر قراءة الملف" : "Failed to read file"));
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (headerMismatch || rows.length === 0) return;
    setImporting(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("import-products", {
        body: { header, rows },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as ImportResult);
      onDone();
    } catch (e: any) {
      toast.error(e?.message || (ar ? "فشل الاستيراد" : "Import failed"));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ar ? "استيراد تحديث كامل للمنتجات" : "Import full product update"}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {ar
            ? "يحدّث فقط المنتجات الموجودة (مطابقة عبر id). لا يتم إنشاء منتجات جديدة أبداً. استخدم ملف مُصدَّر من هذه الصفحة كنقطة بداية."
            : "Updates existing products only (matched by id). New products are never created. Start from a file exported on this page."}
        </p>

        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-background p-6 text-sm text-muted-foreground hover:border-primary hover:text-primary">
            {parsing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
            <span>{ar ? "اختر ملف .xlsx" : "Choose .xlsx file"}</span>
            {fileName && (
              <span className="flex items-center gap-1 text-xs text-foreground">
                <FileSpreadsheet className="h-3.5 w-3.5" /> {fileName} — {rows.length} {ar ? "صف" : "rows"}
              </span>
            )}
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleFile(f); }}
            />
          </label>

          {headerMismatch && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">
                  {ar ? "أعمدة الملف لا تطابق القالب المتوقع" : "File columns don't match the expected template"}
                </p>
                <p className="mt-1 text-xs opacity-90">
                  {ar ? "المتوقع: " : "Expected: "}{PRODUCTS_EXCEL_HEADER.join(", ")}
                </p>
              </div>
            </div>
          )}

          {importing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {ar ? `جارٍ معالجة ${rows.length} صف...` : `Processing ${rows.length} rows...`}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {ar ? `تم تحديث ${result.updated}` : `${result.updated} updated`}
                </Badge>
                {result.skipped.length > 0 && (
                  <Badge variant="secondary" className="gap-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {ar ? `${result.skipped.length} تم تخطيها` : `${result.skipped.length} skipped`}
                  </Badge>
                )}
                {result.errors.length > 0 && (
                  <Badge variant="secondary" className="gap-1.5 bg-destructive/15 text-destructive">
                    <XCircle className="h-3.5 w-3.5" />
                    {ar ? `${result.errors.length} خطأ` : `${result.errors.length} errors`}
                  </Badge>
                )}
              </div>

              {result.skipped.length > 0 && (
                <div className="rounded-md border border-border">
                  <div className="border-b border-border bg-secondary/40 px-3 py-2 text-xs font-medium">
                    {ar ? "صفوف تم تخطيها (id غير موجود)" : "Skipped rows (id not found)"}
                  </div>
                  <ScrollArea className="h-40">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>id</TableHead>
                          <TableHead>{ar ? "السبب" : "Reason"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.skipped.map((s, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">{s.id}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{s.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="rounded-md border border-border">
                  <div className="border-b border-border bg-secondary/40 px-3 py-2 text-xs font-medium">
                    {ar ? "أخطاء التحقق" : "Validation errors"}
                  </div>
                  <ScrollArea className="h-40">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{ar ? "الصف" : "Row"}</TableHead>
                          <TableHead>id</TableHead>
                          <TableHead>{ar ? "السبب" : "Reason"}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.errors.map((e, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs">{e.row ?? "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{e.id ?? "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{e.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={importing}>
            {ar ? "إغلاق" : "Close"}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              disabled={importing || parsing || rows.length === 0 || headerMismatch}
              className="bg-gradient-brand"
            >
              {importing && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {ar ? `استيراد ${rows.length} صف` : `Import ${rows.length} rows`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

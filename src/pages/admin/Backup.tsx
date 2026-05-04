import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
import { Database, Download, Upload, Loader2, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

// All backup-able tables. Order matters for restore (parents before children).
const TABLES = [
  { key: "categories", label_ar: "الأقسام", label_en: "Categories" },
  { key: "subcategories", label_ar: "الأقسام الفرعية", label_en: "Subcategories" },
  { key: "brands", label_ar: "العلامات التجارية", label_en: "Brands" },
  { key: "products", label_ar: "المنتجات", label_en: "Products" },
  { key: "blog_posts", label_ar: "المقالات", label_en: "Blog posts" },
  { key: "blog_comments", label_ar: "تعليقات المدونة", label_en: "Blog comments" },
  { key: "projects", label_ar: "المشاريع", label_en: "Projects" },
  { key: "site_pages", label_ar: "صفحات الموقع", label_en: "Site pages" },
  { key: "orders", label_ar: "الطلبات", label_en: "Orders" },
  { key: "order_items", label_ar: "عناصر الطلبات", label_en: "Order items" },
  { key: "quote_requests", label_ar: "طلبات الأسعار", label_en: "Quote requests" },
  { key: "profiles", label_ar: "ملفات المستخدمين", label_en: "User profiles" },
  { key: "user_roles", label_ar: "أدوار المستخدمين", label_en: "User roles" },
  { key: "sales_permissions", label_ar: "صلاحيات المبيعات", label_en: "Sales permissions" },
  { key: "notifications", label_ar: "الإشعارات", label_en: "Notifications" },
] as const;

type TableKey = typeof TABLES[number]["key"];

const PAGE_SIZE = 1000;

async function fetchAllRows(table: TableKey): Promise<any[]> {
  const all: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await (supabase as any)
      .from(table)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

function rowsToSheet(rows: any[]): XLSX.WorkSheet {
  if (rows.length === 0) return XLSX.utils.aoa_to_sheet([["(empty)"]]);
  // Stringify any object/array fields so excel can store them.
  const flat = rows.map((r) => {
    const out: any = {};
    for (const [k, v] of Object.entries(r)) {
      if (v === null || v === undefined) out[k] = "";
      else if (typeof v === "object") out[k] = JSON.stringify(v);
      else out[k] = v;
    }
    return out;
  });
  return XLSX.utils.json_to_sheet(flat);
}

function sheetToRows(sheet: XLSX.WorkSheet): any[] {
  const raw: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
  return raw
    .filter((r) => Object.values(r).some((v) => v !== null && v !== ""))
    .map((r) => {
      const out: any = {};
      for (const [k, v] of Object.entries(r)) {
        if (v === "" || v === null) {
          out[k] = null;
        } else if (typeof v === "string") {
          const trimmed = v.trim();
          if (
            (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
            (trimmed.startsWith("[") && trimmed.endsWith("]"))
          ) {
            try {
              out[k] = JSON.parse(trimmed);
            } catch {
              out[k] = v;
            }
          } else {
            out[k] = v;
          }
        } else {
          out[k] = v;
        }
      }
      return out;
    });
}

export default function Backup() {
  const { lang } = useLanguage();
  const ar = lang === "ar";

  const [selected, setSelected] = useState<Set<TableKey>>(
    new Set(TABLES.map((t) => t.key))
  );
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const toggle = (k: TableKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(TABLES.map((t) => t.key)));
  const clearAll = () => setSelected(new Set());

  const doExport = async () => {
    if (selected.size === 0) {
      toast.error(ar ? "اختر قسمًا واحدًا على الأقل" : "Select at least one section");
      return;
    }
    setExporting(true);
    setExportProgress(0);
    try {
      const wb = XLSX.utils.book_new();
      const tables = TABLES.filter((t) => selected.has(t.key));
      let i = 0;
      for (const t of tables) {
        setExportStatus(ar ? `جلب ${t.label_ar}…` : `Fetching ${t.label_en}…`);
        const rows = await fetchAllRows(t.key);
        const ws = rowsToSheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, t.key.slice(0, 31));
        i++;
        setExportProgress(Math.round((i / tables.length) * 100));
      }
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      const fname =
        tables.length === TABLES.length
          ? `backup-full-${stamp}.xlsx`
          : `backup-${tables.map((t) => t.key).join("_").slice(0, 60)}-${stamp}.xlsx`;
      XLSX.writeFile(wb, fname);
      setExportStatus(ar ? "تم بنجاح" : "Done");
      toast.success(ar ? "تم تنزيل النسخة الاحتياطية" : "Backup downloaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Export failed");
      setExportStatus(ar ? "فشل التصدير" : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setImportStatus("");
    setImportProgress(0);
  };

  const startImport = () => {
    if (!file) {
      toast.error(ar ? "اختر ملف Excel أولًا" : "Choose an Excel file first");
      return;
    }
    setConfirmText("");
    setConfirmOpen(true);
  };

  const doImport = async () => {
    if (!file) return;
    setConfirmOpen(false);
    setImporting(true);
    setImportProgress(0);
    try {
      setImportStatus(ar ? "قراءة الملف…" : "Reading file…");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });

      // Restore in TABLES order so parents come before children.
      const tablesInFile = TABLES.filter((t) => wb.SheetNames.includes(t.key));
      if (tablesInFile.length === 0) {
        throw new Error(
          ar
            ? "لا يحتوي الملف على أي ورقة بأسماء الجداول المعروفة"
            : "File has no sheets matching known tables"
        );
      }

      let i = 0;
      // Delete child tables first (reverse order) using the admin RPC,
      // which bypasses RLS safely for this admin-only operation.
      setImportStatus(ar ? "حذف البيانات القديمة…" : "Clearing old data…");
      for (const t of [...tablesInFile].reverse()) {
        const { error } = await (supabase as any).rpc("admin_restore_table", {
          _table: t.key,
          _rows: [],
          _truncate: true,
        });
        if (error) {
          console.warn(`Delete on ${t.key}:`, error.message);
        }
      }

      for (const t of tablesInFile) {
        setImportStatus(
          ar ? `استعادة ${t.label_ar}…` : `Restoring ${t.label_en}…`
        );
        const ws = wb.Sheets[t.key];
        const rows = sheetToRows(ws);
        if (rows.length > 0) {
          // Insert in chunks via the admin RPC (bypasses RLS for restore).
          const CHUNK = 500;
          for (let j = 0; j < rows.length; j += CHUNK) {
            const chunk = rows.slice(j, j + CHUNK);
            const { error } = await (supabase as any).rpc(
              "admin_restore_table",
              { _table: t.key, _rows: chunk, _truncate: false }
            );
            if (error) throw new Error(`${t.key}: ${error.message}`);
          }
        }
        i++;
        setImportProgress(Math.round((i / tablesInFile.length) * 100));
      }

      setImportStatus(ar ? "تمت الاستعادة بنجاح" : "Restore complete");
      toast.success(ar ? "تمت استعادة النسخة الاحتياطية" : "Backup restored");
      setFile(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Import failed");
      setImportStatus(ar ? "فشلت الاستعادة" : "Restore failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" />
          {ar ? "النسخ الاحتياطية" : "Backups"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {ar
            ? "تصدير بيانات الموقع كملف Excel، أو استعادة نسخة سابقة."
            : "Export site data to Excel, or restore a previous backup."}
        </p>
      </div>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {ar ? "أخذ نسخة احتياطية" : "Create backup"}
          </CardTitle>
          <CardDescription>
            {ar
              ? "اختر الأقسام المراد تضمينها في الملف. كل قسم يصبح ورقة (sheet) داخل ملف Excel."
              : "Pick which sections to include. Each becomes a sheet inside the Excel file."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={selectAll} disabled={exporting}>
              {ar ? "تحديد الكل" : "Select all"}
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll} disabled={exporting}>
              {ar ? "إلغاء الكل" : "Clear"}
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TABLES.map((t) => (
              <label
                key={t.key}
                className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-muted/50"
              >
                <Checkbox
                  checked={selected.has(t.key)}
                  onCheckedChange={() => toggle(t.key)}
                  disabled={exporting}
                />
                <span className="text-sm">{ar ? t.label_ar : t.label_en}</span>
              </label>
            ))}
          </div>

          {exporting && (
            <div className="space-y-2">
              <Progress value={exportProgress} />
              <p className="text-xs text-muted-foreground">{exportStatus}</p>
            </div>
          )}

          <Button onClick={doExport} disabled={exporting} className="gap-2">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {ar ? "تنزيل ملف Excel" : "Download Excel file"}
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {ar ? "استعادة نسخة احتياطية" : "Restore from backup"}
          </CardTitle>
          <CardDescription className="flex items-start gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              {ar
                ? "تحذير: ستُحذف البيانات الحالية لكل قسم موجود في الملف وتُستبدل بالكامل. هذه العملية لا يمكن التراجع عنها."
                : "Warning: existing data for every section present in the file will be permanently deleted and replaced. This cannot be undone."}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-file">{ar ? "ملف النسخة الاحتياطية (.xlsx)" : "Backup file (.xlsx)"}</Label>
            <Input
              id="backup-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={importing}
            />
            {file && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileSpreadsheet className="h-3 w-3" />
                {file.name} — {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          {importing && (
            <div className="space-y-2">
              <Progress value={importProgress} />
              <p className="text-xs text-muted-foreground">{importStatus}</p>
            </div>
          )}

          <Button
            variant="destructive"
            onClick={startImport}
            disabled={!file || importing}
            className="gap-2"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {ar ? "استعادة واستبدال البيانات" : "Restore and replace data"}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {ar ? "تأكيد الاستعادة" : "Confirm restore"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {ar
                ? 'سيتم حذف بيانات كل قسم موجود في الملف واستبدالها. اكتب "RESTORE" للتأكيد.'
                : 'Data for every section present in the file will be deleted and replaced. Type "RESTORE" to confirm.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="RESTORE"
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{ar ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmText !== "RESTORE"}
              onClick={doImport}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {ar ? "متابعة" : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

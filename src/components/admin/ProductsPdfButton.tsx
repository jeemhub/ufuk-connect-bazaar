import {useRef, useState} from "react";
import {FileText, Loader2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useLanguage} from "@/i18n/LanguageContext";
import type {ProductPdfRow} from "@/lib/exportProductsPdf";
import {toast} from "sonner";

// Keep progress state here so each page doesn't re-render the entire product table.
export function ProductsPdfButton({products,brand,category,search,loading}: {
  products: ProductPdfRow[]; brand:string; category:string; search:string; loading:boolean;
}) {
  const {lang}=useLanguage(); const ar=lang==="ar";
  const [exporting,setExporting]=useState(false);
  const [progress,setProgress]=useState(0);
  const lock=useRef(false);
  async function exportPdf() {
    if(lock.current)return;
    lock.current=true;setProgress(0);setExporting(true);
    try {
      const {exportProductsToPdf}=await import("@/lib/exportProductsPdf");
      const count=await exportProductsToPdf({products,filterBrand:brand,filterCategory:category,searchQuery:search,onProgress:setProgress});
      toast.success(ar ? `تم تصدير تقرير PDF لـ ${count} منتج بنجاح` : `Exported PDF report for ${count} products`);
    } catch(error:unknown) {
      toast.error(error instanceof Error ? error.message : ar ? "فشل تصدير تقرير PDF" : "PDF export failed");
    } finally {lock.current=false;setExporting(false);}
  }
  return <Button variant="outline" onClick={exportPdf} disabled={exporting||loading||!products.length} aria-busy={exporting} className="gap-2 text-sky-700 border-sky-300 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/50">
    {exporting ? <Loader2 className="h-4 w-4 animate-spin"/> : <FileText className="h-4 w-4"/>}
    {exporting ? (ar ? `جارٍ التصدير… ${progress}%` : `Exporting… ${progress}%`) : (ar ? "طباعة / تصدير تقرير PDF" : "Print / Export PDF")}
  </Button>;
}

import { jsPDF } from "jspdf";

export interface ProductPdfRow {
  id: string;
  nameAr?: string | null;
  nameEn?: string | null;
  nameData?: string | null;
  brand?: string | null;
  category?: string | null;
  subcategory?: string | null;
  priceIqd: number;
  priceWholesale?: number | null;
  priceDealer?: number | null;
  costUsd?: number | null;
  stock: number;
  is_active?: boolean;
}
export interface ExportProductsPdfOptions {
  products: ProductPdfRow[];
  filterBrand?: string;
  filterCategory?: string;
  searchQuery?: string;
  onProgress?: (percent: number) => void;
}
const numberFormat = new Intl.NumberFormat("en-US", {maximumFractionDigits: 2});
const formatNumber = (value: number | null | undefined) => numberFormat.format(Number(value) || 0);
const WIDTH = 1240, HEIGHT = 1754, MARGIN = 54, BOTTOM = 1670;
const columnWidths = [70, 272, 118, 156, 145, 145, 145, 81];
const headings = ["#", "اسم المنتج", "العلامة", "الفئة / القسم", "سعر المفرد", "سعر الجملة", "سعر الوكيل", "المخزون"];
const LINE = 26, PADDING = 12;
type Row = {lines: string[][]; index: number; hidden: boolean; stock: number};
type Page = Row[];

// Use the browser's Arabic shaping directly. No giant DOM snapshot or repeated full-report image.
function wrapText(ctx: CanvasRenderingContext2D, value: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of value.split(/\s+/u)) {
    if (!word) continue;
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= width) { line = candidate; continue; }
    if (line) { lines.push(line); line = ""; }
    // Long model numbers and unbroken names must also fit in their cells.
    for (const char of word) {
      if (line && ctx.measureText(line + char).width > width) { lines.push(line); line = ""; }
      line += char;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : ["—"];
}
const rowHeight = (row: Row) => Math.max(...row.lines.map(cell => cell.length)) * LINE + PADDING * 2;
const tableStart = (page: number) => page === 0 ? 350 : 180;

function paginate(rows: Row[]): Page[] {
  const pages: Page[] = [[]];
  let y = tableStart(0) + 48;
  for (const row of rows) {
    let remaining = row.lines.map(cell => [...cell]);
    while (remaining.some(cell => cell.length)) {
      const availableLines = Math.floor((BOTTOM - y - PADDING * 2) / LINE);
      if (availableLines < 1) { pages.push([]); y = tableStart(pages.length - 1) + 48; continue; }
      const chunk = {...row, lines: remaining.map(cell => cell.slice(0, availableLines))};
      // Keep ordinary rows together; split only a row taller than a whole page.
      if (rowHeight(chunk) < rowHeight({...row, lines: remaining}) && pages[pages.length - 1].length) {
        pages.push([]); y = tableStart(pages.length - 1) + 48; continue;
      }
      pages[pages.length - 1].push(chunk);
      y += rowHeight(chunk);
      remaining = remaining.map(cell => cell.slice(availableLines));
    }
  }
  return pages;
}
// Yield between pages so progress and the loading animation can paint.
const yieldToBrowser = () => new Promise<void>(resolve => setTimeout(resolve, 0));

export async function createProductsPdf(options: ExportProductsPdfOptions): Promise<jsPDF> {
  const {products, onProgress} = options;
  if (!products.length) throw new Error("لا توجد منتجات للتصدير");
  onProgress?.(0);
  await yieldToBrowser();
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH; canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("تعذر إنشاء تقرير PDF");
  ctx.font = "18px system-ui, sans-serif";
  const rows = products.map((product, index): Row => {
    const name = product.nameAr || product.nameEn || product.nameData || "منتج بدون اسم";
    const values = [String(index + 1), name + (product.is_active === false ? " (مخفي)" : ""), product.brand || "—", product.subcategory || product.category || "—",
      `${formatNumber(product.priceIqd)} د.ع`, product.priceWholesale ? `${formatNumber(product.priceWholesale)} د.ع` : "—",
      product.priceDealer ? `${formatNumber(product.priceDealer)} د.ع` : "—", formatNumber(product.stock)];
    return {lines: values.map((value, column) => wrapText(ctx, value, columnWidths[column] - PADDING * 2)), index, hidden: product.is_active === false, stock: product.stock};
  });
  const pages = paginate(rows);
  const pdf = new jsPDF({orientation: "portrait", unit: "mm", format: "a4", compress: true});
  const totals = products.reduce((sum, product) => ({stock: sum.stock + product.stock, retail: sum.retail + product.stock * product.priceIqd, cost: sum.cost + product.stock * (product.costUsd || 0)}), {stock: 0, retail: 0, cost: 0});
  const date = new Date().toLocaleString("ar-IQ");
  function text(value: string, x: number, y: number, size = 18, color = "#334155") {
    ctx!.font = `${size}px system-ui, sans-serif`; ctx!.fillStyle = color;
    ctx!.direction = "rtl"; ctx!.textAlign = "right"; ctx!.textBaseline = "top";
    ctx!.fillText(value, x, y);
  }
  try {
    for (let page = 0; page < pages.length; page++) {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, WIDTH, HEIGHT);
      text("شركة أُفق البصرة", WIDTH - MARGIN, MARGIN, 30, "#0369a1");
      text("تقرير قائمة المنتجات والمخزون", WIDTH - MARGIN, 100, 22);
      text(date, 480, MARGIN, 16, "#64748b");
      if (page === 0) {
        const labels = [`العلامة: ${options.filterBrand && options.filterBrand !== "all" ? options.filterBrand : "الجميع"} | القسم: ${options.filterCategory && options.filterCategory !== "all" ? options.filterCategory : "الجميع"}`,
          `البحث: ${options.searchQuery?.trim() || "بدون بحث"}`];
        // Clamp only metadata previews, never product cell data.
        labels.forEach((label, i) => text(wrapText(ctx, label, WIDTH - MARGIN * 2)[0], WIDTH - MARGIN, 146 + i * 28, 17));
        ctx.fillStyle = "#f0f9ff"; ctx.fillRect(MARGIN, 220, WIDTH - MARGIN * 2, 105);
        const summary = [["عدد المنتجات", formatNumber(products.length)], ["قطع المخزون", formatNumber(totals.stock)], ["قيمة المخزون (مفرد)", `${formatNumber(totals.retail)} د.ع`], ["كلفة المخزون", `$${formatNumber(totals.cost)}`]];
        summary.forEach(([label, value], i) => { const x = WIDTH - MARGIN - 18 - i * 283; text(label, x, 235, 17, "#0369a1"); text(value, x, 273, 21, "#0f172a"); });
      }
      let y = tableStart(page);
      ctx.fillStyle = "#0284c7"; ctx.fillRect(MARGIN, y, WIDTH - MARGIN * 2, 48);
      let x = WIDTH - MARGIN;
      headings.forEach((label, column) => { text(label, x - PADDING, y + 13, 17, "#ffffff"); x -= columnWidths[column]; });
      y += 48;
      for (const row of pages[page]) {
        const height = rowHeight(row);
        ctx.fillStyle = row.index % 2 === 0 ? "#ffffff" : "#f8fafc";
        ctx.fillRect(MARGIN, y, WIDTH - MARGIN * 2, height);
        x = WIDTH - MARGIN;
        row.lines.forEach((lines, column) => {
          const width = columnWidths[column];
          ctx.strokeStyle = "#e2e8f0"; ctx.strokeRect(x - width, y, width, height);
          const color = column === 7 ? (row.stock > 5 ? "#047857" : row.stock > 0 ? "#b45309" : "#dc2626") : row.hidden ? "#64748b" : "#0f172a";
          lines.forEach((line, i) => text(line, x - PADDING, y + PADDING + i * LINE, 18, color));
          x -= width;
        });
        y += height;
      }
      text(`صفحة ${page + 1} / ${pages.length} · ${products.length} منتج · أُفق البصرة`, WIDTH - MARGIN, 1700, 16, "#64748b");
      if (page > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.88), "JPEG", 0, 0, 210, 297, `products-${page}`, "FAST");
      onProgress?.(Math.round((page + 1) / pages.length * 95));
      await yieldToBrowser();
    }
    return pdf;
  } finally {
    // Release the single reusable page buffer, including on failure.
    canvas.width = 0; canvas.height = 0;
  }
}
export async function exportProductsToPdf(options: ExportProductsPdfOptions): Promise<number> {
  const pdf = await createProductsPdf(options);
  await pdf.save(`تقرير_المنتجات_${new Date().toISOString().slice(0, 10)}.pdf`, {returnPromise: true});
  options.onProgress?.(100);
  return options.products.length;
}

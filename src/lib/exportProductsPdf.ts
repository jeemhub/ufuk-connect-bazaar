import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

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
}

function formatNumber(val: number | string | null | undefined): string {
  const n = Number(val);
  if (!Number.isFinite(n) || n === 0) return "0";
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

export async function exportProductsToPdf({
  products,
  filterBrand,
  filterCategory,
  searchQuery,
}: ExportProductsPdfOptions): Promise<number> {
  if (!products || products.length === 0) {
    throw new Error("لا توجد منتجات للتصدير");
  }

  // Calculate totals
  let totalStock = 0;
  let totalRetailValueIqd = 0;
  let totalCostUsd = 0;

  for (const p of products) {
    const st = Number(p.stock || 0);
    totalStock += st;
    totalRetailValueIqd += Number(p.priceIqd || 0) * st;
    totalCostUsd += Number(p.costUsd || 0) * st;
  }

  const nowStr = new Date().toLocaleString("ar-IQ", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const brandFilterLabel = filterBrand && filterBrand !== "all" ? filterBrand : "الجميع";
  const catFilterLabel = filterCategory && filterCategory !== "all" ? filterCategory : "الجميع";
  const searchLabel = searchQuery && searchQuery.trim() ? searchQuery.trim() : "بدون بحث";

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "960px";
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#0f172a";
  container.style.fontFamily = "system-ui, -apple-system, sans-serif";
  container.style.direction = "rtl";
  container.style.padding = "32px";

  container.innerHTML = `
    <div style="border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 style="font-size: 24px; font-weight: 800; color: #0369a1; margin: 0 0 4px 0;">شركة أُفق البصرة</h1>
        <h2 style="font-size: 16px; font-weight: 700; color: #334155; margin: 0;">تقرير قائمة المنتجات والمخزون</h2>
      </div>
      <div style="text-align: left; font-size: 12px; color: #64748b;">
        <div><strong>تاريخ الاستخراج:</strong> ${nowStr}</div>
        <div><strong>العلامة:</strong> ${brandFilterLabel} | <strong>القسم:</strong> ${catFilterLabel}</div>
        <div><strong>كلمة البحث:</strong> ${searchLabel}</div>
      </div>
    </div>

    <!-- Summary Box -->
    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <div style="font-size: 13px; font-weight: 700; color: #0369a1; margin-bottom: 10px;">ملخص إحصائيات التقرير:</div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 13px; text-align: center;">
        <div style="background-color: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #e0f2fe;">
          <div style="color: #0369a1; font-size: 11px; font-weight: 600;">عدد المنتجات</div>
          <div style="font-weight: 800; font-size: 16px; color: #0284c7;">${products.length} منتج</div>
        </div>
        <div style="background-color: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #e0f2fe;">
          <div style="color: #047857; font-size: 11px; font-weight: 600;">قطع المخزون الكلية</div>
          <div style="font-weight: 800; font-size: 16px; color: #065f46;">${formatNumber(totalStock)} قطعة</div>
        </div>
        <div style="background-color: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #e0f2fe;">
          <div style="color: #b45309; font-size: 11px; font-weight: 600;">إجمالي قيمة المخزون (مفرد)</div>
          <div style="font-weight: 800; font-size: 15px; color: #92400e;">${formatNumber(totalRetailValueIqd)} د.ع</div>
        </div>
        <div style="background-color: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #e0f2fe;">
          <div style="color: #4f46e5; font-size: 11px; font-weight: 600;">إجمالي كلفة المخزون ($)</div>
          <div style="font-weight: 800; font-size: 15px; color: #4338ca;">$${formatNumber(totalCostUsd)}</div>
        </div>
      </div>
    </div>

    <!-- Details Table -->
    <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
      <thead>
        <tr style="background-color: #0284c7; color: #ffffff; text-align: right;">
          <th style="padding: 8px 6px; border: 1px solid #0284c7; text-align: center; width: 4%;">#</th>
          <th style="padding: 8px 6px; border: 1px solid #0284c7; width: 30%;">اسم المنتج</th>
          <th style="padding: 8px 6px; border: 1px solid #0284c7; width: 12%;">العلامة</th>
          <th style="padding: 8px 6px; border: 1px solid #0284c7; width: 14%;">الفئة / القسم</th>
          <th style="padding: 8px 6px; border: 1px solid #0284c7; text-align: left; width: 11%;">سعر المفرد</th>
          <th style="padding: 8px 6px; border: 1px solid #0284c7; text-align: left; width: 11%;">سعر الجملة</th>
          <th style="padding: 8px 6px; border: 1px solid #0284c7; text-align: left; width: 11%;">سعر الوكيل</th>
          <th style="padding: 8px 6px; border: 1px solid #0284c7; text-align: center; width: 7%;">المخزون</th>
        </tr>
      </thead>
      <tbody>
        ${products
          .map((p, i) => {
            const name = p.nameAr || p.nameEn || p.nameData || "منتج بدون اسم";
            const stockColor = p.stock > 5 ? "#047857" : p.stock > 0 ? "#b45309" : "#dc2626";
            return `
              <tr style="background-color: ${i % 2 === 0 ? "#ffffff" : "#f8fafc"}; border-bottom: 1px solid #e2e8f0; opacity: ${p.is_active === false ? "0.6" : "1"};">
                <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; color: #64748b;">${i + 1}</td>
                <td style="padding: 6px; border: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">
                  ${name}
                  ${p.is_active === false ? '<span style="color:#ef4444; font-size:9px; margin-right:4px;">(مخفي)</span>' : ""}
                </td>
                <td style="padding: 6px; border: 1px solid #e2e8f0; color: #334155;">${p.brand || "—"}</td>
                <td style="padding: 6px; border: 1px solid #e2e8f0; color: #64748b;">${p.subcategory || p.category || "—"}</td>
                <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; font-weight: 700;">${formatNumber(p.priceIqd)} د.ع</td>
                <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: #475569;">${p.priceWholesale ? formatNumber(p.priceWholesale) + " د.ع" : "—"}</td>
                <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: #475569;">${p.priceDealer ? formatNumber(p.priceDealer) + " د.ع" : "—"}</td>
                <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: center; font-family: monospace; font-weight: 700; color: ${stockColor};">${p.stock}</td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>

    <div style="margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
      عدد المنتجات المشمولة بالتقرير: <strong>${products.length}</strong> منتج · تم الاستخراج تلقائياً من نظام شركة أُفق البصرة
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`تقرير_المنتجات_${new Date().toISOString().slice(0, 10)}.pdf`);
    return products.length;
  } finally {
    document.body.removeChild(container);
  }
}

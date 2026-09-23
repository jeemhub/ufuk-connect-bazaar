import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { CustomerBalanceRow, BalanceType, BalanceCurrency } from "./model";

function formatMoney(val: number | string): string {
  const n = Number(val);
  if (!Number.isFinite(n) || n === 0) return "0";
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
}

export async function exportCustomerBalancesPdf({
  rows,
  balanceType,
  currency,
}: {
  rows: CustomerBalanceRow[];
  balanceType: BalanceType;
  currency: BalanceCurrency;
}) {
  if (!rows || rows.length === 0) {
    throw new Error("لا توجد بيانات أرصدة للتصدير");
  }

  // Calculate totals
  let totalDebitUsd = 0;
  let totalCreditUsd = 0;
  let totalDebitIqd = 0;
  let totalCreditIqd = 0;

  for (const r of rows) {
    totalDebitUsd += Number(r.debit_usd || 0);
    totalCreditUsd += Number(r.credit_usd || 0);
    totalDebitIqd += Number(r.debit_iqd || 0);
    totalCreditIqd += Number(r.credit_iqd || 0);
  }

  const balanceTypeLabel =
    balanceType === "debit" ? "العملاء المدينين فقط" : balanceType === "credit" ? "العملاء الدائنين فقط" : "جميع الأرصدة (دائن ومدين)";

  const currencyLabel =
    currency === "usd" ? "بالدولار الأمريكي ($)" : currency === "iqd" ? "بالدينار العراقي (IQD)" : "جميع العملات (دولار ودينار)";

  const nowStr = new Date().toLocaleString("ar-IQ", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Create temporary container element off-screen for rendering PDF canvas
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "900px";
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#0f172a";
  container.style.fontFamily = "system-ui, -apple-system, sans-serif";
  container.style.direction = "rtl";
  container.style.padding = "32px";

  container.innerHTML = `
    <div style="border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1 style="font-size: 24px; font-weight: 800; color: #0369a1; margin: 0 0 4px 0;">شركة أُفق البصرة</h1>
        <h2 style="font-size: 16px; font-weight: 700; color: #334155; margin: 0;">تقرير أرصدة العملاء (مدين ودائن)</h2>
      </div>
      <div style="text-align: left; font-size: 12px; color: #64748b;">
        <div><strong>التاريخ:</strong> ${nowStr}</div>
        <div><strong>نوع التقرير:</strong> ${balanceTypeLabel}</div>
        <div><strong>العملة:</strong> ${currencyLabel}</div>
      </div>
    </div>

    <!-- Summary Box -->
    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <div style="font-size: 13px; font-weight: 700; color: #0369a1; margin-bottom: 10px;">ملخص الإجمالي الكلي للتقرير:</div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 13px; text-align: center;">
        <div style="background-color: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #e0f2fe;">
          <div style="color: #b45309; font-size: 11px; font-weight: 600;">إجمالي المدين ($)</div>
          <div style="font-weight: 800; font-size: 15px; color: #92400e;">$${formatMoney(totalDebitUsd)}</div>
        </div>
        <div style="background-color: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #e0f2fe;">
          <div style="color: #047857; font-size: 11px; font-weight: 600;">إجمالي الدائن ($)</div>
          <div style="font-weight: 800; font-size: 15px; color: #065f46;">$${formatMoney(totalCreditUsd)}</div>
        </div>
        <div style="background-color: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #e0f2fe;">
          <div style="color: #b45309; font-size: 11px; font-weight: 600;">إجمالي المدين (IQD)</div>
          <div style="font-weight: 800; font-size: 15px; color: #92400e;">${formatMoney(totalDebitIqd)} د.ع</div>
        </div>
        <div style="background-color: #ffffff; padding: 10px; border-radius: 8px; border: 1px solid #e0f2fe;">
          <div style="color: #047857; font-size: 11px; font-weight: 600;">إجمالي الدائن (IQD)</div>
          <div style="font-weight: 800; font-size: 15px; color: #065f46;">${formatMoney(totalCreditIqd)} د.ع</div>
        </div>
      </div>
    </div>

    <!-- Details Table -->
    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr style="background-color: #0284c7; color: #ffffff; text-align: right;">
          <th style="padding: 10px 8px; border: 1px solid #0284c7; text-align: center; width: 12%;">رقم العميل</th>
          <th style="padding: 10px 8px; border: 1px solid #0284c7; width: 34%;">اسم العميل</th>
          <th style="padding: 10px 8px; border: 1px solid #0284c7; text-align: left; width: 135px;">مدين ($)</th>
          <th style="padding: 10px 8px; border: 1px solid #0284c7; text-align: left; width: 135px;">دائن ($)</th>
          <th style="padding: 10px 8px; border: 1px solid #0284c7; text-align: left; width: 135px;">مدين (د.ع)</th>
          <th style="padding: 10px 8px; border: 1px solid #0284c7; text-align: left; width: 135px;">دائن (د.ع)</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r, i) => `
          <tr style="background-color: ${i % 2 === 0 ? "#ffffff" : "#f8fafc"}; border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: 700; font-family: monospace;">${r.customer_number || "—"}</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">${r.customer_name}</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: ${Number(r.debit_usd) > 0 ? "#b45309" : "#64748b"}; font-weight: ${Number(r.debit_usd) > 0 ? "700" : "400"};">${formatMoney(r.debit_usd)}</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: ${Number(r.credit_usd) > 0 ? "#047857" : "#64748b"}; font-weight: ${Number(r.credit_usd) > 0 ? "700" : "400"};">${formatMoney(r.credit_usd)}</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: ${Number(r.debit_iqd) > 0 ? "#b45309" : "#64748b"}; font-weight: ${Number(r.debit_iqd) > 0 ? "700" : "400"};">${formatMoney(r.debit_iqd)}</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: left; font-family: monospace; color: ${Number(r.credit_iqd) > 0 ? "#047857" : "#64748b"}; font-weight: ${Number(r.credit_iqd) > 0 ? "700" : "400"};">${formatMoney(r.credit_iqd)}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>

    <div style="margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
      عدد العملاء المشمولين بالتقرير: <strong>${rows.length}</strong> عميل · تم الاستخراج تلقائياً من نظام شركة أُفق البصرة
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

    pdf.save(`تقرير_أرصدة_العملاء_${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "@/assets/logo.png";

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPriceIqd: number;
}

export interface InvoiceData {
  orderNo: string;
  createdAt?: Date;
  customerName: string;
  customerPhone: string;
  customerCity?: string | null;
  customerAddress?: string | null;
  notes?: string | null;
  items: InvoiceItem[];
  totalIqd: number;
}

const COMPANY = {
  name: "Ufuk Basra Group",
  phone: "+964 771 699 2955",
  email: "sales@ufukbasra.com.iq",
  address: "Basra, Iraq",
};

async function loadImage(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

export async function generateInvoicePdf(data: InvoiceData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;

  // ===== HEADER: Logo + Company =====
  try {
    const logoData = await loadImage(logoUrl);
    doc.addImage(logoData, "PNG", margin, 10, 30, 30);
  } catch {
    /* ignore */
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30, 39, 97);
  doc.text(COMPANY.name, pageW - margin, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  doc.text(COMPANY.address, pageW - margin, 25, { align: "right" });
  doc.text(COMPANY.phone, pageW - margin, 30, { align: "right" });
  doc.text(COMPANY.email, pageW - margin, 35, { align: "right" });

  // Divider
  doc.setDrawColor(30, 39, 97);
  doc.setLineWidth(0.6);
  doc.line(margin, 44, pageW - margin, 44);

  // ===== Invoice meta =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 39, 97);
  doc.text("INVOICE", margin, 54);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40);
  const created = (data.createdAt ?? new Date()).toLocaleString("en-GB");
  doc.text(`Order No: ${data.orderNo}`, pageW - margin, 52, { align: "right" });
  doc.text(`Date: ${created}`, pageW - margin, 57, { align: "right" });

  // ===== Bill to =====
  let y = 64;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Bill To:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 5;
  doc.text(data.customerName, margin, y); y += 5;
  doc.text(`Phone: ${data.customerPhone}`, margin, y); y += 5;
  if (data.customerCity) { doc.text(`City: ${data.customerCity}`, margin, y); y += 5; }
  if (data.customerAddress) {
    const lines = doc.splitTextToSize(`Address: ${data.customerAddress}`, pageW - margin * 2);
    doc.text(lines, margin, y); y += 5 * lines.length;
  }

  // ===== Items table =====
  autoTable(doc, {
    startY: y + 4,
    head: [["#", "Product", "Qty", "Unit Price (IQD)", "Subtotal (IQD)"]],
    body: data.items.map((it, i) => [
      i + 1,
      it.name,
      it.quantity,
      fmt(it.unitPriceIqd),
      fmt(it.unitPriceIqd * it.quantity),
    ]),
    styles: { font: "helvetica", fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [30, 39, 97], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      2: { halign: "center", cellWidth: 18 },
      3: { halign: "right", cellWidth: 38 },
      4: { halign: "right", cellWidth: 38 },
    },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore
  const finalY = (doc as any).lastAutoTable.finalY ?? y + 40;

  // ===== Total =====
  const totalY = finalY + 8;
  doc.setDrawColor(220);
  doc.setLineWidth(0.3);
  doc.line(pageW - margin - 80, totalY - 4, pageW - margin, totalY - 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 39, 97);
  doc.text("TOTAL:", pageW - margin - 60, totalY + 3);
  doc.setFontSize(14);
  doc.text(`${fmt(data.totalIqd)} IQD`, pageW - margin, totalY + 3, { align: "right" });

  if (data.notes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90);
    const noteLines = doc.splitTextToSize(`Notes: ${data.notes}`, pageW - margin * 2);
    doc.text(noteLines, margin, totalY + 16);
  }

  // ===== Footer =====
  const footerY = pageH - 18;
  doc.setDrawColor(30, 39, 97);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 4, pageW - margin, footerY - 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 39, 97);
  doc.text(COMPANY.name, margin, footerY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.setFontSize(9);
  const footerLine = `${COMPANY.phone}   |   ${COMPANY.email}   |   ${COMPANY.address}`;
  doc.text(footerLine, pageW / 2, footerY + 5, { align: "center" });

  doc.save(`Invoice-${data.orderNo}.pdf`);
}

/**
 * Resolve English product names (fallback: name_data, then provided fallback)
 * so invoices are always generated in English regardless of UI language.
 */
export async function resolveEnglishNames(
  ids: (string | null | undefined)[],
): Promise<Record<string, string>> {
  const clean = Array.from(new Set(ids.filter((v): v is string => !!v)));
  if (!clean.length) return {};
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase
    .from("products")
    .select("id, name_en, name_data")
    .in("id", clean);
  const map: Record<string, string> = {};
  for (const p of data ?? []) {
    const n = (p as { name_en: string | null; name_data: string | null });
    const name = (n.name_en || n.name_data || "").trim();
    if (name) map[(p as { id: string }).id] = name;
  }
  return map;
}

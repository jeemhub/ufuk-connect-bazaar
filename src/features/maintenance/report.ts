import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { dateLabel, locationLabel, statusLabels, type MaintenanceDevice } from "./model";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
}

export async function exportMaintenanceReport(devices: MaintenanceDevice[]): Promise<void> {
  if (!devices.length) throw new Error("حدد جهازاً واحداً على الأقل لإعداد التقرير");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pages: MaintenanceDevice[][] = [];
  for (let i = 0; i < devices.length; i += 5) pages.push(devices.slice(i, i + 5));
  await document.fonts.ready;
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    if (pageIndex) pdf.addPage();
    const sheet = document.createElement("div");
    sheet.dir = "rtl";
    sheet.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;height:1123px;box-sizing:border-box;background:#fff;color:#142339;padding:48px 45px;font-family:Cairo,Arial,sans-serif;";
    const rows = pages[pageIndex].map((device, rowIndex) => `
      <tr style="background:${rowIndex % 2 ? "#f4f7fb" : "#fff"}">
        <td>${pageIndex * 5 + rowIndex + 1}</td><td><strong>${escapeHtml(device.device_name)}</strong><br><small>${escapeHtml(device.serial_number)}<br>استلام: ${escapeHtml(dateLabel(device.received_at))}</small></td>
        <td>${escapeHtml(device.owner_name)}<br><small>${escapeHtml(device.owner_phone)}</small></td>
        <td>${escapeHtml(locationLabel(device.location, device.custom_location))}</td>
        <td>${escapeHtml(statusLabels[device.status])}</td>
        <td>${escapeHtml(device.notes ? `${device.notes.slice(0, 100)}${device.notes.length > 100 ? "…" : ""}` : "—")}</td>
      </tr>`).join("");
    sheet.innerHTML = `
      <div style="border-bottom:3px solid #0c6b8e;padding-bottom:20px;display:flex;justify-content:space-between;align-items:end">
        <div><div style="font-size:29px;font-weight:800;color:#0c6b8e">شركة أفق البصرة</div><div style="font-size:19px;font-weight:700">تقرير قسم الصيانة</div></div>
        <div style="font-size:12px;color:#55667a;text-align:left">${escapeHtml(dateLabel(new Date().toISOString()))}<br>عدد الأجهزة: ${devices.length}</div>
      </div>
      <p style="font-size:13px;color:#536477;margin:20px 0 16px">كشف بالأجهزة المحددة، يتضمن بياناتها وموقعها وحالتها وقت إصدار التقرير.</p>
      <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:11px;line-height:1.6;word-break:break-word">
        <thead><tr style="background:#0c6b8e;color:#fff"><th style="width:5%">#</th><th style="width:23%">الجهاز / السيريل</th><th style="width:19%">صاحب الجهاز / الهاتف</th><th style="width:14%">الموقع</th><th style="width:14%">الحالة</th><th style="width:25%">ملاحظات</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="position:absolute;bottom:55px;right:45px;left:45px;border-top:1px solid #d6e0e8;padding-top:18px;display:flex;justify-content:space-between;align-items:end">
        <div style="font-size:14px;font-weight:700;line-height:1.9">مسؤل قسم الصيانة<br>م.جاسم العتيبي</div>
        <div style="font-size:11px;color:#66788a">صفحة ${pageIndex + 1} من ${pages.length}</div>
      </div>`;
    sheet.querySelectorAll("th,td").forEach((cell) => { (cell as HTMLElement).style.padding = "9px 6px"; (cell as HTMLElement).style.textAlign = "right"; (cell as HTMLElement).style.borderBottom = "1px solid #e4eaf0"; (cell as HTMLElement).style.verticalAlign = "top"; });
    document.body.appendChild(sheet);
    try {
      const canvas = await html2canvas(sheet, { scale: 2, backgroundColor: "#ffffff", logging: false });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    } finally {
      sheet.remove();
    }
  }
  pdf.save(`maintenance-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

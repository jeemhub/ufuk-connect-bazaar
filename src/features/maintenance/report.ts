import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { dateLabel, eventLabels, locationLabel, statusLabel, type MaintenanceDevice, type MaintenanceEvent } from "./model";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
}

type ReportOptions = { includeTimeline: boolean; events: MaintenanceEvent[] };
type ReportPage = { kind: "summary"; devices: MaintenanceDevice[]; start: number } | { kind: "timeline" | "single"; device: MaintenanceDevice; events: MaintenanceEvent[] };

function makePages(devices: MaintenanceDevice[], options: ReportOptions): ReportPage[] {
  if (devices.length === 1 && options.includeTimeline) {
    const history = options.events.filter((event) => event.device_id === devices[0].id)
      .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at) || a.created_at.localeCompare(b.created_at));
    return [{ kind: "single", device: devices[0], events: history }];
  }
  const pages: ReportPage[] = [];
  for (let i = 0; i < devices.length; i += 5) pages.push({ kind: "summary", devices: devices.slice(i, i + 5), start: i });
  if (!options.includeTimeline) return pages;
  for (const device of devices) {
    const history = options.events.filter((event) => event.device_id === device.id)
      .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at) || a.created_at.localeCompare(b.created_at));
    if (!history.length) { pages.push({ kind: "timeline", device, events: [] }); continue; }
    let chunk: MaintenanceEvent[] = [];
    let lines = 0;
    for (const event of history) {
      const size = 4 + Math.ceil(event.note.length / 80) + (event.note.match(/\n/g)?.length ?? 0);
      if (chunk.length && (chunk.length >= 5 || lines + size > 28)) {
        pages.push({ kind: "timeline", device, events: chunk });
        chunk = [];
        lines = 0;
      }
      chunk.push(event);
      lines += size;
    }
    if (chunk.length) pages.push({ kind: "timeline", device, events: chunk });
  }
  return pages;
}

function timelineContent(device: MaintenanceDevice, events: MaintenanceEvent[], compact = false): string {
  const groups: MaintenanceEvent[][] = [];
  for (let i = 0; i < events.length; i += 5) groups.push(events.slice(i, i + 5));
  const timeline = groups.length ? groups.map((group) => `
    <div style="position:relative;display:flex;direction:rtl;margin:${compact ? "13px" : "20px"} 0 18px;min-height:${compact ? "105px" : "128px"}">
      ${group.length > 1 ? `<div style="position:absolute;top:8px;right:${100 / (group.length * 2)}%;left:${100 / (group.length * 2)}%;height:3px;background:#b5d7e3"></div>` : ""}
      ${group.map((event) => `<div style="position:relative;flex:1;min-width:0;padding:0 7px;text-align:center;overflow-wrap:anywhere">
        <span style="display:block;position:relative;z-index:1;width:17px;height:17px;box-sizing:border-box;margin:0 auto 12px;border:4px solid #0c6b8e;border-radius:50%;background:#fff"></span>
        <strong style="display:block;font-size:12px;line-height:1.5">${escapeHtml(eventLabels[event.event_type])}</strong>
        <span style="display:block;font-size:11px;color:#536477;line-height:1.5">${escapeHtml(locationLabel(event.location, event.custom_location))}</span>
        <span style="display:block;font-size:10px;color:#66788a;line-height:1.5;margin-top:4px">${escapeHtml(dateLabel(event.occurred_at))}</span>
        <span style="display:block;font-size:10px;color:#536477;line-height:1.5">${escapeHtml(statusLabel(event.status))}</span>
      </div>`).join("")}
    </div>`).join("") : `<p style="font-size:13px;color:#66788a">لا توجد أحداث مسجلة لهذا الجهاز.</p>`;
  const notes = events.filter((event) => event.note).map((event) => `
    <div style="padding:9px 12px;margin-top:8px;background:#f4f7fb;border-radius:8px;overflow-wrap:anywhere">
      <strong style="font-size:11px;color:#0c6b8e">${escapeHtml(eventLabels[event.event_type])} · ${escapeHtml(dateLabel(event.occurred_at))}</strong>
      <div style="font-size:11px;line-height:1.6;white-space:pre-wrap;margin-top:4px">${escapeHtml(event.note)}</div>
    </div>`).join("");
  return `${compact ? "" : `<div style="margin:20px 0 22px;padding:15px 18px;border-radius:10px;background:#eef6f9">
      <div style="font-size:18px;font-weight:700">${escapeHtml(device.device_name)}</div>
      <div style="font-size:12px;color:#536477;margin-top:5px">السيريل: ${escapeHtml(device.serial_number)} · صاحب الجهاز: ${escapeHtml(device.owner_name)}</div>
    </div>`}<div style="font-size:15px;font-weight:700;margin:${compact ? "12px" : "0"} 0 12px">الخط الزمني للجهاز</div>${timeline}${notes ? `<div style="font-size:12px;font-weight:700;margin-top:12px">تفاصيل الحركات</div>${notes}` : ""}`;
}

export async function exportMaintenanceReport(devices: MaintenanceDevice[], options: ReportOptions = { includeTimeline: false, events: [] }): Promise<void> {
  if (!devices.length) throw new Error("حدد جهازاً واحداً على الأقل لإعداد التقرير");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pages = makePages(devices, options);
  await document.fonts.ready;
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    if (pageIndex) pdf.addPage();
    const sheet = document.createElement("div");
    sheet.dir = "rtl";
    sheet.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;height:1123px;box-sizing:border-box;background:#fff;color:#142339;padding:48px 45px;font-family:Cairo,Arial,sans-serif;";
    const page = pages[pageIndex];
    const summaryDevices = page.kind === "summary" ? page.devices : page.kind === "single" ? [page.device] : [];
    const rows = summaryDevices.map((device, rowIndex) => `
      <tr style="background:${rowIndex % 2 ? "#f4f7fb" : "#fff"}">
        <td>${(page.kind === "summary" ? page.start : 0) + rowIndex + 1}</td><td><strong>${escapeHtml(device.device_name)}</strong><br><small>${escapeHtml(device.serial_number)}<br>استلام: ${escapeHtml(dateLabel(device.received_at))}</small></td>
        <td>${escapeHtml(device.owner_name)}<br><small>${escapeHtml(device.owner_phone)}</small></td>
        <td>${escapeHtml(locationLabel(device.location, device.custom_location))}</td>
        <td>${escapeHtml(statusLabel(device.status))}</td>
        <td>${escapeHtml(device.notes ? `${device.notes.slice(0, 100)}${device.notes.length > 100 ? "…" : ""}` : "—")}</td>
      </tr>`).join("");
    const content = page.kind === "timeline" ? timelineContent(page.device, page.events) : `
      <p style="font-size:13px;color:#536477;margin:20px 0 16px">كشف بالأجهزة المحددة، يتضمن بياناتها وموقعها وحالتها وقت إصدار التقرير.</p>
      <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:11px;line-height:1.6;word-break:break-word">
        <thead><tr style="background:#0c6b8e;color:#fff"><th style="width:5%">#</th><th style="width:23%">الجهاز / السيريل</th><th style="width:19%">صاحب الجهاز / الهاتف</th><th style="width:14%">الموقع</th><th style="width:14%">الحالة</th><th style="width:25%">ملاحظات</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>${page.kind === "single" ? timelineContent(page.device, page.events, true) : ""}`;
    sheet.innerHTML = `
      <div style="border-bottom:3px solid #0c6b8e;padding-bottom:20px;display:flex;justify-content:space-between;align-items:end">
        <div><div style="font-size:29px;font-weight:800;color:#0c6b8e">شركة أفق البصرة</div><div style="font-size:19px;font-weight:700">تقرير قسم الصيانة</div></div>
        <div style="font-size:12px;color:#55667a;text-align:left">${escapeHtml(dateLabel(new Date().toISOString()))}<br>عدد الأجهزة: ${devices.length}</div>
      </div>
      <div data-report-content>${content}</div>
      <div style="position:absolute;bottom:55px;right:45px;left:45px;border-top:1px solid #d6e0e8;padding-top:18px;display:flex;justify-content:space-between;align-items:end">
        <div style="font-size:14px;font-weight:700;line-height:1.9">مسؤل قسم الصيانة<br>م.جاسم العتيبي</div>
        <div style="font-size:11px;color:#66788a">صفحة ${pageIndex + 1} من ${pages.length}</div>
      </div>`;
    sheet.querySelectorAll("th,td").forEach((cell) => { (cell as HTMLElement).style.padding = "9px 6px"; (cell as HTMLElement).style.textAlign = "right"; (cell as HTMLElement).style.borderBottom = "1px solid #e4eaf0"; (cell as HTMLElement).style.verticalAlign = "top"; });
    document.body.appendChild(sheet);
    try {
      if (page.kind === "single") {
        const body = sheet.querySelector<HTMLElement>("[data-report-content]")!;
        const availableHeight = 940 - body.getBoundingClientRect().top;
        let scale = 1;
        for (let attempt = 0; attempt < 3 && body.getBoundingClientRect().height > availableHeight; attempt++) {
          scale *= availableHeight / body.getBoundingClientRect().height;
          body.style.transformOrigin = "top right";
          body.style.width = `${100 / scale}%`;
          body.style.transform = `scale(${scale})`;
        }
      }
      const canvas = await html2canvas(sheet, { scale: 2, backgroundColor: "#ffffff", logging: false });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    } finally {
      sheet.remove();
    }
  }
  pdf.save(`maintenance-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MaintenanceDevice, MaintenanceEvent } from "./model";

const { renderedPages } = vi.hoisted(() => ({ renderedPages: [] as string[] }));

vi.mock("html2canvas", () => ({
  default: vi.fn(async (sheet: HTMLElement) => {
    renderedPages.push(sheet.innerHTML);
    return { toDataURL: () => "data:image/png;base64,dGVzdA==" };
  }),
}));

vi.mock("jspdf", () => ({
  jsPDF: class {
    addPage() {}
    addImage() {}
    save() {}
  },
}));

import { exportMaintenanceReport } from "./report";

const device: MaintenanceDevice = {
  id: "device-1", device_name: "جهاز اختبار", serial_number: "TEST-1", owner_name: "جاسم", owner_phone: "07700000000",
  location: "office", custom_location: null, status: "in_repair", notes: "", received_at: "2026-09-27T08:00:00.000Z", updated_at: "2026-09-28T08:00:00.000Z",
};
const events: MaintenanceEvent[] = [
  { id: "event-2", device_id: device.id, event_type: "transfer", location: "baghdad", custom_location: null, status: "in_repair", note: "أُرسل إلى بغداد", occurred_at: "2026-09-28T08:00:00.000Z", created_at: "2026-09-28T08:00:00.000Z" },
  { id: "event-1", device_id: device.id, event_type: "received", location: "office", custom_location: null, status: "faulty", note: "", occurred_at: "2026-09-27T08:00:00.000Z", created_at: "2026-09-27T08:00:00.000Z" },
];

describe("maintenance report timeline", () => {
  beforeEach(() => {
    renderedPages.length = 0;
    Object.defineProperty(document, "fonts", { configurable: true, value: { ready: Promise.resolve() } });
  });

  it("keeps the report brief when the timeline is off", async () => {
    await exportMaintenanceReport([device], { includeTimeline: false, events });
    expect(renderedPages).toHaveLength(1);
    expect(renderedPages[0]).toContain("كشف بالأجهزة المحددة");
    expect(renderedPages[0]).not.toContain("الخط الزمني للجهاز");
  });

  it("adds a right-to-left horizontal timeline in event order", async () => {
    await exportMaintenanceReport([device], { includeTimeline: true, events });
    expect(renderedPages).toHaveLength(2);
    const timeline = renderedPages[1];
    expect(timeline).toContain("display:flex;direction:rtl");
    expect(timeline.indexOf("استلام الجهاز")).toBeLessThan(timeline.indexOf("نقل الجهاز"));
    expect(timeline).toContain("أُرسل إلى بغداد");
    expect(timeline).toContain("م.جاسم العتيبي");
  });
});

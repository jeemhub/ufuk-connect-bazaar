export type DeviceLocation = "office" | "warehouse" | "baghdad" | "custom" | "customer";
export type DeviceStatus = "faulty" | "in_repair" | "repaired" | "delivered";
export type EventType = "received" | "transfer" | "returned" | "repair" | "delivered" | "note";

export interface MaintenanceDevice {
  id: string;
  device_name: string;
  serial_number: string;
  owner_name: string;
  owner_phone: string;
  location: DeviceLocation;
  custom_location: string | null;
  status: DeviceStatus;
  notes: string;
  received_at: string;
  updated_at: string;
}

export interface MaintenanceEvent {
  id: string;
  device_id: string;
  event_type: EventType;
  location: DeviceLocation;
  custom_location: string | null;
  status: DeviceStatus;
  note: string;
  occurred_at: string;
  created_at: string;
}

export const locationLabels: Record<DeviceLocation, string> = {
  office: "المكتب", warehouse: "المخزن", baghdad: "بغداد", custom: "موقع مخصص", customer: "الزبون",
};
export const statusLabels: Record<DeviceStatus, string> = {
  faulty: "عاطل", in_repair: "قيد الصيانة", repaired: "تم إصلاحه", delivered: "تم التسليم",
};
export const eventLabels: Record<EventType, string> = {
  received: "استلام الجهاز", transfer: "نقل الجهاز", returned: "عودة الجهاز", repair: "تحديث الصيانة", delivered: "تسليم للزبون", note: "ملاحظة",
};
export function locationLabel(location: DeviceLocation, custom: string | null): string {
  return location === "custom" ? custom || locationLabels.custom : locationLabels[location];
}
export function dateLabel(date: string): string {
  return new Date(date).toLocaleString("ar-IQ-u-nu-latn", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

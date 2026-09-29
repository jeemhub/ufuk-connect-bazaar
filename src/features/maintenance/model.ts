export type DeviceLocation = "office" | "warehouse" | "baghdad" | "custom" | "customer";
export type KnownDeviceStatus = "faulty" | "in_repair" | "repaired" | "delivered";
export type DeviceStatus = KnownDeviceStatus | (string & {});
export type KnownEventType = "received" | "transfer" | "returned" | "repair" | "delivered" | "note";
export type EventType = KnownEventType | (string & {});

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
export const statusLabels: Record<KnownDeviceStatus, string> = {
  faulty: "عاطل", in_repair: "قيد الصيانة", repaired: "تم إصلاحه", delivered: "تم التسليم",
};
export function isKnownStatus(status: string): status is KnownDeviceStatus {
  return Object.prototype.hasOwnProperty.call(statusLabels, status);
}
export function statusLabel(status: DeviceStatus): string {
  return isKnownStatus(status) ? statusLabels[status] : status;
}
export const eventLabels: Record<KnownEventType, string> = {
  received: "استلام الجهاز", transfer: "نقل الجهاز", returned: "عودة الجهاز", repair: "تحديث الصيانة", delivered: "تسليم للزبون", note: "ملاحظة",
};
export function isKnownEventType(type: string): type is KnownEventType {
  return Object.prototype.hasOwnProperty.call(eventLabels, type);
}
export function eventLabel(type: EventType): string {
  return isKnownEventType(type) ? eventLabels[type] : type;
}
export function locationLabel(location: DeviceLocation, custom: string | null): string {
  return location === "custom" ? custom || locationLabels.custom : locationLabels[location];
}
export function dateLabel(date: string): string {
  return new Date(date).toLocaleString("ar-IQ-u-nu-latn", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

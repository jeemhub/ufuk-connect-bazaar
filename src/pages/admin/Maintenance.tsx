import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, ClipboardList, FileDown, MapPin, PackageCheck, Plus, Search, Wrench } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dateLabel, eventLabels, locationLabel, locationLabels, statusLabels, type DeviceLocation, type DeviceStatus, type EventType, type MaintenanceDevice, type MaintenanceEvent } from "@/features/maintenance/model";
import { exportMaintenanceReport } from "@/features/maintenance/report";

type DeviceForm = { device_name: string; serial_number: string; owner_name: string; owner_phone: string; location: DeviceLocation; custom_location: string; status: DeviceStatus; notes: string };
const blankDevice: DeviceForm = { device_name: "", serial_number: "", owner_name: "", owner_phone: "", location: "office", custom_location: "", status: "faulty", notes: "" };
type EventForm = { event_type: Exclude<EventType, "received">; location: DeviceLocation; custom_location: string; status: DeviceStatus; note: string; occurred_at: string };
const localDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const locationOptions = Object.entries(locationLabels) as [DeviceLocation, string][];
const statusOptions = Object.entries(statusLabels) as [DeviceStatus, string][];
const eventOptions = Object.entries(eventLabels).filter(([key]) => key !== "received") as [EventForm["event_type"], string][];

function errorText(error: { message: string } | null): string {
  if (!error) return "حدث خطأ غير متوقع";
  if (error.message.includes("maintenance_devices_serial_unique")) return "هذا الرقم التسلسلي مسجل مسبقاً";
  return error.message;
}

export default function Maintenance() {
  const [devices, setDevices] = useState<MaintenanceDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<MaintenanceDevice | null>(null);
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [deviceDialog, setDeviceDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deviceForm, setDeviceForm] = useState<DeviceForm>(blankDevice);
  const [eventDialog, setEventDialog] = useState(false);
  const [eventForm, setEventForm] = useState<EventForm>({ event_type: "transfer", location: "office", custom_location: "", status: "faulty", note: "", occurred_at: localDateTime() });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    const all: MaintenanceDevice[] = [];
    for (let start = 0; ; start += 500) {
      const { data, error } = await supabase.from("maintenance_devices").select("*").order("received_at", { ascending: false }).range(start, start + 499);
      if (error) { toast.error(errorText(error)); break; }
      const batch = (data ?? []) as MaintenanceDevice[];
      all.push(...batch);
      if (batch.length < 500) break;
    }
    setDevices(all);
    setLoading(false);
  }, []);

  const loadEvents = useCallback(async (id: string) => {
    setLoadingEvents(true);
    const all: MaintenanceEvent[] = [];
    for (let start = 0; ; start += 500) {
      const { data, error } = await supabase.from("maintenance_events").select("*").eq("device_id", id).order("occurred_at", { ascending: true }).order("created_at", { ascending: true }).range(start, start + 499);
      if (error) { toast.error(errorText(error)); break; }
      const batch = (data ?? []) as MaintenanceEvent[];
      all.push(...batch);
      if (batch.length < 500) break;
    }
    setEvents(all);
    setLoadingEvents(false);
  }, []);

  useEffect(() => { document.title = "قسم الصيانة · لوحة التحكم"; void loadDevices(); }, [loadDevices]);
  const activeId = active?.id;
  useEffect(() => { if (activeId) void loadEvents(activeId); }, [activeId, loadEvents]);

  const filtered = useMemo(() => devices.filter((device) => {
    const term = query.trim().toLocaleLowerCase();
    const matches = !term || [device.device_name, device.serial_number, device.owner_name, device.owner_phone, device.notes, locationLabel(device.location, device.custom_location)].some((value) => value.toLocaleLowerCase().includes(term));
    return matches && (locationFilter === "all" || device.location === locationFilter) && (statusFilter === "all" || device.status === statusFilter);
  }), [devices, query, locationFilter, statusFilter]);
  const stats = useMemo(() => ({ total: devices.length, faulty: devices.filter((d) => d.status === "faulty").length, repairing: devices.filter((d) => d.status === "in_repair").length, repaired: devices.filter((d) => d.status === "repaired" || d.status === "delivered").length }), [devices]);
  const selected = devices.filter((device) => selectedIds.has(device.id));

  const openCreate = () => { setEditingId(null); setDeviceForm(blankDevice); setDeviceDialog(true); };
  const openEdit = (device: MaintenanceDevice) => {
    setEditingId(device.id);
    setDeviceForm({ device_name: device.device_name, serial_number: device.serial_number, owner_name: device.owner_name, owner_phone: device.owner_phone, location: device.location, custom_location: device.custom_location || "", status: device.status, notes: device.notes });
    setDeviceDialog(true);
  };
  const saveDevice = async () => {
    if (![deviceForm.device_name, deviceForm.serial_number, deviceForm.owner_name, deviceForm.owner_phone].every((value) => value.trim())) return toast.error("أكمل اسم الجهاز والسيريل واسم صاحبه ورقم هاتفه");
    if (!editingId && deviceForm.location === "custom" && !deviceForm.custom_location.trim()) return toast.error("اكتب اسم الموقع المخصص");
    setSaving(true);
    const { error } = editingId
      ? await supabase.rpc("maintenance_update_device", { _device_id: editingId, _device_name: deviceForm.device_name, _serial_number: deviceForm.serial_number, _owner_name: deviceForm.owner_name, _owner_phone: deviceForm.owner_phone, _notes: deviceForm.notes })
      : await supabase.from("maintenance_devices").insert({ device_name: deviceForm.device_name.trim(), serial_number: deviceForm.serial_number.trim(), owner_name: deviceForm.owner_name.trim(), owner_phone: deviceForm.owner_phone.trim(), location: deviceForm.location, custom_location: deviceForm.location === "custom" ? deviceForm.custom_location.trim() : null, status: deviceForm.status, notes: deviceForm.notes });
    setSaving(false);
    if (error) return toast.error(errorText(error));
    setDeviceDialog(false);
    toast.success(editingId ? "تم تحديث بيانات الجهاز" : "تم تسجيل الجهاز وبدء الخط الزمني");
    await loadDevices();
    if (active?.id === editingId) setActive((current) => current ? { ...current, device_name: deviceForm.device_name, serial_number: deviceForm.serial_number, owner_name: deviceForm.owner_name, owner_phone: deviceForm.owner_phone, notes: deviceForm.notes } : null);
  };

  const openEvent = (device: MaintenanceDevice) => {
    setActive(device);
    setEventForm({ event_type: "transfer", location: device.location, custom_location: device.custom_location || "", status: device.status, note: "", occurred_at: localDateTime() });
    setEventDialog(true);
  };
  const saveEvent = async () => {
    if (!active) return;
    if (eventForm.location === "custom" && !eventForm.custom_location.trim()) return toast.error("اكتب اسم الموقع المخصص");
    if (eventForm.status === "delivered" && eventForm.location !== "customer") return toast.error("الجهاز المسلم يجب أن يكون موقعه عند الزبون");
    if (eventForm.event_type === "delivered" && (eventForm.location !== "customer" || eventForm.status !== "delivered")) return toast.error("عند التسليم يجب أن يكون الموقع الزبون والحالة تم التسليم");
    const enteredTime = new Date(eventForm.occurred_at);
    const occurredAt = Date.now() - enteredTime.getTime() < 60_000 ? new Date() : enteredTime;
    if (Number.isNaN(occurredAt.getTime()) || occurredAt < new Date(active.received_at) || occurredAt > new Date()) return toast.error("تاريخ الحدث يجب أن يكون بين تاريخ الاستلام والآن");
    setSaving(true);
    const { error } = await supabase.rpc("maintenance_record_event", { _device_id: active.id, _event_type: eventForm.event_type, _location: eventForm.location, _custom_location: eventForm.location === "custom" ? eventForm.custom_location.trim() : null, _status: eventForm.status, _note: eventForm.note, _occurred_at: occurredAt.toISOString() });
    setSaving(false);
    if (error) return toast.error(errorText(error));
    setEventDialog(false);
    toast.success("أضيف الحدث إلى الخط الزمني");
    setActive((current) => current ? { ...current, location: eventForm.location, custom_location: eventForm.location === "custom" ? eventForm.custom_location.trim() : null, status: eventForm.status } : null);
    await Promise.all([loadDevices(), loadEvents(active.id)]);
  };

  const toggleSelected = (id: string) => setSelectedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const exportSelected = async () => {
    setExporting(true);
    try { await exportMaintenanceReport(selected); toast.success("تم إنشاء تقرير PDF"); }
    catch (error) { toast.error((error as Error).message || "تعذر إنشاء التقرير"); }
    finally { setExporting(false); }
  };

  return <div dir="rtl" className="mx-auto max-w-[1500px] space-y-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"><Wrench className="h-4 w-4" /> إدارة الأجهزة وحركتها</div><h1 className="text-3xl font-extrabold tracking-tight">قسم الصيانة</h1><p className="mt-2 text-sm text-muted-foreground">تابع الجهاز من لحظة استلامه حتى إتمام الصيانة وتسليمه للزبون.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={exportSelected} disabled={!selected.length || exporting} className="gap-2"><FileDown className="h-4 w-4" /> {exporting ? "جارٍ إعداد التقرير..." : `تقرير PDF (${selected.length})`}</Button><Button onClick={openCreate} className="gap-2 bg-gradient-brand"><Plus className="h-4 w-4" /> إضافة جهاز</Button></div>
    </header>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { title: "إجمالي الأجهزة", value: stats.total, icon: ClipboardList, color: "text-sky-700", bg: "bg-sky-50" },
        { title: "أجهزة عاطلة", value: stats.faulty, icon: Wrench, color: "text-rose-700", bg: "bg-rose-50" },
        { title: "قيد الصيانة", value: stats.repairing, icon: ArrowLeftRight, color: "text-amber-700", bg: "bg-amber-50" },
        { title: "تم إصلاحها", value: stats.repaired, icon: PackageCheck, color: "text-emerald-700", bg: "bg-emerald-50" },
      ].map(({ title, value, icon: Icon, color, bg }) => <div key={title} className="surface-card flex items-center gap-4 p-5"><div className={`rounded-xl p-3 ${bg} ${color}`}><Icon className="h-5 w-5" /></div><div><p className="text-xs text-muted-foreground">{title}</p><p className="mt-1 text-2xl font-bold tabular-nums">{value}</p></div></div>)}
    </div>

    <section className="surface-card space-y-4 p-4 sm:p-5" aria-label="بحث وتصفية الأجهزة">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
        <div className="relative"><Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث باسم الجهاز أو السيريل أو صاحبه أو رقم الهاتف" aria-label="البحث عن جهاز" className="h-11 pr-10" /></div>
        <Select value={locationFilter} onValueChange={setLocationFilter}><SelectTrigger aria-label="تصفية حسب الموقع" className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">جميع المواقع</SelectItem>{locationOptions.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger aria-label="تصفية حسب الحالة" className="h-11"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">جميع الحالات</SelectItem>{statusOptions.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>النتائج: {filtered.length} جهاز · المحدد للتقرير: {selected.length}</span><div className="flex gap-3"><button type="button" className="font-semibold text-primary hover:underline" onClick={() => setSelectedIds(new Set(filtered.map((d) => d.id)))}>تحديد النتائج</button><button type="button" className="font-semibold hover:underline" onClick={() => setSelectedIds(new Set())}>إلغاء التحديد</button></div></div>
    </section>

    {loading ? <div className="surface-card p-12 text-center text-muted-foreground">جارٍ تحميل الأجهزة...</div> : !filtered.length ? <div className="surface-card p-12 text-center"><Wrench className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-semibold">لا توجد أجهزة تطابق البحث</p><p className="mt-1 text-sm text-muted-foreground">أضف جهازاً جديداً أو غيّر الفلاتر.</p></div> : <div className="grid gap-3 xl:grid-cols-2">
      {filtered.map((device) => <article key={device.id} className={`surface-card p-4 transition-colors sm:p-5 ${selectedIds.has(device.id) ? "ring-2 ring-primary/50" : "hover:border-primary/40"}`}>
        <div className="flex items-start gap-3"><Checkbox checked={selectedIds.has(device.id)} onCheckedChange={() => toggleSelected(device.id)} aria-label={`تحديد ${device.device_name} للتقرير`} className="mt-1" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-bold leading-relaxed">{device.device_name}</h2><p dir="ltr" className="mt-0.5 text-right font-mono text-xs text-muted-foreground">{device.serial_number}</p></div><Badge variant="outline" className={device.status === "faulty" ? "border-rose-200 bg-rose-50 text-rose-700" : device.status === "in_repair" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}>{statusLabels[device.status]}</Badge></div>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">صاحب الجهاز: </span><strong>{device.owner_name}</strong></p><a href={`tel:${device.owner_phone}`} className="text-primary hover:underline" dir="ltr">{device.owner_phone}</a><p className="flex items-center gap-1"><MapPin className="h-4 w-4 text-muted-foreground" />{locationLabel(device.location, device.custom_location)}</p><p className="text-xs text-muted-foreground">استلام: {dateLabel(device.received_at)}</p></div>
          <div className="mt-4 flex flex-wrap gap-2 border-t pt-3"><Button size="sm" variant="outline" onClick={() => setActive(device)}>عرض الخط الزمني</Button><Button size="sm" variant="outline" onClick={() => openEvent(device)}>تسجيل حركة</Button></div>
        </div></div>
      </article>)}
    </div>}

    <Dialog open={deviceDialog} onOpenChange={setDeviceDialog}><DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{editingId ? "تعديل بيانات الجهاز" : "إضافة جهاز جديد"}</DialogTitle><DialogDescription>{editingId ? "تعديل بيانات التعريف والاتصال. غيّر الموقع والحالة عبر تسجيل حركة ليبقى الخط الزمني صحيحاً." : "يُسجل الاستلام تلقائياً كنقطة أولى في الخط الزمني."}</DialogDescription></DialogHeader>
      <div className="grid gap-4 py-2 sm:grid-cols-2"><Field label="اسم الجهاز" value={deviceForm.device_name} onChange={(value) => setDeviceForm((f) => ({ ...f, device_name: value }))} /><Field label="الرقم التسلسلي" value={deviceForm.serial_number} onChange={(value) => setDeviceForm((f) => ({ ...f, serial_number: value }))} /><Field label="صاحب الجهاز" value={deviceForm.owner_name} onChange={(value) => setDeviceForm((f) => ({ ...f, owner_name: value }))} /><Field label="رقم الهاتف" value={deviceForm.owner_phone} onChange={(value) => setDeviceForm((f) => ({ ...f, owner_phone: value }))} />
        {!editingId && <><div className="space-y-1.5"><Label>موقع الاستلام</Label><Select value={deviceForm.location} onValueChange={(value: DeviceLocation) => setDeviceForm((f) => ({ ...f, location: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{locationOptions.filter(([key]) => key !== "customer").map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label>حالة الجهاز</Label><Select value={deviceForm.status} onValueChange={(value: DeviceStatus) => setDeviceForm((f) => ({ ...f, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusOptions.filter(([key]) => key !== "delivered").map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>{deviceForm.location === "custom" && <Field label="اسم الموقع المخصص" value={deviceForm.custom_location} onChange={(value) => setDeviceForm((f) => ({ ...f, custom_location: value }))} />}</>}
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="device-notes">ملاحظات الجهاز</Label><Textarea id="device-notes" value={deviceForm.notes} onChange={(event) => setDeviceForm((f) => ({ ...f, notes: event.target.value }))} rows={3} /></div></div>
      <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setDeviceDialog(false)}>إلغاء</Button><Button onClick={saveDevice} disabled={saving}>{saving ? "جارٍ الحفظ..." : editingId ? "حفظ التعديل" : "إضافة الجهاز"}</Button></DialogFooter>
    </DialogContent></Dialog>

    <Dialog open={!!active && !eventDialog && !deviceDialog} onOpenChange={(open) => { if (!open) setActive(null); }}><DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{active?.device_name}</DialogTitle><DialogDescription>الرقم التسلسلي: {active?.serial_number}</DialogDescription></DialogHeader>
      {active && <><div className="grid gap-2 rounded-xl bg-secondary/50 p-4 text-sm sm:grid-cols-2"><p>المالك: <strong>{active.owner_name}</strong></p><p>الهاتف: <strong dir="ltr">{active.owner_phone}</strong></p><p>الموقع الحالي: <strong>{locationLabel(active.location, active.custom_location)}</strong></p><p>الحالة: <strong>{statusLabels[active.status]}</strong></p>{active.notes && <p className="sm:col-span-2">ملاحظات: {active.notes}</p>}</div>
        <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => openEvent(active)}><Plus className="ml-1 h-4 w-4" />تسجيل حركة</Button><Button size="sm" variant="outline" onClick={() => openEdit(active)}>تعديل البيانات</Button></div>
        <div className="space-y-0"><h3 className="mb-3 font-bold">الخط الزمني</h3>{loadingEvents ? <p className="text-sm text-muted-foreground">جارٍ تحميل الأحداث...</p> : events.map((event) => <div key={event.id} className="relative border-r-2 border-primary/25 pb-5 pr-6 last:border-transparent last:pb-0"><span className="absolute -right-[7px] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" /><div className="flex flex-wrap items-start justify-between gap-1"><strong className="text-sm">{eventLabels[event.event_type]} · {locationLabel(event.location, event.custom_location)}</strong><time className="text-xs text-muted-foreground">{dateLabel(event.occurred_at)}</time></div><p className="mt-1 text-xs text-muted-foreground">الحالة: {statusLabels[event.status]}</p>{event.note && <p className="mt-2 rounded-lg bg-secondary/50 p-2 text-sm">{event.note}</p>}</div>)}</div>
      </>}
    </DialogContent></Dialog>

    <Dialog open={eventDialog} onOpenChange={setEventDialog}><DialogContent dir="rtl" className="sm:max-w-lg"><DialogHeader><DialogTitle>تسجيل حركة الجهاز</DialogTitle><DialogDescription>سيظهر هذا الحدث بتاريخ ووقت محددين في الخط الزمني للجهاز.</DialogDescription></DialogHeader>
      <div className="grid gap-4 py-2 sm:grid-cols-2"><div className="space-y-1.5"><Label>نوع الحدث</Label><Select value={eventForm.event_type} onValueChange={(value: EventForm["event_type"]) => setEventForm((f) => ({ ...f, event_type: value, ...(value === "delivered" ? { location: "customer", status: "delivered" } : {}) }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{eventOptions.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label htmlFor="event-date">التاريخ والوقت</Label><Input id="event-date" type="datetime-local" value={eventForm.occurred_at} max={localDateTime()} onChange={(event) => setEventForm((f) => ({ ...f, occurred_at: event.target.value }))} /></div><div className="space-y-1.5"><Label>الموقع بعد الحدث</Label><Select value={eventForm.location} onValueChange={(value: DeviceLocation) => setEventForm((f) => ({ ...f, location: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{locationOptions.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5"><Label>الحالة بعد الحدث</Label><Select value={eventForm.status} onValueChange={(value: DeviceStatus) => setEventForm((f) => ({ ...f, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusOptions.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>{eventForm.location === "custom" && <div className="sm:col-span-2"><Field label="اسم الموقع المخصص" value={eventForm.custom_location} onChange={(value) => setEventForm((f) => ({ ...f, custom_location: value }))} /></div>}<div className="space-y-1.5 sm:col-span-2"><Label htmlFor="event-note">تفاصيل الحركة أو الصيانة</Label><Textarea id="event-note" value={eventForm.note} maxLength={2000} onChange={(event) => setEventForm((f) => ({ ...f, note: event.target.value }))} rows={3} placeholder="مثلاً: أُرسل إلى بغداد للصيانة / استلمناه بعد الإصلاح" /></div></div>
      <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setEventDialog(false)}>إلغاء</Button><Button onClick={saveEvent} disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ الحدث"}</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = `maintenance-${label.replace(/\s+/g, "-")}`;
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label><Input id={id} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

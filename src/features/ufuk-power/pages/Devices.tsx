import { useCallback, useState } from 'react';
import { IconBattery, IconDevices, IconPencil, IconPlus, IconQr, IconRefresh, IconSearch, IconSun, IconWifi } from '../components/Icons';
import { QrScanner } from '../components/QrScanner';
import { Sheet } from '../components/Sheet';
import { WifiGuide } from '../components/WifiGuide';
import { btn, Card, EmptyState, input, label, Num } from '../components/ui';
import { ago, fmtW } from '../lib/format';
import { STALE_AFTER_MS, useApp, useNow } from '../store';
import type { CloudDevice } from '../types';

/** QR on Eybond dataloggers is the bare PN, a URL carrying it, or a JSON payload. */
function pnFromQr(text: string): string {
  if (!text) return '';
  const t = text.trim();

  // 1. Check if JSON payload (e.g. {"pn":"123456789012"} or {"deviceSn":"..."})
  if (t.startsWith('{') && t.endsWith('}')) {
    try {
      const obj = JSON.parse(t);
      if (obj && typeof obj === 'object') {
        for (const k of ['pn', 'PN', 'sn', 'SN', 'deviceSn', 'deviceSN', 'code', 'devcode', 'mac']) {
          if (obj[k] && typeof obj[k] === 'string' && obj[k].trim()) {
            return obj[k].trim().toUpperCase();
          }
        }
      }
    } catch {
      /* ignore JSON parse error */
    }
  }

  // 2. Check if URL carrying parameter (e.g. http://eybond.com/qr?pn=123456789012 or ...?deviceSn=...)
  try {
    const u = new URL(t.startsWith('http://') || t.startsWith('https://') ? t : `http://${t}`);
    for (const k of ['pn', 'PN', 'sn', 'SN', 'deviceSn', 'deviceSN', 'code', 'devcode', 'mac', 'id', 's', 'd']) {
      const v = u.searchParams.get(k);
      if (v && v.trim()) return v.trim().toUpperCase();
    }
  } catch {
    /* not a valid URL */
  }

  // 3. Check prefixed string formats like "PN: 123456789012", "PN=123456789012", "SN: 123456789012"
  const prefixedMatch = t.match(/(?:PN|SN|S\/N|MAC|CODE|ID|DEVSN|DEV_SN)\s*[:=]\s*([A-Za-z0-9\-]{6,32})/i);
  if (prefixedMatch?.[1]) {
    return prefixedMatch[1].replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }

  // 4. Clean leading prefixes if string starts with PN/SN
  const cleaned = t.replace(/^(?:PN|SN|S\/N|MAC|CODE)\s*[:=]?\s*/i, '');
  const matches = cleaned.match(/[A-Za-z0-9]{8,24}/g);
  if (matches && matches.length > 0) {
    const best = matches.find((m) => m.length >= 10 && m.length <= 20) || matches[0];
    return best.toUpperCase();
  }

  return cleaned.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

export function Devices({ onOpen }: { onOpen(id: string): void }) {
  const { devices, live, summaries, deviceErrors, selectedId, refreshDevices, rename, nameOf, addDevice, pushToast } = useApp();
  const now = useNow();
  const [query, setQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [addingDevice, setAddingDevice] = useState(false);
  const [newPn, setNewPn] = useState('');
  const [newAlias, setNewAlias] = useState('');
  const [addingBusy, setAddingBusy] = useState(false);
  const [editing, setEditing] = useState<CloudDevice | null>(null);
  const [name, setName] = useState('');
  const [wifiFor, setWifiFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setBusy(true);
    try {
      await refreshDevices();
      pushToast({ key: 'dev', level: 'info', title: 'تم تحديث القائمة من الحساب', body: '' });
    } catch (e) {
      pushToast({ key: 'dev', level: 'error', title: 'تعذّر التحديث', body: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const handleAddDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newPn.trim().toUpperCase();
    if (!clean) return;
    setAddingBusy(true);
    try {
      await addDevice(clean, newAlias.trim());
      pushToast({
        key: 'add_dev',
        level: 'info',
        title: 'تمت إضافة العاكس بنجاح',
        body: `تم ربط العاكس (${clean}) بحسابك`,
      });
      setAddingDevice(false);
      setNewPn('');
      setNewAlias('');
    } catch (err) {
      pushToast({
        key: 'add_dev_err',
        level: 'error',
        title: 'تعذّرت إضافة العاكس',
        body: (err as Error).message,
      });
    } finally {
      setAddingBusy(false);
    }
  };

  const onQr = useCallback(
    (text: string) => {
      setScanning(false);
      const pn = pnFromQr(text);
      if (!pn) {
        pushToast({
          key: 'qr_err',
          level: 'error',
          title: 'تعذّرت قراءة الرمز',
          body: 'لم يُعثر على رقم تسلسلي (PN/SN) صالِح في رمز QR الممسوح. يرجى محاولة إدخاله يدوياً.',
        });
        return;
      }
      if (addingDevice) {
        setNewPn(pn);
      } else {
        const match = devices.find((d) => d.pn.toUpperCase() === pn || d.sn.toUpperCase() === pn);
        if (match) {
          onOpen(match.id);
        } else {
          setNewPn(pn);
          setAddingDevice(true);
        }
      }
    },
    [addingDevice, devices, onOpen, pushToast],
  );

  const q = query.trim().toLowerCase();
  const list = devices.filter((d) => !q || `${nameOf(d)} ${d.pn} ${d.sn} ${d.plant}`.toLowerCase().includes(q));

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input className={`${input} !bg-white pr-11`} type="search" placeholder="بحث بالاسم أو رقم PN" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button onClick={() => setScanning(true)} aria-label="مسح رمز QR" className="grid size-12 shrink-0 place-items-center rounded-xl bg-teal-600 text-white active:bg-teal-700" title="مسح QR">
          <IconQr className="size-6" />
        </button>
      </div>

      <button
        onClick={() => setAddingDevice(true)}
        className={`${btn.primary} w-full flex items-center justify-center gap-2`}
      >
        <IconPlus className="size-5" /> إضافة عاكس جديد إلى الحساب
      </button>

      {!devices.length && (
        <EmptyState
          icon={<IconDevices className="size-8" />}
          title="لا توجد عواكس في الحساب"
          body="اضغط على زر 'إضافة عاكس جديد' أعلاه لإضافة عاكسك بالرقم التسلسلي أو عبر مسح رمز QR."
        />
      )}

      {list.map((d) => {
        const l = live[d.id];
        const s = summaries[d.id];
        const err = deviceErrors[d.id];
        const fresh = !!l && now - l.fetchedAt < STALE_AFTER_MS && !err;
        return (
          <Card key={d.id} className={`!p-0 ${d.id === selectedId ? 'ring-2 ring-teal-500/60' : ''}`}>
            <button className="block w-full p-4 text-start" onClick={() => onOpen(d.id)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-slate-900">{nameOf(d)}</div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {d.plant && `${d.plant} · `}PN <Num>{d.pn}</Num>
                  </div>
                </div>
                <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${fresh ? 'bg-emerald-50 text-emerald-700' : err ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                  <span className={`size-1.5 rounded-full ${fresh ? 'bg-emerald-500' : err ? 'bg-red-500' : 'bg-slate-400'}`} />
                  {err ? 'خطأ' : l ? ago(l.fetchedAt, now) : '…'}
                </span>
              </div>
              {s && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-slate-600">
                  {s.pvPower != null && <span className="flex items-center gap-1.5"><IconSun className="size-4 text-amber-500" /><Num>{fmtW(s.pvPower)}</Num></span>}
                  {s.battVoltage != null && <span className="flex items-center gap-1.5"><IconBattery className="size-4 text-emerald-500" /><Num>{s.battVoltage.toFixed(1)} V</Num></span>}
                  {s.gridConnected != null && <span className={s.gridConnected ? 'text-sky-600' : 'text-slate-400'}>{s.gridConnected ? 'الشبكة متصلة' : 'الشبكة مقطوعة'}</span>}
                </div>
              )}
              {err && <div className="mt-2 text-xs text-red-600">{err}</div>}
            </button>
            <div className="flex items-center border-t border-slate-100 px-2 text-[13px]">
              <span className="flex-1 truncate px-2 text-xs text-slate-400">SN <Num>{d.sn}</Num></span>
              <button className="flex min-h-11 items-center gap-1.5 px-3 font-medium text-slate-600 active:bg-slate-50" onClick={() => setWifiFor(d.pn)}>
                <IconWifi className="size-4" /> WiFi
              </button>
              <button
                className="flex min-h-11 items-center gap-1.5 px-3 font-medium text-slate-600 active:bg-slate-50"
                onClick={() => {
                  setEditing(d);
                  setName(nameOf(d));
                }}
              >
                <IconPencil className="size-4" /> الاسم
              </button>
            </div>
          </Card>
        );
      })}

      <button className={`${btn.soft} w-full`} disabled={busy} onClick={reload}>
        <IconRefresh className={`size-5 ${busy ? 'animate-spin' : ''}`} /> تحديث القائمة
      </button>

      <Sheet open={scanning} title="مسح رمز QR للجهاز" onClose={() => setScanning(false)}>
        {scanning && <QrScanner onResult={onQr} />}
      </Sheet>

      <Sheet open={addingDevice} title="إضافة عاكس جديد" onClose={() => setAddingDevice(false)}>
        <form onSubmit={handleAddDeviceSubmit} className="space-y-4">
          <div>
            <label className={label}>رقم التسلسلي للجهاز (PN)</label>
            <div className="flex gap-2">
              <input
                className={`${input} flex-1`}
                dir="ltr"
                placeholder="مثال: 123456789012"
                value={newPn}
                onChange={(e) => setNewPn(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setScanning(true)}
                className="grid size-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 active:bg-slate-200"
                title="مسح QR"
              >
                <IconQr className="size-5" />
              </button>
            </div>
          </div>

          <div>
            <label className={label}>اسم العاكس (اختياري)</label>
            <input
              className={input}
              placeholder="مثال: عاكس المنزل"
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
            />
          </div>

          <button className={`${btn.primary} w-full`} disabled={addingBusy || !newPn.trim()}>
            {addingBusy ? 'جارٍ إضافة العاكس…' : 'إضافة العاكس بحسابي'}
          </button>
        </form>
      </Sheet>

      <WifiGuide open={!!wifiFor} deviceId={wifiFor ?? ''} onClose={() => setWifiFor(null)} />

      <Sheet open={!!editing} title="اسم العاكس" onClose={() => setEditing(null)}>
        {editing && (
          <div className="space-y-3">
            <div>
              <label className={label}>الاسم على هذا الهاتف</label>
              <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <p className="text-xs text-slate-400">الاسم في الحساب: {editing.alias}</p>
            <button
              className={`${btn.primary} w-full`}
              onClick={async () => {
                await rename(editing.id, name.trim());
                setEditing(null);
              }}
            >
              حفظ
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}

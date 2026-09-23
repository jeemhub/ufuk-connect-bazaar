import { useEffect, useState } from 'react';
import { IconLogout } from '../components/Icons';
import { btn, Card, input, label, SectionTitle, Switch } from '../components/ui';
import { diagnostics } from '../lib/cloud';
import { POLL_MS, useApp } from '../store';

export function Settings() {
  const { session, devices, signOut, prefs, savePrefs, pushToast } = useApp();
  const [low, setLow] = useState(String(prefs.lowBatteryVoltage));
  const perm = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';

  useEffect(() => setLow(String(prefs.lowBatteryVoltage)), [prefs.lowBatteryVoltage]);

  const enableNotifications = async () => {
    if (perm === 'unsupported') return;
    const p = await Notification.requestPermission();
    await savePrefs({ ...prefs, systemNotifications: p === 'granted' });
    if (p !== 'granted') pushToast({ key: 'perm', level: 'warning', title: 'لم يُسمح بالإشعارات', body: 'فعّلها من إعدادات المتصفح' });
  };

  return (
    <div className="space-y-3">
      <Card>
        <SectionTitle>الحساب</SectionTitle>
        <div className="flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-teal-50 text-lg font-bold text-teal-700">
            {session?.account.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-slate-900" dir="ltr" style={{ textAlign: 'right' }}>{session?.account}</div>
            <div className="text-xs text-slate-500">
              SmartValue · {devices.length} عاكس
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          البيانات تُقرأ من سحابة SmartValue كل {POLL_MS / 1000} ثانية أثناء فتح التطبيق. الـ dongle نفسه يرفع قراءاته للسحابة كل بضع دقائق.
        </p>
        <button
          className={`${btn.danger} mt-4 w-full`}
          onClick={() => confirm('تسجيل الخروج وحذف بيانات الحساب والقراءات من هذا الهاتف؟') && signOut()}
        >
          <IconLogout className="size-5" /> تسجيل الخروج
        </button>
      </Card>

      <Card>
        <SectionTitle>التنبيهات</SectionTitle>
        <label className={label}>تنبيه عند انخفاض فولتية البطارية تحت</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input className={`${input} pl-10`} dir="ltr" type="number" step="0.1" inputMode="decimal" value={low} onChange={(e) => setLow(e.target.value)} />
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">V</span>
          </div>
          <button
            className={`${btn.ghost} shrink-0`}
            disabled={Number(low) === prefs.lowBatteryVoltage}
            onClick={() => {
              const n = Number(low);
              if (Number.isFinite(n) && n > 0) savePrefs({ ...prefs, lowBatteryVoltage: n });
            }}
          >
            حفظ
          </button>
        </div>
        <div className="mt-2 divide-y divide-slate-100">
          {([
            ['notifyGridLoss', 'انقطاع وعودة الشبكة الكهربائية'],
            ['notifyErrors', 'ظهور خطأ أو تحذير من العاكس'],
          ] as const).map(([k, l]) => (
            <div key={k} className="flex min-h-14 items-center justify-between gap-3 text-[15px] text-slate-800">
              {l}
              <Switch label={l} checked={prefs[k]} onChange={(v) => savePrefs({ ...prefs, [k]: v })} />
            </div>
          ))}
          <div className="flex min-h-14 items-center justify-between gap-3 text-[15px] text-slate-800">
            {perm === 'unsupported' ? (
              <span className="py-3 text-[13px] leading-relaxed text-slate-500">إشعارات النظام غير مدعومة هنا. على iPhone ثبّت التطبيق على الشاشة الرئيسية أولاً.</span>
            ) : perm === 'granted' ? (
              <>
                إشعارات النظام
                <Switch label="إشعارات النظام" checked={prefs.systemNotifications} onChange={(v) => savePrefs({ ...prefs, systemNotifications: v })} />
              </>
            ) : (
              <button className={`${btn.soft} my-2 w-full`} onClick={enableNotifications}>تفعيل إشعارات النظام</button>
            )}
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">التنبيهات تعمل أثناء فتح التطبيق أو بقائه في الخلفية.</p>
      </Card>

      <Diagnostics />
    </div>
  );
}

/** Raw cloud responses — lets us map a new inverter model's fields exactly, from a screenshot or a copy. */
function Diagnostics() {
  const { pushToast } = useApp();
  const [open, setOpen] = useState(false);
  const entries = [...diagnostics.entries()];
  const text = JSON.stringify(Object.fromEntries(entries.map(([k, v]) => [k, v.body])), null, 2);
  return (
    <Card>
      <button className="flex min-h-10 w-full items-center justify-between text-start" onClick={() => setOpen((v) => !v)}>
        <span className="text-[15px] font-semibold text-slate-900">تشخيص الاتصال</span>
        <span className="text-[13px] font-medium text-teal-700">{open ? 'إخفاء' : 'عرض'}</span>
      </button>
      {open && (
        <>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">آخر ردود السحابة كما وصلت (بدون كلمة المرور أو رمز الجلسة). أرسلها للدعم إذا ظهرت بيانات ناقصة.</p>
          <button
            className={`${btn.ghost} mt-3 w-full`}
            disabled={!entries.length}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(text);
                pushToast({ key: 'diag', level: 'info', title: 'تم النسخ', body: '' });
              } catch {
                pushToast({ key: 'diag', level: 'warning', title: 'تعذّر النسخ', body: 'حدّد النص يدوياً' });
              }
            }}
          >
            نسخ الردود
          </button>
          <pre dir="ltr" className="mt-3 max-h-80 overflow-auto rounded-xl bg-slate-50 p-3 text-left text-[10px] leading-relaxed text-slate-600">
            {entries.length ? text : 'لا توجد ردود بعد'}
          </pre>
        </>
      )}
    </Card>
  );
}

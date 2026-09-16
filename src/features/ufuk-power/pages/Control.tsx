import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { IconDevices, IconSearch } from '../components/Icons';
import { btn, Card, EmptyState, input, Num } from '../components/ui';
import { diagnostics } from '../lib/cloud';
import { useApp } from '../store';
import type { CtrlField, CtrlGroup } from '../types';

// Tabs and fields come from SmartValue's own control definition for this inverter
// (readBulkControl), so they match the official app. 🔍 reads live values (readAll),
// and every write (setUp) is read back to confirm the inverter actually applied it.

const label = (f: CtrlField, v: string | undefined) => (v == null ? undefined : f.options?.find((o) => o.key === v || o.val === v)?.val ?? v);
const keyOf = (f: CtrlField, v: string | undefined) => (v == null ? undefined : f.options?.find((o) => o.key === v || o.val === v)?.key ?? v);
const same = (f: CtrlField, a?: string, b?: string) => a != null && b != null && (keyOf(f, a) === keyOf(f, b) || (a.trim() !== '' && Number(a) === Number(b)));

function rangeOf(f: CtrlField): { min: number; max: number } | null {
  if (f.min != null && f.max != null && f.min < f.max) return { min: f.min, max: f.max };
  const m = f.hint?.match(/(-?\d+(?:\.\d+)?)\s*(?:~|-|–|,|to)\s*(-?\d+(?:\.\d+)?)/i);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return a < b ? { min: a, max: b } : null;
}

const timeOf = (ts: number) => new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function Control() {
  const { client, selected, nameOf, pushToast } = useApp();
  const [groups, setGroups] = useState<CtrlGroup[] | null>(null);
  const [groupId, setGroupId] = useState<string>('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [readAt, setReadAt] = useState<Record<string, number>>({});
  const [reading, setReading] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<{ group: CtrlGroup; field: CtrlField; value: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!client || !selected) return;
    setError(null);
    setGroups(null);
    setValues({});
    setDraft({});
    setReadAt({});
    try {
      const { groups: g, tried: t } = await client.controlGroups(selected);
      setTried(t);
      setGroups(g);
      setGroupId(g[0]?.id ?? '');
      const initial: Record<string, string> = {};
      for (const grp of g) for (const f of grp.fields) if (f.initial != null) initial[f.id] = f.initial;
      setValues(initial);
      setDraft(initial);
    } catch (e) {
      setError((e as Error).message);
    }
    // Device objects are rebuilt when the account list refreshes; only a different inverter should reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, selected?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const read = useCallback(
    async (group: CtrlGroup, fields: CtrlField[], quiet = false): Promise<Record<string, string>> => {
      if (!client || !selected || !fields.length) return {};
      setReading((s) => new Set([...s, ...fields.map((f) => f.id)]));
      try {
        const got = await client.readValues(selected, group, fields);
        const now = Date.now();
        setValues((all) => ({ ...all, ...got }));
        setDraft((all) => {
          const next = { ...all };
          for (const f of fields) if (got[f.id] != null) next[f.id] = keyOf(f, got[f.id]) ?? got[f.id];
          return next;
        });
        setReadAt((r) => ({ ...r, ...Object.fromEntries(Object.keys(got).map((id) => [id, now])) }));
        if (!quiet && !Object.keys(got).length) {
          pushToast({ key: `read-empty:${group.id}`, level: 'warning', title: 'لم يُرجع العاكس قيماً', body: 'قد يكون الـ dongle غير متصل حالياً' });
        }
        return got;
      } catch (e) {
        if (!quiet) pushToast({ key: `read:${group.id}`, level: 'error', title: 'تعذّرت القراءة من العاكس', body: (e as Error).message });
        return {};
      } finally {
        setReading((s) => {
          const n = new Set(s);
          for (const f of fields) n.delete(f.id);
          return n;
        });
      }
    },
    [client, selected, pushToast],
  );

  const current = groups?.find((g) => g.id === groupId);
  const visible = useMemo(() => {
    if (!groups) return [];
    const q = query.trim().toLowerCase();
    if (q) return groups.flatMap((g) => g.fields.filter((f) => `${f.name} ${f.id}`.toLowerCase().includes(q)).map((f) => ({ group: g, field: f })));
    return current ? current.fields.map((f) => ({ group: current, field: f })) : [];
  }, [groups, current, query]);

  if (!selected) {
    return <EmptyState icon={<IconDevices className="size-8" />} title="لا يوجد عاكس" body="لا توجد عواكس في حسابك للتحكم بها." />;
  }

  const readShown = async () => {
    const byGroup = new Map<CtrlGroup, CtrlField[]>();
    for (const { group, field } of visible) byGroup.set(group, [...(byGroup.get(group) ?? []), field]);
    for (const [g, fs] of byGroup) await read(g, fs);
  };

  const send = async () => {
    if (!pending || !client) return;
    const { group, field, value } = pending;
    setBusy(true);
    try {
      await client.setValue(selected, group, field, value);
      // Read back from the inverter so "sent" is never confused with "applied".
      await new Promise((r) => setTimeout(r, 3000));
      const got = await read(group, [field], true);
      const now = got[field.id];
      if (now == null) {
        pushToast({ key: `write:${field.id}`, level: 'warning', title: 'أُرسل التعديل', body: 'لم يتمكن التطبيق من التحقق — اضغط 🔍 بعد قليل' });
      } else if (!same(field, now, value)) {
        pushToast({ key: `write:${field.id}`, level: 'warning', title: `العاكس ما زال على ${label(field, now)}`, body: 'قد يحتاج دقيقة ليطبّق، أو رفض القيمة. اضغط 🔍 لاحقاً' });
      } else {
        pushToast({ key: `write:${field.id}`, level: 'info', title: 'تم التطبيق على العاكس ✓', body: `${field.name}: ${label(field, now)}` });
      }
      setPending(null);
    } catch (e) {
      pushToast({ key: `write-err:${field.id}`, level: 'error', title: 'رُفض التعديل', body: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input className={`${input} !bg-white pr-11`} type="search" placeholder="بحث في الإعدادات" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button
          className="flex h-12 shrink-0 items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 text-sm font-semibold text-white active:bg-teal-700 disabled:opacity-50"
          disabled={!visible.length || reading.size > 0}
          onClick={readShown}
        >
          <IconSearch className={`size-5 ${reading.size ? 'animate-pulse' : ''}`} />
          قراءة الكل
        </button>
      </div>

      {groups && groups.length > 1 && !query && (
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:-mx-4 sm:px-4">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setGroupId(g.id)}
              className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-medium ${groupId === g.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      <p className="px-1 text-xs leading-relaxed text-slate-500">
        إعدادات عاكس <b className="text-slate-700">{nameOf(selected)}</b> من حساب SmartValue. اضغط 🔍 لقراءة القيمة الحالية من العاكس.
      </p>

      {error && (
        <Card>
          <p className="text-sm text-red-600">{error}</p>
          <button className={`${btn.ghost} mt-3 w-full`} onClick={load}>إعادة المحاولة</button>
        </Card>
      )}
      {!groups && !error && <p className="p-8 text-center text-sm text-slate-400">جارٍ جلب إعدادات العاكس…</p>}
      {groups && !groups.length && (
        <Card>
          <p className="text-sm font-semibold text-slate-900">لم يتعرّف التطبيق على إعدادات هذا العاكس بعد</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            السحابة ردّت بصيغة غير معروفة لهذا الموديل. انسخ الرد وأرسله لنا لنضيف دعمه بدقة — لا يحتوي كلمة المرور أو رمز الجلسة.
          </p>
          <ul className="mt-3 space-y-1 text-[11px] text-slate-500" dir="ltr">
            {tried.map((t) => (
              <li key={t} className="break-words text-left">• {t}</li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className={btn.primary}
              onClick={async () => {
                const raw = JSON.stringify(
                  { device: { devcode: selected.devcode, devaddr: selected.devaddr, role: selected.role }, tried, responses: Object.fromEntries([...diagnostics].map(([k, v]) => [k, v.body])) },
                  null,
                  2,
                );
                try {
                  await navigator.clipboard.writeText(raw);
                  pushToast({ key: 'copy', level: 'info', title: 'تم نسخ رد السحابة', body: 'الصقه في المحادثة' });
                } catch {
                  pushToast({ key: 'copy', level: 'warning', title: 'تعذّر النسخ', body: 'افتح الإعدادات ← تشخيص الاتصال' });
                }
              }}
            >
              نسخ الرد
            </button>
            <button className={btn.ghost} onClick={load}>إعادة المحاولة</button>
          </div>
        </Card>
      )}
      {groups && groups.length > 0 && !visible.length && <p className="p-8 text-center text-sm text-slate-400">لا توجد نتائج</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map(({ group, field: f }) => {
          const cur = values[f.id];
          const known = cur != null;
          const value = draft[f.id] ?? '';
          const changed = value !== '' && !(known && same(f, value, cur));
          const isReading = reading.has(f.id);
          const range = rangeOf(f);
          const step = /\.\d/.test(String(cur ?? f.hint ?? '')) ? 0.1 : 1;
          const segmented = f.options?.length === 2;
          const disabled = f.readOnly || isReading || busy;

          const request = (v: string) => {
            if (!f.options) {
              const n = Number(v);
              if (v.trim() === '' || !Number.isFinite(n)) {
                pushToast({ key: `nan:${f.id}`, level: 'warning', title: 'أدخل رقماً صحيحاً', body: f.name });
                return;
              }
              if (range && (n < range.min || n > range.max)) {
                pushToast({ key: `range:${f.id}`, level: 'warning', title: 'قيمة خارج المدى', body: `المسموح ${range.min}–${range.max}${f.unit ? ` ${f.unit}` : ''}` });
                return;
              }
            }
            setPending({ group, field: f, value: v });
          };

          return (
            <Card key={`${group.id}:${f.id}`} className="!p-3.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[15px] font-semibold leading-snug text-slate-900">{f.name}</h3>
                {query && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{group.name}</span>}
              </div>
              {(f.hint || range) && (
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {f.hint ?? `${range!.min}–${range!.max}`}
                  {f.unit && ` ${f.unit}`}
                </div>
              )}

              {segmented ? (
                <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1">
                  {f.options!.map((o) => {
                    const active = known && keyOf(f, cur) === o.key;
                    return (
                      <button
                        key={o.key}
                        disabled={disabled}
                        onClick={() => !active && request(o.key)}
                        className={`min-h-11 rounded-lg text-sm font-semibold disabled:opacity-60 ${active ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 active:bg-white'}`}
                      >
                        {o.val}
                      </button>
                    );
                  })}
                </div>
              ) : f.options ? (
                <select className={`${input} mt-3`} value={value} disabled={disabled} onChange={(e) => setDraft((d) => ({ ...d, [f.id]: e.target.value }))}>
                  {!known && <option value="">— اضغط 🔍 لقراءة القيمة —</option>}
                  {f.options.map((o) => (
                    <option key={o.key} value={o.key}>{o.val}</option>
                  ))}
                </select>
              ) : (
                <div className="mt-3 flex gap-1.5" dir="ltr">
                  <button
                    className="grid w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-xl text-slate-700 active:bg-slate-200 disabled:opacity-40"
                    disabled={disabled || value === '' || (range != null && Number(value) <= range.min)}
                    onClick={() => setDraft((d) => ({ ...d, [f.id]: String(+(Number(value) - step).toFixed(2)) }))}
                    aria-label="إنقاص"
                  >
                    −
                  </button>
                  <div className="relative min-w-0 flex-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="🔍"
                      className={`${input} px-8 text-center text-lg font-semibold tabular-nums`}
                      value={value}
                      disabled={disabled}
                      onChange={(e) => setDraft((d) => ({ ...d, [f.id]: e.target.value }))}
                    />
                    {f.unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{f.unit}</span>}
                  </div>
                  <button
                    className="grid w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-xl text-slate-700 active:bg-slate-200 disabled:opacity-40"
                    disabled={disabled || value === '' || (range != null && Number(value) >= range.max)}
                    onClick={() => setDraft((d) => ({ ...d, [f.id]: String(+(Number(value) + step).toFixed(2)) }))}
                    aria-label="زيادة"
                  >
                    +
                  </button>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => read(group, [f])}
                  disabled={isReading}
                  aria-label={`قراءة ${f.name} من العاكس`}
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700 active:bg-teal-100 disabled:opacity-60"
                >
                  <IconSearch className={`size-5 ${isReading ? 'animate-pulse' : ''}`} />
                </button>
                <div className="min-w-0 flex-1 text-[11px] leading-snug text-slate-400">
                  {isReading ? (
                    'جارٍ القراءة من العاكس…'
                  ) : known ? (
                    <>
                      <div className="truncate">
                        على العاكس: <Num className="font-medium text-slate-700">{label(f, cur)}{!f.options && f.unit ? ` ${f.unit}` : ''}</Num>
                      </div>
                      {readAt[f.id] && <div>قُرئ <Num>{timeOf(readAt[f.id])}</Num></div>}
                    </>
                  ) : f.readOnly ? (
                    'للقراءة فقط'
                  ) : (
                    'القيمة غير مقروءة بعد'
                  )}
                </div>
                {!segmented && !f.readOnly && (
                  <button className={`${changed ? btn.primary : btn.ghost} !min-h-11 shrink-0 !px-5 !text-sm`} disabled={!changed || busy} onClick={() => request(value)}>
                    إرسال
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog open={!!pending} busy={busy} title="تأكيد تعديل العاكس" confirmLabel="تأكيد وإرسال للعاكس" onCancel={() => setPending(null)} onConfirm={send}>
        {pending && (
          <div className="space-y-3">
            <div className="flex justify-between gap-3"><span>العاكس</span><b className="text-slate-900">{nameOf(selected)}</b></div>
            <div className="flex justify-between gap-3"><span>الإعداد</span><b className="text-end text-slate-900">{pending.field.name}</b></div>
            <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-50 p-4 text-base">
              <Num className="text-slate-400 line-through">{label(pending.field, values[pending.field.id]) ?? 'غير مقروءة'}</Num>
              <span className="text-slate-300">←</span>
              <Num className="font-bold text-teal-700">{label(pending.field, pending.value)}</Num>
            </div>
            {busy && <p className="text-center text-xs text-slate-500">جارٍ الإرسال ثم التحقق من العاكس…</p>}
            {values[pending.field.id] == null && !busy && <p className="text-xs text-amber-700">لم تُقرأ القيمة الحالية من العاكس قبل التعديل.</p>}
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}

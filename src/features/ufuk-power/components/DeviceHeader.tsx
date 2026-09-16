import { ago } from '../lib/format';
import { STALE_AFTER_MS, useApp, useNow } from '../store';
import { IconChevron, IconRefresh } from './Icons';

export function DeviceHeader() {
  const { devices, selected, select, live, syncing, refreshLive, deviceErrors, nameOf } = useApp();
  const now = useNow();
  const l = selected ? live[selected.id] : undefined;
  const err = selected ? deviceErrors[selected.id] : undefined;
  const fresh = !!l && now - l.fetchedAt < STALE_AFTER_MS && !err;

  return (
    <header className="px-4 pb-1 pt-3">
      <div className="mx-auto flex max-w-3xl items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <select value={selected?.id ?? ''} onChange={(e) => select(e.target.value)} className="absolute inset-0 size-full cursor-pointer opacity-0" aria-label="اختيار العاكس">
            {devices.map((d) => (
              <option key={d.id} value={d.id}>{nameOf(d)}</option>
            ))}
          </select>
          <div className="pointer-events-none flex min-h-12 items-center gap-1.5">
            <div className="min-w-0">
              <div className="truncate text-xl font-bold text-slate-900">{selected ? nameOf(selected) : 'لا يوجد عاكس'}</div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className={`size-2 rounded-full ${fresh ? 'bg-emerald-500' : err ? 'bg-red-500' : 'bg-slate-300'}`} />
                {err ? 'تعذّر التحديث' : l ? `آخر تحديث ${ago(l.fetchedAt, now)}` : 'لم تُقرأ بيانات بعد'}
              </div>
            </div>
            {devices.length > 1 && <IconChevron className="size-5 shrink-0 -rotate-90 text-slate-400" />}
          </div>
        </div>
        <button
          onClick={() => selected && refreshLive(selected.id)}
          disabled={syncing}
          aria-label="تحديث الآن"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 active:bg-slate-50"
        >
          <IconRefresh className={`size-5 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
}

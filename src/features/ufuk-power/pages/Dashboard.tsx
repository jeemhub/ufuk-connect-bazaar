import { useState, type ReactNode } from 'react';
import { BatteryRuntimeCard } from '../components/BatteryRuntimeCard';
import { HistoryChart } from '../components/HistoryChart';
import { IconBattery, IconDevices, IconHome, IconPlug, IconSun } from '../components/Icons';
import { btn, Card, EmptyState, Num, Pill, Row, SectionTitle } from '../components/ui';
import { ago, fmtW, STATE_AR } from '../lib/format';
import { STALE_AFTER_MS, useApp, useNow } from '../store';

function Tile({ icon, tint, label, value, children }: { icon: ReactNode; tint: string; label: string; value: ReactNode; children?: ReactNode }) {
  return (
    <Card className="min-w-0 !p-3.5">
      <div className="flex items-center gap-2">
        <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${tint}`}>{icon}</span>
        <span className="truncate text-[13px] font-medium text-slate-500">{label}</span>
      </div>
      <div className="mt-2.5 truncate text-[1.5rem] font-bold leading-tight tracking-tight text-slate-900">{value}</div>
      <div className="mt-1.5 space-y-1 text-xs leading-snug text-slate-500">{children}</div>
    </Card>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

const dash = <span className="text-slate-300">—</span>;

export function Dashboard({ onDevices }: { onDevices(): void }) {
  const { selected, live, summaries, history, deviceErrors, devices, refreshDevices, pushToast } = useApp();
  const now = useNow();
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!devices.length || !selected) {
    return (
      <EmptyState
        icon={<IconDevices className="size-8" />}
        title="لا توجد عواكس في الحساب"
        body="لم يُعثر على أي عاكس مسجّل في حساب Smart Value هذا. تأكد أن العاكس مضاف في تطبيق Smart Value ثم حدّث القائمة."
        action={
          <button
            className={`${btn.primary} w-full`}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await refreshDevices();
              } catch (e) {
                pushToast({ key: 'dev', level: 'error', title: 'تعذّر التحديث', body: (e as Error).message });
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'جارٍ البحث…' : 'تحديث قائمة العواكس'}
          </button>
        }
      />
    );
  }

  const l = live[selected.id];
  const s = summaries[selected.id];
  const err = deviceErrors[selected.id];
  const stale = !l || now - l.fetchedAt > STALE_AFTER_MS;

  return (
    <div className="space-y-3">
      {err && (
        <div className="rounded-2xl bg-red-50 p-3.5 text-[13px] leading-relaxed text-red-800">
          <b>تعذّر جلب البيانات:</b> {err}
          {l && <> — المعروض آخر قراءة ناجحة ({ago(l.fetchedAt, now)})</>}
        </div>
      )}
      {!err && stale && l && (
        <div className="rounded-2xl bg-amber-50 p-3.5 text-[13px] text-amber-900">
          <b>بيانات قديمة</b> — آخر قراءة {ago(l.fetchedAt, now)}{!navigator.onLine && ' · الهاتف غير متصل بالإنترنت'}
        </div>
      )}
      {!l && !err && <p className="p-8 text-center text-sm text-slate-400">جارٍ قراءة البيانات من العاكس…</p>}

      {s && l && (
        <>
          {s.faults.length > 0 && (
            <Card className="!bg-red-50">
              <ul className="space-y-2">
                {s.faults.map((f) => (
                  <li key={f.title} className="text-sm text-red-900">
                    <b>{f.title}:</b> <span dir="ltr">{f.val}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <BatteryRuntimeCard summary={s} />

          <div className={`grid grid-cols-2 gap-3 ${stale ? 'opacity-60' : ''}`}>
            <Tile icon={<IconSun className="size-[18px]" />} tint="bg-amber-50 text-amber-600" label="الشمسي" value={s.pvPower != null ? <Num>{fmtW(s.pvPower)}</Num> : dash}>
              {s.pvVoltage != null && <Num>{s.pvVoltage} V</Num>}
            </Tile>

            <Tile
              icon={<IconBattery className="size-[18px]" />}
              tint={(s.battPower ?? 0) < -5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}
              label="البطارية"
              value={s.battVoltage != null ? <Num>{s.battVoltage.toFixed(1)} V</Num> : dash}
            >
              {s.battPower != null && (
                <div>
                  {s.battPower > 5 ? 'شحن' : s.battPower < -5 ? 'تفريغ' : 'ثابتة'} <Num>{fmtW(Math.abs(s.battPower))}</Num>
                  {s.battCurrent != null && <> · <Num>{Math.abs(s.battCurrent)} A</Num></>}
                </div>
              )}
              {s.soc != null && (
                <div className="flex items-center gap-2">
                  <Bar pct={s.soc} color={s.soc < 25 ? 'bg-red-500' : 'bg-emerald-500'} />
                  <Num className="font-medium text-slate-700">{s.soc}%</Num>
                </div>
              )}
            </Tile>

            <Tile
              icon={<IconHome className="size-[18px]" />}
              tint="bg-violet-50 text-violet-600"
              label="الحمل"
              value={s.loadCurrent != null ? <Num>{s.loadCurrent.toFixed(1)} A</Num> : (s.loadPower != null ? <Num>{fmtW(s.loadPower)}</Num> : dash)}
            >
              {s.loadPower != null && (
                <div>
                  <Num>{fmtW(s.loadPower)}</Num>
                </div>
              )}
              {s.loadPercent != null && (
                <div className="flex items-center gap-2">
                  <Bar pct={s.loadPercent} color={s.loadPercent > 85 ? 'bg-red-500' : 'bg-violet-500'} />
                  <Num className="font-medium text-slate-700">{s.loadPercent}%</Num>
                </div>
              )}
            </Tile>

            <Tile
              icon={<IconPlug className="size-[18px]" />}
              tint={s.gridConnected ? 'bg-sky-50 text-sky-600' : 'bg-slate-100 text-slate-500'}
              label="الشبكة الوطنية"
              value={s.gridConnected == null ? dash : s.gridConnected ? 'متصلة' : <span className="text-slate-400">مقطوعة</span>}
            >
              {s.gridVoltage != null && (
                <Num>
                  {s.gridVoltage} V{s.gridFrequency != null && ` · ${s.gridFrequency} Hz`}
                </Num>
              )}
            </Tile>
          </div>

          {(s.workState || s.chargingState || s.temperature != null || s.outputVoltage != null) && (
            <Card>
              <SectionTitle aside={s.workState && <Pill tone="teal">{STATE_AR[s.workState] ?? s.workState}</Pill>}>حالة العاكس</SectionTitle>
              <div className="-my-2 divide-y divide-slate-100">
                {s.chargingState && <Row label="حالة الشحن">{STATE_AR[s.chargingState] ?? s.chargingState}</Row>}
                {s.outputVoltage != null && <Row label="فولتية الخرج"><Num>{s.outputVoltage} V</Num></Row>}
                {s.gridPower != null && <Row label="سحب من الشبكة"><Num>{fmtW(s.gridPower)}</Num></Row>}
                {s.temperature != null && (
                  <Row label="الحرارة">
                    <Num className={s.temperature > 65 ? 'text-red-600' : ''}>{s.temperature} °C</Num>
                  </Row>
                )}
              </div>
            </Card>
          )}

          <Card>
            <SectionTitle
              aside={
                <button className="min-h-9 rounded-lg px-2 text-[13px] font-medium text-teal-700" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? 'إخفاء' : `عرض الكل (${l.points.length})`}
                </button>
              }
            >
              كل قراءات العاكس
            </SectionTitle>
            {showAll ? (
              <div className="-my-2 divide-y divide-slate-100">
                {l.points.map((p, i) => (
                  <div key={`${p.title}-${i}`} className="flex min-h-10 items-center justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0 text-slate-500">{p.title}</span>
                    <Num className="shrink-0 font-medium text-slate-900">
                      {p.val}
                      {p.unit ? ` ${p.unit}` : ''}
                    </Num>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">القيم كما يرسلها العاكس إلى السحابة مباشرة، بدون أي تعديل.</p>
            )}
          </Card>
        </>
      )}

      <Card>
        <SectionTitle>آخر 24 ساعة</SectionTitle>
        <HistoryChart samples={history[selected.id] ?? []} />
      </Card>

      <button className={`${btn.ghost} w-full`} onClick={onDevices}>
        كل العواكس ({devices.length})
      </button>
    </div>
  );
}

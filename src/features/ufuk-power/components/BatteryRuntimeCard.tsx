import { useState } from 'react';
import { calculateRemainingTimeMinutes, type Summary } from '../lib/metrics';
import { useApp } from '../store';
import { Card, Num, Pill } from './ui';

export function BatteryRuntimeCard({ summary }: { summary: Summary }) {
  const { prefs, savePrefs } = useApp();
  const [editingAh, setEditingAh] = useState(false);
  const [ahInput, setAhInput] = useState<string>(String(prefs.batteryAh ?? 200));

  const batteryAh = prefs.batteryAh ?? 200;
  const gridOff = summary.gridConnected === false;

  const minutesRemaining = calculateRemainingTimeMinutes({
    soc: summary.soc,
    battVoltage: summary.battVoltage,
    loadPower: summary.loadPower,
    battPower: summary.battPower,
    batteryAh,
  });

  const formatHoursMinutes = (totalMins: number | null) => {
    if (totalMins == null) return 'غير متوفر';
    if (totalMins <= 0) return '0 دقيقة (وصلت لـ 15%)';
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hrs === 0) return `${mins} دقيقة`;
    if (mins === 0) return `${hrs} ساعة`;
    return `${hrs} س و ${mins} د`;
  };

  const currentLoadAmps = summary.loadCurrent != null ? summary.loadCurrent : null;
  const currentLoadWatts = summary.loadPower != null ? Math.round(summary.loadPower) : null;

  const handleSaveAh = async (val: number) => {
    if (val > 0) {
      await savePrefs({ ...prefs, batteryAh: val });
    }
    setEditingAh(false);
  };

  return (
    <Card className="!p-4 bg-gradient-to-br from-amber-50/70 via-white to-teal-50/50 border border-amber-200/50 shadow-sm relative overflow-hidden">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-sm font-bold text-sm">
            15%
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">الوقت المتبقي حتى 15% بطارية</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {gridOff ? 'تفريغ من البطارية (الوطنية مقطوعة)' : 'الشبكة الوطنية متصلة — حساب تقديري'}
            </p>
          </div>
        </div>
        <Pill tone={gridOff ? 'amber' : 'sky'}>
          {gridOff ? 'على البطارية' : 'الوطنية متصلة'}
        </Pill>
      </div>

      {/* Main Countdown / Estimate Display */}
      <div className="mt-3.5 flex items-baseline justify-between rounded-xl bg-white/80 p-3 ring-1 ring-slate-900/5 backdrop-blur-sm">
        <div>
          <span className="text-xs font-medium text-slate-500 block">الوقت المتبقي للتشغيل:</span>
          <div className="mt-0.5 text-2xl font-extrabold tracking-tight text-slate-900">
            {formatHoursMinutes(minutesRemaining)}
          </div>
        </div>
        <div className="text-end">
          <span className="text-xs font-medium text-slate-500 block">الحمل الحالي:</span>
          <div className="mt-0.5 text-base font-bold text-teal-700">
            {currentLoadAmps != null ? <Num>{currentLoadAmps.toFixed(1)} A</Num> : '—'}
            {currentLoadWatts != null && (
              <span className="text-xs font-normal text-slate-500 ms-1">
                (<Num>{currentLoadWatts} W</Num>)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SoC Progress Bar to 15% */}
      {summary.soc != null && (
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-600">
            <span>نسبة الشحن الحالية: <Num>{summary.soc}%</Num></span>
            <span className="text-amber-700 font-semibold">الحد الأدنى الأمني: <Num>15%</Num></span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
            {/* Target 15% marker line */}
            <div className="absolute top-0 bottom-0 start-[15%] w-0.5 bg-red-500 z-10" title="حد 15%" />
            <div
              className={`h-full rounded-full transition-all ${
                summary.soc <= 20 ? 'bg-red-500' : summary.soc <= 40 ? 'bg-amber-500' : 'bg-teal-500'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, summary.soc))}%` }}
            />
          </div>
        </div>
      )}

      {/* Battery Ah Capacity Configuration */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>سعة البطارية: <b className="text-slate-800"><Num>{batteryAh} Ah</Num></b></span>
        
        {editingAh ? (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              className="w-16 rounded-md border border-slate-300 px-1.5 py-0.5 text-xs font-semibold text-slate-900 outline-none focus:border-teal-500"
              value={ahInput}
              onChange={(e) => setAhInput(e.target.value)}
              placeholder="Ah"
              autoFocus
            />
            <button
              className="rounded-md bg-teal-600 px-2 py-0.5 text-xs font-medium text-white"
              onClick={() => handleSaveAh(parseInt(ahInput, 10) || 200)}
            >
              حفظ
            </button>
            <button
              className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600"
              onClick={() => setEditingAh(false)}
            >
              إلغاء
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {[100, 200, 300, 400].map((ah) => (
              <button
                key={ah}
                onClick={() => handleSaveAh(ah)}
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                  batteryAh === ah
                    ? 'bg-teal-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ah}A
              </button>
            ))}
            <button
              onClick={() => {
                setAhInput(String(batteryAh));
                setEditingAh(true);
              }}
              className="ms-1 text-[11px] text-teal-700 underline font-medium"
            >
              تعديل
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

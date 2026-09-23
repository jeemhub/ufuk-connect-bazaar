import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Sample } from '../types';

const VIEWS = {
  power: {
    label: 'الشمسي والحمل',
    unit: 'W',
    series: [
      { key: 'pv', name: 'الشمسي', color: '#f59e0b' },
      { key: 'load', name: 'الحمل', color: '#8b5cf6' },
    ],
  },
  battery: {
    label: 'فولتية البطارية',
    unit: 'V',
    series: [{ key: 'battV', name: 'البطارية', color: '#10b981' }],
  },
} as const;

const time = (ts: number) => new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/** Built from this app's own cloud polls (one point per minute while the app is open). */
export function HistoryChart({ samples }: { samples: Sample[] }) {
  const [view, setView] = useState<keyof typeof VIEWS>('power');
  const rows = useMemo(() => {
    const step = Math.max(1, Math.floor(samples.length / 300));
    return samples.filter((_, i) => i % step === 0 || i === samples.length - 1);
  }, [samples]);

  if (samples.length < 2) {
    return <div className="grid h-32 place-items-center px-6 text-center text-sm leading-relaxed text-slate-400">يُبنى الرسم من القراءات أثناء فتح التطبيق — سيظهر بعد دقائق</div>;
  }

  const v = VIEWS[view];
  return (
    <div>
      <div className="mb-3 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-[13px]">
        {(Object.keys(VIEWS) as (keyof typeof VIEWS)[]).map((k) => (
          <button key={k} onClick={() => setView(k)} className={`min-h-9 rounded-lg font-medium ${view === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            {VIEWS[k].label}
          </button>
        ))}
      </div>
      <div className="mb-2 flex gap-4 text-xs text-slate-500">
        {v.series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
      <div dir="ltr" className="h-48 w-full">
        <ResponsiveContainer>
          <AreaChart data={rows} margin={{ top: 4, right: 2, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="#eef2f7" vertical={false} />
            <XAxis dataKey="ts" type="number" domain={['dataMin', 'dataMax']} tickFormatter={time} tick={{ fill: '#94a3b8', fontSize: 10 }} minTickGap={48} axisLine={false} tickLine={false} />
            <YAxis domain={view === 'battery' ? ['auto', 'auto'] : [0, 'auto']} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(x) => (Math.abs(x) >= 1000 ? `${x / 1000}k` : x)} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#fff', border: 'none', borderRadius: 12, fontSize: 12, boxShadow: '0 8px 24px rgba(15,23,42,.12)' }}
              labelFormatter={(x) => time(Number(x))}
              formatter={(x) => `${Math.round(Number(x) * 10) / 10} ${v.unit}`}
            />
            {v.series.map((s) => (
              <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} fill={s.color} fillOpacity={0.1} strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

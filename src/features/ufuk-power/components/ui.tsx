import type { ButtonHTMLAttributes, ReactNode } from 'react';

// Light, calm design tokens: white cards on a cool grey ground, one teal accent.

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_0_0_1px_rgba(15,23,42,0.05)] ${className}`}>{children}</section>;
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-[15px] font-semibold text-slate-900">{children}</h2>
      {aside}
    </div>
  );
}

/** Numbers + units are always LTR so "52.4 V" never flips inside Arabic text. */
export function Num({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span dir="ltr" className={`tabular-nums ${className}`}>
      {children}
    </span>
  );
}

type Tone = 'green' | 'red' | 'amber' | 'slate' | 'sky' | 'teal';
const tones: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-700',
  amber: 'bg-amber-50 text-amber-700',
  sky: 'bg-sky-50 text-sky-700',
  teal: 'bg-teal-50 text-teal-700',
  slate: 'bg-slate-100 text-slate-600',
};

export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{children}</span>
    </div>
  );
}

export function IconButton({ label, children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`grid size-11 shrink-0 place-items-center rounded-xl text-slate-600 active:bg-slate-100 disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange(v: boolean): void; disabled?: boolean; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-[3.25rem] shrink-0 rounded-full transition-colors disabled:opacity-40 ${checked ? 'bg-teal-600' : 'bg-slate-300'}`}
    >
      {/* Logical inset: knob travels toward the reading direction's end (left in Arabic, like iOS RTL). */}
      <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-[inset-inline-start] ${checked ? 'start-[1.5rem]' : 'start-1'}`} />
    </button>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-teal-50 text-teal-600">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-500">{body}</p>
      {action && <div className="mt-6 w-full max-w-xs">{action}</div>}
    </div>
  );
}

export const btn = {
  primary:
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-[15px] font-semibold text-white active:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400',
  ghost:
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 text-[15px] font-medium text-slate-700 ring-1 ring-slate-200 active:bg-slate-50 disabled:opacity-40',
  soft: 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-50 px-4 text-[15px] font-semibold text-teal-700 active:bg-teal-100 disabled:opacity-40',
  danger:
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 text-[15px] font-semibold text-red-600 active:bg-red-100 disabled:opacity-40',
};

export const input =
  'w-full rounded-xl bg-slate-50 px-3.5 py-3 text-base text-slate-900 ring-1 ring-slate-200 outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-500 disabled:opacity-60';

export const label = 'mb-1.5 block text-[13px] font-medium text-slate-600';

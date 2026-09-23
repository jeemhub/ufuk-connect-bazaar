import { useApp } from '../store';

const dot = { error: 'bg-red-500', warning: 'bg-amber-500', info: 'bg-teal-500' };

export function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          role="alert"
          className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl bg-white p-3.5 text-start shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5"
        >
          <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${dot[t.level]}`} />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-900">{t.title}</span>
            <span className="mt-0.5 block text-xs text-slate-500">{t.body}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

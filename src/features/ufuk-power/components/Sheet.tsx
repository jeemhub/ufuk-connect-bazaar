import { useEffect, useRef, type ReactNode } from 'react';
import { IconClose } from './Icons';

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose(): void;
  /** Block closing (e.g. while a write is in flight). */
  locked?: boolean;
}

/** Bottom sheet on phones, centered dialog from `sm` up. Built on native <dialog> for focus trapping. */
export function Sheet({ open, title, children, onClose, locked }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (!locked) onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current && !locked) onClose();
      }}
      className="mx-0 mb-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/40 backdrop:backdrop-blur-[2px] sm:m-auto sm:w-[28rem] sm:rounded-3xl"
    >
      {open && (
        <div className="px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-2.5">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold">{title}</h3>
            <button aria-label="إغلاق" disabled={locked} onClick={onClose} className="-me-2 grid size-10 place-items-center rounded-full text-slate-400 active:bg-slate-100">
              <IconClose className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

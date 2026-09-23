import { useEffect, useState, type ReactNode } from 'react';
import { Sheet } from './Sheet';
import { btn } from './ui';

interface Props {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  busy?: boolean;
  /** Demo writes go to a simulator, so the live-load acknowledgement is not needed. */
  requireAck?: boolean;
  onConfirm(): void;
  onCancel(): void;
}

/**
 * Confirmation for writes to a live inverter: the confirm button stays disabled
 * until the user explicitly ticks the acknowledgement.
 */
export function ConfirmDialog({ open, title, children, confirmLabel, busy, requireAck = true, onConfirm, onCancel }: Props) {
  const [ack, setAck] = useState(false);
  useEffect(() => {
    if (open) setAck(false);
  }, [open]);

  return (
    <Sheet open={open} title={title} onClose={onCancel} locked={busy}>
      <div className="text-sm text-slate-600">{children}</div>
      {requireAck && (
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-amber-50 p-3.5 text-[13px] leading-relaxed text-amber-900">
          <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-teal-600" checked={ack} onChange={(e) => setAck(e.target.checked)} />
          أفهم أن هذا التعديل سيُرسل إلى عاكس فعلي متصل بحمل حقيقي وقد يغيّر مصدر تغذية المنزل أو يوقف الشحن.
        </label>
      )}
      <div className="mt-5 grid gap-2">
        <button className={btn.primary} disabled={(requireAck && !ack) || busy} onClick={onConfirm}>
          {busy ? 'جارٍ الإرسال…' : confirmLabel}
        </button>
        <button className={btn.ghost} disabled={busy} onClick={onCancel}>
          إلغاء
        </button>
      </div>
    </Sheet>
  );
}

import { Sheet } from './Sheet';
import { btn } from './ui';

/**
 * Putting a datalogger on the home router is done over the vendor's proprietary BLE
 * provisioning, which a web app cannot speak. This guides the one-time setup in Smart Value.
 */
export function WifiGuide({ open, onClose, deviceId }: { open: boolean; onClose(): void; deviceId: string }) {
  const steps = [
    'افتح تطبيق Smart Value الرسمي، واختر هذا الجهاز ثم خيار إعداد الشبكة (Wi-Fi / Network).',
    'اختر شبكة الراوتر بتردد 2.4GHz (أغلب هذه الـ dongles لا تدعم 5GHz) وأدخل كلمة مرورها.',
    'انتظر حتى يؤكد Smart Value نجاح الاتصال. بعدها يرفع الـ dongle بياناته للسحابة تلقائياً.',
    'ارجع لهذا التطبيق: العاكس يظهر ويُراقَب ويُتحكَّم به من أي مكان، طالما الراوتر متصل بالإنترنت.',
  ];

  return (
    <Sheet open={open} title="ربط الـ dongle بشبكة WiFi" onClose={onClose}>
      <p className="text-[13px] leading-relaxed text-slate-500">
        الجهاز <span dir="ltr" className="font-mono">{deviceId}</span>. ضبط الـ WiFi يتم مرة واحدة فقط من Smart Value، لأن الـ dongle يستقبل كلمة مرور الراوتر عبر بروتوكول بلوتوث مغلق من الشركة لا تستطيع تطبيقات الويب استخدامه.
      </p>
      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-700">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <button className={`${btn.ghost} mt-5 w-full`} onClick={onClose}>
        فهمت
      </button>
    </Sheet>
  );
}

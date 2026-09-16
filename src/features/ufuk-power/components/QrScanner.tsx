import jsQR from 'jsqr';
import { useEffect, useRef, useState } from 'react';
import { IconImage } from './Icons';
import { btn } from './ui';

/**
 * Camera QR scanner (jsQR — works in iOS Safari/PWA and Android). Falls back to
 * decoding a photo from the gallery when the camera is blocked.
 */
export function QrScanner({ onResult }: { onResult(text: string): void }) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const done = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;

    const tick = () => {
      const v = video.current;
      const c = canvas.current;
      if (!v || !c || done.current) return;
      if (v.readyState === v.HAVE_ENOUGH_DATA) {
        const w = 480;
        const h = Math.round((v.videoHeight / v.videoWidth) * w) || 480;
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(v, 0, 0, w, h);
        const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
        if (code?.data) {
          done.current = true;
          navigator.vibrate?.(60);
          onResult(code.data);
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('الكاميرا غير متاحة في هذا المتصفح. اختر صورة للرمز بدلاً من ذلك.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        const v = video.current!;
        v.srcObject = stream;
        v.setAttribute('playsinline', 'true');
        await v.play();
        raf = requestAnimationFrame(tick);
      } catch {
        setError('لم يُسمح باستخدام الكاميرا. فعّل الإذن من إعدادات المتصفح أو اختر صورة للرمز.');
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  const fromFile = async (file: File) => {
    const img = await createImageBitmap(file);
    const c = document.createElement('canvas');
    const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const code = jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
    if (code?.data) onResult(code.data);
    else setError('لم يُعثر على رمز QR في الصورة. جرّب صورة أوضح.');
  };

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-slate-900">
        <video ref={video} muted playsInline className="size-full object-cover" />
        <canvas ref={canvas} className="hidden" />
        {!error && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="relative size-[62%]">
              {['top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl', 'top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl', 'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl', 'bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl'].map((c) => (
                <span key={c} className={`absolute size-10 border-white ${c}`} />
              ))}
              <span className="absolute inset-x-3 top-1/2 h-0.5 animate-pulse bg-teal-400/80" />
            </div>
          </div>
        )}
        {error && <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm leading-relaxed text-white/90">{error}</div>}
      </div>
      <p className="mt-3 text-center text-[13px] text-slate-500">وجّه الكاميرا إلى رمز QR الموجود على الـ datalogger أو علبته</p>
      <label className={`${btn.ghost} mt-3 w-full cursor-pointer`}>
        <IconImage className="size-5" />
        اختيار صورة للرمز
        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && fromFile(e.target.files[0])} />
      </label>
    </div>
  );
}

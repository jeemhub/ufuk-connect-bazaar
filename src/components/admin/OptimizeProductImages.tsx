import { useEffect, useRef, useState } from 'react';
import { ImageDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { optimizeUpload } from '@/lib/optimizeUpload';
import { storageObject, storageReference } from '@/lib/storageReferences';
import { useLanguage } from '@/i18n/LanguageContext';

type Row = { id: string; image_url: string | null };
export function OptimizeProductImages({ rows, onComplete }: { rows: Row[]; onComplete: () => unknown }) {
  const { lang } = useLanguage(); const ar = lang === 'ar';
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, changed: 0, saved: 0 });
  const [error, setError] = useState(false);
  const stopped = useRef(false); const controller = useRef<AbortController>();
  useEffect(() => () => { stopped.current = true; controller.current?.abort(); }, []);
  const candidates = rows.filter(row => {
    try { return row.image_url && !row.image_url.includes('/optimized-') && storageObject(row.image_url)?.bucket === 'product-images'; } catch { return false; }
  });
  const stop = () => { stopped.current = true; controller.current?.abort(); };
  const start = async () => {
    stopped.current = false; setBusy(true); setError(false);
    let done = 0, changed = 0, saved = 0;
    setProgress({ done, changed, saved });
    try {
      // Sequential work bounds memory, requests and CPU. Stop at the first failure.
      for (const row of candidates) {
        if (stopped.current) break;
        const object = storageObject(row.image_url)!;
        const bucket = supabase.storage.from('product-images');
        const signed = await bucket.createSignedUrl(object.path, 60);
        if (signed.error || !signed.data?.signedUrl) throw new Error('Storage unavailable');
        controller.current = new AbortController();
        const response = await fetch(signed.data.signedUrl, { signal: controller.current.signal });
        if (!response.ok) throw new Error('Image unavailable');
        const original = await response.blob();
        if (original.size >= 80_000 && original.size <= 10_000_000) {
          const image = await optimizeUpload(new File([original], object.path.split('/').pop()!, { type: original.type }));
          if (stopped.current) break;
          if (image.size < original.size * 0.85) {
            const path = `products/optimized-${crypto.randomUUID()}.${image.type.split('/')[1]}`;
            const uploaded = await bucket.upload(path, image, { contentType: image.type, cacheControl: '31536000', upsert: false });
            if (uploaded.error) throw uploaded.error;
            if (stopped.current) break;
            const updated = await supabase.from('products').update({ image_url: storageReference('product-images', path) })
              .eq('id', row.id).eq('image_url', row.image_url!).select('id').maybeSingle();
            if (updated.error) throw updated.error;
            // Preserve the original image; only replace the reference if it hasn't changed.
            if (updated.data) { changed++; saved += original.size - image.size; }
          }
        }
        done++; setProgress({ done, changed, saved });
      }
    } catch { if (!stopped.current) setError(true); }
    finally { setProgress({ done, changed, saved }); setBusy(false); if (changed) onComplete(); }
  };
  return <>
    <Button variant="outline" onClick={() => setOpen(true)}><ImageDown className="me-2 h-4 w-4" />{ar ? 'تحسين صور المنتجات' : 'Optimize product images'}</Button>
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}><DialogContent><DialogHeader><DialogTitle>{ar ? 'تقليل حجم الصور الحالية' : 'Reduce existing image sizes'}</DialogTitle></DialogHeader>
      <p className="text-sm leading-7 text-muted-foreground">{ar ? 'يحمّل كل صورة مرة واحدة ويضغط الصور الكبيرة محليًا. تُحفظ نسخة محسّنة عند توفير 15% على الأقل، مع الاحتفاظ بالأصل. شغّل هذه العملية مرة واحدة بعد عودة خدمة قاعدة البيانات.' : 'Downloads each image once and compresses large raster images locally. Saves a new copy only when at least 15% smaller and keeps the original. Run once after database service is restored.'}</p>
      <div role="status" aria-live="polite" className="text-sm">{progress.done} / {candidates.length} · {ar ? 'صور محسّنة' : 'optimized'}: {progress.changed} · {ar ? 'توفير' : 'saved'}: {(progress.saved / 1_000_000).toFixed(2)} MB</div>
      {error && <p role="alert" className="text-sm text-destructive">{ar ? 'توقفت العملية لتعذر الوصول إلى صورة أو حفظها. لم تُحذف الصور الأصلية. تحقق من عودة الخدمة قبل إعادة المحاولة.' : 'Stopped because an image could not be accessed or saved. Originals were retained. Check service availability before retrying.'}</p>}
      {busy ? <Button variant="outline" onClick={stop}><Loader2 className="me-2 h-4 w-4 animate-spin" />{ar ? 'إيقاف بعد الصورة الحالية' : 'Stop processing'}</Button> : <Button disabled={!candidates.length} onClick={() => void start()}>{ar ? 'بدء التحسين' : 'Start optimization'}</Button>}
    </DialogContent></Dialog>
  </>;
}

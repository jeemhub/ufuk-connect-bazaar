import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { TransferMode } from './client';
export function TransferNotice() {
  const { lang } = useLanguage(); const [mode, setMode] = useState<TransferMode>('normal');
  useEffect(() => {
    const update = (event: Event) => setMode((event as CustomEvent<{ mode: TransferMode }>).detail.mode);
    window.addEventListener('ufuk-transfer-mode', update);
    return () => window.removeEventListener('ufuk-transfer-mode', update);
  }, []);
  if (mode !== 'limited' && mode !== 'warning') return null;
  return <div role="status" className="border-b border-amber-300/40 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">{lang === 'ar' ? mode === 'limited' ? 'وضع توفير البيانات: قد تتوقف بعض الصور مؤقتًا. تصفح المنتجات والتواصل مع المبيعات متاحان.' : 'وضع توفير البيانات: اقترب الموقع من الحد اليومي، ونستخدم التحميل المخفف.' : mode === 'limited' ? 'Data-saving mode: some images may be paused. Product browsing and contacting sales remain available.' : 'Data-saving mode: the site is approaching its daily allowance.'}</div>;
}

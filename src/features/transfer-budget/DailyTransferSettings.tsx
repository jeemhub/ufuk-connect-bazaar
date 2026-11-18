import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/AuthProvider';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
interface Budget { enabled: boolean; configured: boolean; limitBytes: number; usedBytes: number; requests: number; blockedImages: number; day: string; resetAt: string; trackingSince?: string }
async function budgetRequest(body?: { enabled: boolean; limitMb: number }): Promise<Budget> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Sign in required');
  const response = await fetch('/api/transfer-budget', { method: body ? 'PATCH' : 'GET', headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (!response.ok) throw new Error('Shared counter unavailable');
  return response.json();
}
export function DailyTransferSettings() {
  const { user } = useAuth(); const { lang } = useLanguage(); const ar = lang === 'ar'; const cache = useQueryClient();
  const [draft, setDraft] = useState<{ enabled: boolean; limitMb: number } | null>(null);
  const key = ['daily-transfer-budget', user?.id];
  const query = useQuery({ queryKey: key, queryFn: () => budgetRequest(), retry: false, staleTime: 60_000, refetchInterval: 300_000 });
  const save = useMutation({ mutationFn: budgetRequest, onSuccess: data => { cache.setQueryData(key, data); setDraft(null); toast.success(ar ? 'تم حفظ الحد اليومي' : 'Daily limit saved'); }, onError: () => toast.error(ar ? 'تعذر حفظ الحد اليومي' : 'Could not save the daily limit') });
  const value = draft ?? { enabled: query.data?.enabled ?? true, limitMb: (query.data?.limitBytes ?? 120_000_000) / 1_000_000 };
  const update = (next: Partial<typeof value>) => setDraft({ ...value, ...next });
  const used = query.data ? query.data.usedBytes / 1_000_000 : null;
  const percent = query.data ? query.data.usedBytes / query.data.limitBytes * 100 : 0;
  return <section className="surface-card space-y-4 p-5">
    <h2 className="font-semibold">{ar ? 'حماية استهلاك البيانات اليومي' : 'Daily data transfer protection'}</h2>
    <p className="text-sm leading-7 text-muted-foreground">{ar ? 'عداد مشترك لكل مستخدمي الموقع. تنبيه عند 80%، وإيقاف تحميل صور الكتالوج الجديدة عند الحد. بيانات المنتجات الأساسية وتسجيل الدخول والطلبات تبقى متاحة. يتجدد العداد منتصف الليل بتوقيت بغداد.' : 'Shared across site users. Warns at 80% and stops new catalogue image downloads at the limit. Essential catalogue data, sign-in and orders remain available. Resets at Baghdad midnight.'}</p>
    {query.isPending ? <div role="status"><Loader2 className="h-4 w-4 animate-spin" /></div> : query.isError ? <p role="alert" className="text-sm text-destructive">{ar ? 'تعذر قراءة العداد المشترك. قد تكون Supabase مقيّدة حاليًا. لا توجد قراءة مؤكدة للاستهلاك اليوم.' : 'Shared counter unavailable. Supabase may be restricted. Today’s usage cannot be confirmed.'}</p> : <>
      <div className="flex items-center justify-between text-sm"><span>{ar ? 'نقل البيانات المحتسب اليوم' : 'Accounted transfer today'}</span><b dir="ltr">{used?.toFixed(2)} / {((query.data?.limitBytes ?? 0) / 1_000_000).toFixed(0)} MB</b></div>
      <Progress value={Math.min(100, percent)} aria-label={ar ? 'نسبة الاستهلاك اليومي' : 'Daily usage percentage'} />
      <p className={`text-sm ${percent >= 80 ? 'text-amber-600' : 'text-muted-foreground'}`} role="status">{!query.data?.configured ? (ar ? 'الإعداد غير مكتمل' : 'Setup incomplete') : !query.data?.enabled ? (ar ? 'الحماية اليومية متوقفة' : 'Daily protection disabled') : percent >= 100 ? (ar ? 'تم بلوغ الحد: تحميل الصور الجديدة متوقف لليوم' : 'Limit reached: new images paused today') : percent >= 80 ? (ar ? 'تنبيه: الاستهلاك اقترب من الحد اليومي' : 'Warning: approaching daily allowance') : (ar ? 'الاستهلاك ضمن الحد' : 'Usage within allowance')}</p>
      <div className="text-xs text-muted-foreground">{ar ? 'طلبات محتسبة' : 'Accounted requests'}: {query.data?.requests} · {ar ? 'صور أوقفتها الحماية' : 'Blocked images'}: {query.data?.blockedImages}</div>
    </>}
    <div className="flex items-center justify-between gap-4"><Label htmlFor="daily-transfer-enabled">{ar ? 'تشغيل الحماية اليومية' : 'Enable daily protection'}</Label><Switch id="daily-transfer-enabled" checked={value.enabled} disabled={!query.isSuccess || save.isPending} onCheckedChange={enabled => update({ enabled })} /></div>
    <div className="flex flex-wrap items-end gap-3"><div><Label htmlFor="daily-transfer-limit">{ar ? 'الحد اليومي بالميغابايت MB' : 'Daily allowance in MB'}</Label><Input id="daily-transfer-limit" type="number" min={1} max={1000} step={1} value={Number.isNaN(value.limitMb) ? '' : value.limitMb} onChange={event => update({ limitMb: event.target.value === '' ? NaN : Number(event.target.value) })} disabled={!query.isSuccess || save.isPending} /></div><Button disabled={!query.isSuccess || !draft || save.isPending || !Number.isInteger(value.limitMb) || value.limitMb < 1 || value.limitMb > 1000} onClick={() => save.mutate(value)}>{save.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{ar ? 'حفظ' : 'Save'}</Button><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>{ar ? 'تحديث القراءة' : 'Refresh'}</Button></div>
    {query.data?.trackingSince && <p className="text-xs text-muted-foreground">{ar ? 'القياس يبدأ من تشغيل الحماية؛ لا يتضمن نقل البيانات السابق.' : 'Accounting starts when protection is installed; earlier transfer is not included.'}</p>}
    <p className="text-xs leading-6 text-muted-foreground">{ar ? 'هذا حد للتخفيف داخل الموقع وليس سقفًا مضمونًا لفاتورة Supabase. يحسب البيانات والصور التي تمر عبر حماية الموقع مع هامش تقديري للطلبات. لا يشمل الدخول المباشر لقاعدة البيانات أو الملفات الشخصية أو المشاريع الأخرى. النسخ المخزنة على Vercel لا تسحب الملف مجددًا من Supabase.' : 'An application soft limit, not a guaranteed Supabase billing cap. Accounts protected catalogue data and images with estimated request overhead. Excludes direct database traffic, personal files and other projects. Vercel cache hits do not re-download the asset from Supabase.'}</p>
  </section>;
}

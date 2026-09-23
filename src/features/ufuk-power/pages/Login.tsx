import { useState } from 'react';
import { btn, input, label } from '../components/ui';
import { useApp } from '../store';

export function Login() {
  const { signIn } = useApp();
  const [usr, setUsr] = useState('');
  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(usr, pwd);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col px-5 pb-10 pt-8">
      <div className="mx-auto w-full max-w-sm flex-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">تسجيل الدخول</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
          سجّل الدخول بنفس حساب تطبيق <b className="text-slate-700">SmartValue</b>. ستظهر كل العواكس المسجلة في حسابك تلقائياً ببياناتها الحقيقية.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className={label} htmlFor="usr">اسم المستخدم</label>
            <input id="usr" className={input} dir="ltr" autoComplete="username" autoCapitalize="off" autoCorrect="off" value={usr} onChange={(e) => setUsr(e.target.value)} required />
          </div>
          <div>
            <label className={label} htmlFor="pwd">كلمة المرور</label>
            <div className="relative">
              <input
                id="pwd"
                className={`${input} pl-16`}
                dir="ltr"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute left-1 top-1/2 min-h-10 -translate-y-1/2 rounded-lg px-3 text-sm font-medium text-teal-700">
                {show ? 'إخفاء' : 'إظهار'}
              </button>
            </div>
          </div>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button className={`${btn.primary} w-full`} disabled={busy || !usr || !pwd}>
            {busy ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>

      <p className="mx-auto mt-8 max-w-sm text-center text-xs leading-relaxed text-slate-400">
        الاتصال مباشر من هاتفك إلى سحابة SmartValue الرسمية. كلمة المرور لا تُحفظ ولا تُرسل لأي خادم آخر — يُحفظ فقط رمز الجلسة على هذا الهاتف.
      </p>
    </div>
  );
}

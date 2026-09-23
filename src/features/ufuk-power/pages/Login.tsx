import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { Sheet } from '../components/Sheet';
import { btn, input, label } from '../components/ui';
import { useApp } from '../store';

export function Login() {
  const { signIn, smartLogin } = useApp();
  const { user, phone: sitePhone } = useAuth();
  const [mode, setMode] = useState<'ask' | 'smartvalue'>('ask');
  const [usr, setUsr] = useState('');
  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phone modal state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const performLoginWithPhone = async (phoneToUse: string) => {
    const cleanPhone = phoneToUse.trim();
    if (!cleanPhone) throw new Error('يرجى إدخال رقم هاتف صحيح');
    const pass = user?.id || 'ufuk_power_secure_pass';
    await smartLogin(cleanPhone, pass);
  };

  const handleSmartSiteLogin = async () => {
    setBusy(true);
    setError(null);
    const existingPhone = sitePhone || user?.user_metadata?.phone || user?.phone;

    if (existingPhone) {
      try {
        await performLoginWithPhone(existingPhone);
        setBusy(false);
        return;
      } catch (err) {
        console.warn('Initial phone login fallback:', err);
      }
    }

    setBusy(false);
    setPhoneInput(existingPhone || '');
    setShowPhoneModal(true);
  };

  const handlePhoneModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    setModalBusy(true);
    setModalError(null);
    try {
      await performLoginWithPhone(phoneInput);
      setShowPhoneModal(false);
    } catch (err) {
      setModalError((err as Error).message);
    } finally {
      setModalBusy(false);
    }
  };

  const submitSmartValueLogin = async (e: React.FormEvent) => {
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
    <div className="flex flex-col px-4 pb-10 pt-6 sm:px-6">
      <div className="mx-auto w-full max-w-md flex-1">
        {mode === 'ask' && (
          <div className="space-y-6 pt-2">
            {/* Prominent UI/UX Header Banner Card */}
            <div className="rounded-3xl bg-gradient-to-b from-white via-slate-50/80 to-amber-50/40 p-6 text-center ring-1 ring-slate-900/10 shadow-sm relative overflow-hidden">
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-amber-500 text-white font-extrabold text-2xl shadow-md shadow-amber-500/20">
                ⚡
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-snug">
                هل تمتلك حساباً سابقاً في تطبيق <span className="text-amber-600 underline underline-offset-4 decoration-amber-400">Smart Value</span>؟
              </h2>
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">
                اختر الخيار المناسب لتسجيل الدخول ومراقبة عواكسك مباشرة من أُفق البصرة.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                className={`${btn.primary} w-full py-4 text-base font-bold shadow-md shadow-teal-600/15`}
                onClick={() => {
                  setMode('smartvalue');
                  setError(null);
                }}
              >
                نعم، لدي حساب
              </button>
            </div>

            {/* Direct Redirect Guidance Card for Smart Value Registration */}
            <div className="rounded-2xl border border-sky-200/80 bg-sky-50/60 p-4 text-start">
              <div className="flex items-center gap-2 text-sky-900 font-bold text-sm">
                <svg className="size-5 shrink-0 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ليس لديك حساب على Smart Value بعد؟
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-sky-800">
                يمكنك إنشاء حساب جديد مجاناً وبسرعة على خادم Smart Value الرسمي عبر الرابط أدناه واضافة العاكس ، ثم العودة لتسجيل الدخول هنا:
              </p>
              <a
                href="https://www.valueclouds.com/#/entry"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700 transition-colors"
              >
                انتقل لإنشاء حساب في Smart Value
                <svg className="size-3.5 ms-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 p-4 text-xs text-red-800 space-y-2 border border-red-200">
                <p className="font-bold">{error}</p>
                <p>يرجى التأكد من إنشاء حسابك على موقع Smart Value الرسمي أولاً:</p>
                <a
                  href="https://www.valueclouds.com/#/entry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-red-700 underline"
                >
                  افتح موقع Smart Value لإنشاء الحساب ↗
                </a>
              </div>
            )}
          </div>
        )}

        {mode === 'smartvalue' && (
          <div>
            <button
              type="button"
              onClick={() => {
                setMode('ask');
                setError(null);
              }}
              className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
            >
              ← تغيير الخيار
            </button>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              تسجيل الدخول بحساب Smart Value
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
              أدخل اسم المستخدم وكلمة المرور المسجلة في تطبيق Smart Value لمزامنة كافة عواكسك.
            </p>

            <form onSubmit={submitSmartValueLogin} className="mt-6 space-y-4">
              <div>
                <label className={label} htmlFor="usr">
                  اسم المستخدم / رقم الهاتف
                </label>
                <input
                  id="usr"
                  className={input}
                  dir="ltr"
                  autoComplete="username"
                  autoCapitalize="off"
                  autoCorrect="off"
                  value={usr}
                  onChange={(e) => setUsr(e.target.value)}
                  placeholder="اسم الحساب في Smart Value"
                  required
                />
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
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute left-1 top-1/2 min-h-10 -translate-y-1/2 rounded-lg px-3 text-sm font-medium text-teal-700"
                  >
                    {show ? 'إخفاء' : 'إظهار'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 space-y-2">
                  <p>{error}</p>
                  <a
                    href="https://www.valueclouds.com/#/entry"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-red-700 underline"
                  >
                    انقر هنا لإنشاء أو إعادة ضبط الحساب في Smart Value ↗
                  </a>
                </div>
              )}

              <button className={`${btn.primary} w-full`} disabled={busy || !usr || !pwd}>
                {busy ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Interactive Phone Modal / Sheet */}
      <Sheet open={showPhoneModal} title="تأكيد رقم الهاتف لتفعيل المراقبة" onClose={() => setShowPhoneModal(false)}>
        <form onSubmit={handlePhoneModalSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            يرجى إدخال رقم هاتفك المسجل في Smart Value لمزامنة وتفعيل حساب مراقبة العاكس بحسابك في موقع أُفق البصرة.
          </p>

          <div>
            <label className={label} htmlFor="phoneModalInput">رقم الهاتف</label>
            <input
              id="phoneModalInput"
              className={input}
              dir="ltr"
              type="tel"
              placeholder="مثال: 07701234567"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              required
              autoFocus
            />
          </div>

          {modalError && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 space-y-1.5">
              <p>{modalError}</p>
              <a
                href="https://www.valueclouds.com/#/entry"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-red-700 underline"
              >
                انتقل لموقع Smart Value لإنشاء الحساب ↗
              </a>
            </div>
          )}

          <button className={`${btn.primary} w-full`} disabled={modalBusy || !phoneInput.trim()}>
            {modalBusy ? 'جارٍ تفعيل المراقبة…' : 'تأكيد وتفعيل المراقبة'}
          </button>
        </form>
      </Sheet>

      <p className="mx-auto mt-8 max-w-sm text-center text-xs leading-relaxed text-slate-400">
        الاتصال آمن ومباشر. يُحفظ رمز الجلسة على هذا الهاتف لخصوصيتك الكاملة.
      </p>
    </div>
  );
}

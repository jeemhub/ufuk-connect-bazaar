import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {translations} from '@/i18n/translations';
import AuthPage from './Auth';
const sdk=vi.hoisted(()=>({signUp:vi.fn(),resetPasswordForEmail:vi.fn(),signInWithPassword:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{auth:sdk,from:()=>({insert:async()=>({error:null})})}}));
vi.mock('@/auth/AuthProvider',()=>({useAuth:()=>({session:null,loading:false})}));
vi.mock('@/i18n/LanguageContext',()=>({useLanguage:()=>({lang:'ar',t:(key:string)=>translations.ar[key as keyof typeof translations.ar]??key,toggle:vi.fn()})}));
vi.mock('@/lib/migrationFeatures',()=>({emailFeaturesEnabled:true,signupEnabled:true}));
vi.mock('sonner',()=>({toast:{success:vi.fn(),error:vi.fn()}}));
beforeEach(()=>{vi.clearAllMocks();sdk.signUp.mockResolvedValue({data:{},error:null});sdk.resetPasswordForEmail.mockResolvedValue({error:null});});afterEach(cleanup);
const mount=(path='/auth')=>render(<MemoryRouter initialEntries={[path]}><AuthPage/></MemoryRouter>);
it('prominently offers signup and recovery; creates a normal customer with normalized details',async()=>{
 mount();expect(screen.getByRole('tab',{name:'إنشاء حساب جديد'})).toBeInTheDocument();expect(screen.getByRole('button',{name:'هل نسيت كلمة السر؟'})).toBeInTheDocument();
 fireEvent.click(screen.getByRole('tab',{name:'إنشاء حساب جديد'}));
 for(const [label,value]of [['الاسم الكامل','  عميل تجريبي  '],['رقم الهاتف','07701234567'],['البريد الإلكتروني',' customer@example.test '],['كلمة المرور','ExampleStrong#123'],['تأكيد كلمة المرور','ExampleStrong#123']])fireEvent.change(screen.getByLabelText(label),{target:{value}});
 fireEvent.submit(screen.getByRole('tabpanel'));
 await waitFor(()=>expect(sdk.signUp).toHaveBeenCalledOnce());
 expect(sdk.signUp).toHaveBeenCalledWith({email:'customer@example.test',password:'ExampleStrong#123',options:{emailRedirectTo:window.location.origin+'/',data:{full_name:'عميل تجريبي',phone:'07701234567'}}});
 await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent(translations.ar.auth_signup_success));
 expect(screen.getByLabelText('كلمة المرور')).toHaveValue('');
});
it('rejects mismatching confirmation before creating an account',()=>{
 mount('/auth?mode=signup');for(const [label,value]of [['الاسم الكامل','عميل'],['رقم الهاتف','07701234567'],['البريد الإلكتروني','customer@example.test'],['كلمة المرور','ExampleStrong#123'],['تأكيد كلمة المرور','DifferentStrong#123']])fireEvent.change(screen.getByLabelText(label),{target:{value}});
 fireEvent.submit(screen.getByRole('tabpanel'));expect(sdk.signUp).not.toHaveBeenCalled();
});
it('sends a recovery link to the correct route without disclosing account existence',async()=>{
 mount('/auth?mode=forgot');fireEvent.change(screen.getByLabelText('البريد الإلكتروني'),{target:{value:'customer@example.test'}});fireEvent.click(screen.getByRole('button',{name:'إرسال رابط الاستعادة'}));
 await waitFor(()=>expect(sdk.resetPasswordForEmail).toHaveBeenCalledWith('customer@example.test',{redirectTo:window.location.origin+'/auth/reset'}));expect(screen.getByRole('status')).toHaveTextContent(translations.ar.auth_forgot_sent);
});
it('shows delivery/rate-limit failures instead of claiming a link was sent',async()=>{
 sdk.resetPasswordForEmail.mockResolvedValueOnce({error:{status:429,message:'Rate limit'}});mount('/auth?mode=forgot');fireEvent.change(screen.getByLabelText('البريد الإلكتروني'),{target:{value:'customer@example.test'}});fireEvent.click(screen.getByRole('button',{name:'إرسال رابط الاستعادة'}));
 await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('طلبات كثيرة'));expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

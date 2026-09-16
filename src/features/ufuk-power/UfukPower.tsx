import { useState, type ComponentType, type SVGProps } from 'react';
import logo from '@/assets/logo.png';
import { DeviceHeader } from './components/DeviceHeader';
import { IconCog, IconDevices, IconHome, IconSliders } from './components/Icons';
import { Toasts } from './components/Toasts';
import { Control } from './pages/Control';
import { Dashboard } from './pages/Dashboard';
import { Devices } from './pages/Devices';
import { Login } from './pages/Login';
import { Settings } from './pages/Settings';
import { AppProvider, useApp } from './store';

// UFUK POWER — real-time monitoring and control of MUST inverters through the user's
// SmartValue account. Same code as the standalone PWA (ufuk-must-monitor), embedded in
// the Tools page: tabs sit at the top so they don't collide with the site header/footer.

type Tab = 'home' | 'devices' | 'control' | 'settings';

const TABS: { id: Tab; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: 'home', label: 'الرئيسية', Icon: IconHome },
  { id: 'devices', label: 'العواكس', Icon: IconDevices },
  { id: 'control', label: 'التحكم', Icon: IconSliders },
  { id: 'settings', label: 'الإعدادات', Icon: IconCog },
];

function Shell() {
  const { ready, session, devices, select } = useApp();
  const [tab, setTab] = useState<Tab>('home');

  if (!ready) return <div className="grid min-h-[60vh] place-items-center text-slate-400">…</div>;

  return (
    <>
      <Toasts />
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3 px-4 pt-5">
          <img src={logo} alt="أفق البصرة" className="h-10 w-auto" />
          <div>
            <div className="text-lg font-extrabold leading-tight tracking-tight text-slate-900">UFUK POWER</div>
            <div className="text-xs text-slate-500">مراقبة والتحكم بعواكس MUST عبر حساب SmartValue</div>
          </div>
        </div>

        {!session ? (
          <Login />
        ) : (
          <>
            <nav className="sticky top-[5.5rem] z-20 mx-3 mt-4 grid grid-cols-4 gap-1 rounded-2xl bg-white/90 p-1 shadow-sm ring-1 ring-slate-200/70 backdrop-blur sm:mx-4">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  aria-current={tab === id ? 'page' : undefined}
                  className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold sm:flex-row sm:gap-2 sm:text-sm ${
                    tab === id ? 'bg-teal-600 text-white' : 'text-slate-500 active:bg-slate-100'
                  }`}
                >
                  <Icon className="size-5" />
                  {label}
                </button>
              ))}
            </nav>

            {(tab === 'home' || tab === 'control') && devices.length > 0 && <DeviceHeader />}

            <main className="px-3 pb-10 pt-2 sm:px-4">
              {tab === 'home' && <Dashboard onDevices={() => setTab('devices')} />}
              {tab === 'devices' && (
                <Devices
                  onOpen={(id) => {
                    select(id);
                    setTab('home');
                  }}
                />
              )}
              {tab === 'control' && <Control />}
              {tab === 'settings' && <Settings />}
            </main>
          </>
        )}
      </div>
    </>
  );
}

export default function UfukPower() {
  return (
    <div dir="rtl" className="min-h-[70vh] bg-[#f4f6fa] text-slate-900" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
      <AppProvider>
        <Shell />
      </AppProvider>
    </div>
  );
}

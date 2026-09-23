import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { detectAlerts, showSystemNotification, type AlertEvent } from './lib/alerts';
import { CloudClient, login, registerAccount, smartLoginOrRegister } from './lib/cloud';
import { store } from './lib/db';
import { summarize, type Summary } from './lib/metrics';
import { DEFAULT_PREFS, type AlertPrefs, type CloudDevice, type LiveData, type Sample, type Session } from './types';

export interface Toast extends AlertEvent {
  id: number;
}

/** How often readings are pulled from the cloud. Dataloggers upload every few minutes. */
export const POLL_MS = 30_000;
export const STALE_AFTER_MS = 10 * 60_000;

interface AppState {
  ready: boolean;
  session: Session | null;
  client: CloudClient | null;
  prefs: AlertPrefs;
  devices: CloudDevice[];
  selectedId: string | null;
  selected: CloudDevice | null;
  live: Record<string, LiveData>;
  summaries: Record<string, Summary>;
  /** Samples this app recorded from its own polls, last 24h per inverter. */
  history: Record<string, Sample[]>;
  deviceErrors: Record<string, string>;
  syncing: boolean;
  toasts: Toast[];
  nameOf(d: CloudDevice): string;
  signIn(usr: string, password: string): Promise<void>;
  signUp(usr: string, password: string): Promise<void>;
  smartLogin(usr: string, password: string): Promise<void>;
  addDevice(pn: string, alias?: string): Promise<void>;
  signOut(): Promise<void>;
  refreshDevices(): Promise<void>;
  refreshLive(id?: string): Promise<void>;
  rename(id: string, name: string): Promise<void>;
  select(id: string): void;
  savePrefs(p: AlertPrefs): Promise<void>;
  pushToast(t: Omit<Toast, 'id'>): void;
  dismissToast(id: number): void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [prefs, setPrefs] = useState<AlertPrefs>(DEFAULT_PREFS);
  const [devices, setDevices] = useState<CloudDevice[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [live, setLive] = useState<Record<string, LiveData>>({});
  const [history, setHistory] = useState<Record<string, Sample[]>>({});
  const [deviceErrors, setDeviceErrors] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const summaries = useMemo(() => Object.fromEntries(Object.entries(live).map(([id, l]) => [id, summarize(l.points)])), [live]);

  const refs = useRef({ devices, summaries, prefs, names });
  refs.current = { devices, summaries, prefs, names };

  const client = useMemo(
    () =>
      session
        ? new CloudClient(session, (s) => {
            store.setSession(s);
          })
        : null,
    // Only rebuild on sign-in/out — token refreshes are handled inside the client.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session?.account],
  );

  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts.filter((x) => x.key !== t.key), { ...t, id }].slice(-3));
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), t.level === 'error' ? 10_000 : 5_000);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((ts) => ts.filter((x) => x.id !== id)), []);

  const nameOf = useCallback((d: CloudDevice) => names[d.id] || d.alias || d.pn, [names]);

  // Boot from IndexedDB so the last known state renders instantly, even offline.
  useEffect(() => {
    (async () => {
      const [s, p, devs, nm, sel, lives] = await Promise.all([
        store.getSession(), store.getPrefs(), store.getDevices(), store.getNames(), store.getSelected(), store.getAllLive(),
      ]);
      if (s) setSession(s);
      if (p) setPrefs({ ...DEFAULT_PREFS, ...p });
      const list = devs ?? [];
      setDevices(list);
      setNames(nm ?? {});
      setLive(Object.fromEntries(lives.map((l) => [l.deviceId, l])));
      setSelectedId(sel && list.some((d) => d.id === sel) ? sel : list[0]?.id ?? null);
      setReady(true);
    })();
  }, []);

  const refreshDevices = useCallback(async () => {
    if (!client) return;
    const list = await client.listDevices();
    refs.current.devices = list; // the poll loop runs before the next render
    setDevices(list);
    await store.setDevices(list);
    setSelectedId((cur) => (cur && list.some((d) => d.id === cur) ? cur : list[0]?.id ?? null));
  }, [client]);

  const recordSample = useCallback(async (id: string, smp: Sample) => {
    const prev = await store.getSamples(id);
    const last = prev[prev.length - 1];
    if (last && smp.ts - last.ts < 60_000) return; // one point per minute is plenty
    const next = [...prev.filter((x) => x.ts > smp.ts - 24 * 3600_000), smp];
    await store.putSamples(id, next);
    setHistory((h) => ({ ...h, [id]: next }));
  }, []);

  const refreshLive = useCallback(
    async (onlyId?: string) => {
      if (!client) return;
      const targets = refs.current.devices.filter((d) => !onlyId || d.id === onlyId);
      if (!targets.length) return;
      setSyncing(true);
      try {
        for (const d of targets) {
          try {
            const points = await client.lastData(d);
            const entry: LiveData = { deviceId: d.id, fetchedAt: Date.now(), points };
            const next = summarize(points);
            const name = refs.current.names[d.id] || d.alias || d.pn;
            for (const a of detectAlerts(refs.current.summaries[d.id], next, refs.current.prefs, d.id, name)) {
              pushToast(a);
              if (refs.current.prefs.systemNotifications && a.level !== 'info') showSystemNotification(a);
            }
            setLive((all) => ({ ...all, [d.id]: entry }));
            recordSample(d.id, { ts: entry.fetchedAt, pv: next.pvPower, load: next.loadPower, battV: next.battVoltage, battP: next.battPower });
            setDeviceErrors(({ [d.id]: _gone, ...rest }) => rest);
            store.putLive(entry);
          } catch (e) {
            setDeviceErrors((all) => ({ ...all, [d.id]: (e as Error).message }));
          }
        }
      } finally {
        setSyncing(false);
      }
    },
    [client, pushToast, recordSample],
  );

  // After sign-in: discover devices, then keep polling while the app is visible.
  useEffect(() => {
    if (!ready || !client) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    const loop = async () => {
      if (stopped) return;
      if (document.visibilityState === 'visible' && navigator.onLine) await refreshLive();
      timer = setTimeout(loop, POLL_MS);
    };

    (async () => {
      try {
        await refreshDevices();
      } catch (e) {
        pushToast({ key: 'devices', level: 'error', title: 'تعذّر جلب الأجهزة من الحساب', body: (e as Error).message });
      }
      loop();
    })();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timer);
        loop();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onVisible);
    };
  }, [ready, client, refreshDevices, refreshLive, pushToast]);

  useEffect(() => {
    if (!selectedId || history[selectedId]) return;
    store.getSamples(selectedId).then((smp) => setHistory((h) => ({ ...h, [selectedId]: h[selectedId] ?? smp })));
  }, [selectedId, history]);

  const value: AppState = {
    ready,
    session,
    client,
    prefs,
    devices,
    selectedId,
    selected: devices.find((d) => d.id === selectedId) ?? null,
    live,
    summaries,
    history,
    deviceErrors,
    syncing,
    toasts,
    nameOf,
    async signIn(usr, password) {
      const s = await login(usr, password);
      await store.setSession(s);
      setSession(s);
    },
    async signUp(usr, password) {
      await registerAccount(usr, password);
      const s = await login(usr, password);
      await store.setSession(s);
      setSession(s);
    },
    async smartLogin(usr, password) {
      const s = await smartLoginOrRegister(usr, password);
      await store.setSession(s);
      setSession(s);
    },
    async addDevice(pn, alias) {
      if (!client) throw new Error('يرجى تسجيل الدخول أولاً');
      await client.addDevice(pn, alias);
      await refreshDevices();
    },
    async signOut() {
      await store.clearAll();
      setSession(null);
      setDevices([]);
      setLive({});
      setHistory({});
      setNames({});
      setSelectedId(null);
    },
    refreshDevices,
    refreshLive,
    async rename(id, name) {
      const next = { ...names, [id]: name };
      setNames(next);
      await store.setNames(next);
    },
    select(id) {
      setSelectedId(id);
      store.setSelected(id);
    },
    async savePrefs(p) {
      await store.setPrefs(p);
      setPrefs(p);
    },
    pushToast,
    dismissToast,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}

export function useNow(intervalMs = 5000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

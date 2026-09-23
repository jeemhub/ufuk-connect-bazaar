import { openDB, type IDBPDatabase } from 'idb';
import type { AlertPrefs, CloudDevice, LiveData, Sample, Session } from '../types';

// Everything stays in this phone's IndexedDB: the cloud session (token + password hash,
// never the plain password), the device list, and the last readings for offline viewing.

interface Schema {
  kv: { key: string; value: unknown };
  live: { key: string; value: LiveData };
  history: { key: string; value: Sample[] };
}

let dbp: Promise<IDBPDatabase<Schema>> | null = null;
const db = () =>
  (dbp ??= openDB<Schema>('must-valuecloud', 1, {
    upgrade(d) {
      d.createObjectStore('kv');
      d.createObjectStore('live');
      d.createObjectStore('history');
    },
  }));

const kvGet = async <T>(key: string) => (await (await db()).get('kv', key)) as T | undefined;
const kvSet = async (key: string, value: unknown) => (await db()).put('kv', value, key);

export const store = {
  getSession: () => kvGet<Session>('session'),
  setSession: (s: Session) => kvSet('session', s),
  getPrefs: () => kvGet<AlertPrefs>('prefs'),
  setPrefs: (p: AlertPrefs) => kvSet('prefs', p),
  getDevices: () => kvGet<CloudDevice[]>('devices'),
  setDevices: (d: CloudDevice[]) => kvSet('devices', d),
  getNames: () => kvGet<Record<string, string>>('names'),
  setNames: (n: Record<string, string>) => kvSet('names', n),
  getSelected: () => kvGet<string>('selected'),
  setSelected: (id: string) => kvSet('selected', id),

  async getAllLive() {
    return (await (await db()).getAll('live')) as LiveData[];
  },
  putLive: async (l: LiveData) => (await db()).put('live', l, l.deviceId),
  getSamples: async (id: string) => ((await (await db()).get('history', id)) ?? []) as Sample[],
  putSamples: async (id: string, s: Sample[]) => (await db()).put('history', s, id),

  async clearAll() {
    const d = await db();
    await Promise.all([d.clear('kv'), d.clear('live'), d.clear('history')]);
  },
};

// Earlier builds (demo simulator, DessMonitor client) used these databases.
try {
  indexedDB.deleteDatabase('must-monitor');
  indexedDB.deleteDatabase('must-cloud');
} catch {
  /* private mode */
}

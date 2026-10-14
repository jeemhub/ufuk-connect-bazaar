import { openDB, type IDBPDatabase } from 'idb';
import {HISTORY_DAYS} from './history';
import type { AlertPrefs, ControlLog, CloudDevice, LiveData, Sample, Session } from '../types';

// Everything stays in this phone's IndexedDB: the cloud session (token + password hash,
// never the plain password), the device list, and the last readings for offline viewing.

interface Schema {
  kv: { key: string; value: unknown };
  live: { key: string; value: LiveData };
  history: { key: string; value: Sample[] };
}

let dbp: Promise<IDBPDatabase<Schema>> | null = null;
const db = () =>
  (dbp ??= openDB<Schema>('must-valuecloud', 2, {
    upgrade(d,oldVersion,_,tx) {
      if(oldVersion<1){d.createObjectStore('kv');d.createObjectStore('live');d.createObjectStore('history');}
      const readings=d.createObjectStore('readings',{keyPath:['deviceId','ts']});
      readings.createIndex('deviceId','deviceId');
      const history=tx.objectStore('history');
      history.openCursor().then(function migrate(cursor){
        if(!cursor)return;
        for(const sample of cursor.value as Sample[])readings.put({...sample,deviceId:String(cursor.key)});
        return cursor.continue().then(migrate);
      });
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
  getSamples: async (id: string) => (await (await db()).getAllFromIndex('readings','deviceId',id)) as Sample[],
  async appendSample(id:string,sample:Sample){
    const d=await db();const tx=d.transaction('readings','readwrite');
    const store=tx.objectStore('readings');
    const last=await store.openCursor(IDBKeyRange.bound([id,0],[id,Number.MAX_SAFE_INTEGER]),'prev');
    const previous=last?.value as Sample|undefined;
    const changed=previous&&(previous.gridConnected!==sample.gridConnected||JSON.stringify(previous.faults)!==JSON.stringify(sample.faults));
    if(previous&&(sample.ts<=previous.ts||(sample.ts-previous.ts<60000&&!changed))){await tx.done;return false;}
    await store.put({...sample,deviceId:id});
    // Prune only this device, once per hour instead of rewriting its entire history per poll.
    if(!last||Math.floor(sample.ts/3600000)!==Math.floor((last.value as Sample).ts/3600000)){
      let cursor=await store.openCursor(IDBKeyRange.bound([id,0],[id,sample.ts-HISTORY_DAYS*86400000]));
      while(cursor){await cursor.delete();cursor=await cursor.continue();}
    }
    await tx.done;return true;
  },

  getControlLogs: async(id:string)=>(await kvGet<ControlLog[]>(`control-logs:${id}`))??[],
  async recordControl(id:string,event:ControlLog){
    const tx=(await db()).transaction('kv','readwrite');const kv=tx.objectStore('kv');const key=`control-logs:${id}`;
    const prev=(await kv.get(key)??[]) as ControlLog[];await kv.put([...prev.filter(e=>e.ts>event.ts-HISTORY_DAYS*86400000),event].slice(-2000),key);await tx.done;
  },
  async clearAll() {
    const d = await db();
    await Promise.all([d.clear('kv'), d.clear('live'), d.clear('history'), d.clear('readings')]);
  },
};

// Earlier builds (demo simulator, DessMonitor client) used these databases.
try {
  indexedDB.deleteDatabase('must-monitor');
  indexedDB.deleteDatabase('must-cloud');
} catch {
  /* private mode */
}

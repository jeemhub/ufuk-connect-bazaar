/* eslint-disable @typescript-eslint/no-explicit-any -- SmartValue responses are untyped vendor JSON whose shape varies by model; every field is validated as it is read. */
import type { CloudDevice, CtrlField, CtrlGroup, Point, Session } from '../types';

// Client for ValueCloud — the backend of the official SmartValue app (com.eybond.smartvalue).
// Endpoints, headers and signing follow the SmartValue client as documented by
// groove-max/ha-eybond-local (valuecloud_cloud.py):
//   login:   POST ppr/app/login/pub/login  {account, password: sha1(password), project: "IOT"}
//   signed:  headers token, Auth, sign = HMAC-SHA256(secret, "/" + path)
// api.valueclouds.com serves HTTPS with permissive CORS, so the phone calls it directly.

const BASE = 'https://api.valueclouds.com/';
const PROJECT = 'IOT';
const APP_VERSION = '2.28.1.1';

export class CloudError extends Error {
  constructor(
    message: string,
    public code?: number,
  ) {
    super(message);
  }
}

/** Last raw responses per endpoint, shown in Settings → diagnostics when a model's data looks off. */
export const diagnostics = new Map<string, { at: number; body: unknown }>();

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
export const sha1 = async (s: string) => hex(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s)));
async function hmacSha256(secret: string, msg: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg)));
}

interface Envelope {
  code?: number | string;
  success?: boolean;
  message?: string;
  errorMessage?: string;
  data?: any;
}

async function http(method: 'GET' | 'POST', path: string, opts: { query?: Record<string, unknown>; body?: unknown; session?: Session }) {
  const qs = new URLSearchParams(
    Object.entries(opts.query ?? {})
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json; charset=utf-8',
    i18n: 'en_US',
    version: `android;${APP_VERSION}`,
    project: PROJECT,
    token: opts.session?.token ?? '',
    Auth: opts.session?.auth ?? '',
    sign: opts.session ? await hmacSha256(opts.session.secret, '/' + path) : '',
  };

  let res: Response;
  try {
    res = await fetch(BASE + path + (qs ? `?${qs}` : ''), {
      method,
      headers,
      body: method === 'POST' ? JSON.stringify(opts.body ?? {}) : undefined,
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new CloudError('تعذّر الوصول إلى سحابة SmartValue — تحقق من الإنترنت');
  }
  const env: Envelope | null = await res.json().catch(() => null);
  if (path !== LOGIN) diagnostics.set(path.split('/').pop()!, { at: Date.now(), body: env });
  if (!env) throw new CloudError(`رد غير مفهوم من السحابة (HTTP ${res.status})`, res.status);
  const ok = env.success === true || Number(env.code) === 0 || Number(env.code) === 200;
  if (!ok) throw new CloudError(env.message || env.errorMessage || `خطأ ${env.code ?? res.status}`, Number(env.code ?? res.status));
  return env.data;
}

const LOGIN = 'ppr/app/login/pub/login';

async function authenticate(account: string, pwdSha1: string): Promise<Session> {
  let data: any;
  try {
    data = await http('POST', LOGIN, { body: { account, password: pwdSha1, project: PROJECT } });
  } catch (e) {
    if (e instanceof CloudError && e.code === 115140) throw new CloudError('اسم المستخدم أو كلمة المرور غير صحيحة', e.code);
    throw e;
  }
  if (!data?.token || !data?.secret) throw new CloudError('رد تسجيل الدخول غير مكتمل');
  return {
    account,
    pwdSha1,
    token: String(data.token),
    secret: String(data.secret),
    auth: String(data.auth ?? ''),
    userId: String(data.userId ?? data.uid ?? ''),
  };
}

export async function login(account: string, password: string) {
  return authenticate(account.trim(), await sha1(password));
}

const str = (v: unknown) => (v == null ? '' : String(v).trim());
const numOrNull = (v: unknown) => {
  const n = Number(v);
  return v === '' || v == null || !Number.isFinite(n) ? null : n;
};

/** item / enumMap arrive as {"0":"Off"} or [{key,val}] — normalize both. */
function optionsOf(raw: any): CtrlField['options'] {
  const src = raw?.item ?? raw?.enumMap;
  if (!src) return undefined;
  if (Array.isArray(src)) {
    const o = src.map((i: any) => ({ key: str(i.key ?? i.value ?? i.id), val: str(i.val ?? i.name ?? i.label) })).filter((i) => i.key !== '');
    return o.length ? o : undefined;
  }
  if (typeof src === 'object') {
    const o = Object.entries(src).map(([key, val]) => ({ key, val: str(val) }));
    return o.length ? o : undefined;
  }
  return undefined;
}

export class CloudClient {
  constructor(
    private session: Session,
    private onSession: (s: Session) => void,
  ) {}

  private async call(method: 'GET' | 'POST', path: string, opts: { query?: Record<string, unknown>; body?: unknown } = {}, retried = false): Promise<any> {
    try {
      return await http(method, path, { ...opts, session: this.session });
    } catch (e) {
      // Session expired → log in again with the stored password hash, once.
      const authFail = e instanceof CloudError && (e.code === 401 || e.code === 403 || /token|login|expire|auth|sign|登录/i.test(e.message));
      if (!retried && authFail) {
        this.session = await authenticate(this.session.account, this.session.pwdSha1);
        this.onSession(this.session);
        return this.call(method, path, opts, true);
      }
      throw e;
    }
  }

  async listDevices(): Promise<CloudDevice[]> {
    const out: CloudDevice[] = [];
    for (let page = 1; page <= 20; page++) {
      const data = await this.call('GET', 'dev/api/auth/app/dev/listTDeviceInfo', { query: { page, pageSize: 50 } });
      const items: any[] = data?.items ?? data?.device ?? data?.list ?? [];
      for (const it of items) {
        const pn = str(it.pn);
        const sn = str(it.sn ?? it.deviceSn ?? it.deviceSN) || pn;
        if (!pn) continue;
        out.push({
          id: `${pn}:${sn}:${it.devcode}:${it.devaddr}`,
          pn,
          sn,
          devcode: Number(it.devcode),
          devaddr: Number(it.devaddr),
          alias: str(it.devalias || it.deviceName || it.devName || pn),
          plant: str(it.plantName ?? it.productName ?? ''),
          online: it.deviceOnlineStatus == null ? null : [1, '1', true, 'online', 'ONLINE'].includes(it.deviceOnlineStatus),
          role: numOrNull(it.role) ?? 0,
        });
      }
      const total = Number(data?.total ?? 0);
      if (items.length < 50 || out.length >= total) break;
    }
    return out;
  }

  private ident(d: CloudDevice) {
    return { pn: d.pn, sn: d.sn, devcode: d.devcode, devaddr: d.devaddr };
  }

  /** Live values, flattened from SmartValue's sectioned `pars` (gd_ grid, pv_, bt_ battery, bc_ load, sy_ system…). */
  async lastData(d: CloudDevice): Promise<Point[]> {
    const data = await this.call('GET', 'ppe/api/auth/app/querySPDeviceLastData', { query: this.ident(d) });
    const points: Point[] = [];
    const pars = data?.pars;
    if (pars && typeof pars === 'object') {
      for (const [section, items] of Object.entries(pars)) {
        if (!Array.isArray(items)) continue;
        for (const it of items as any[]) {
          const title = str(it.par ?? it.name ?? it.title ?? it.id);
          if (!title) continue;
          points.push({ title, val: str(it.val ?? it.displayValue), unit: str(it.unit) || undefined, section });
        }
      }
    }
    return points;
  }

  /**
   * Control groups exactly as SmartValue shows them. Tries the grouped "batch control" API first,
   * then the legacy per-field control API. Response shapes vary by model/account, so fields are
   * located structurally rather than by a fixed path. `tried` lists what each endpoint returned.
   */
  async controlGroups(d: CloudDevice): Promise<{ groups: CtrlGroup[]; tried: string[] }> {
    const tried: string[] = [];
    const roles = [...new Set([d.role ?? 0, 0, 1])];

    for (const role of roles) {
      try {
        const data = await this.call('GET', 'ppe/api/auth/web/batch/control/item/readBulkControl', { query: { ...this.ident(d), role } });
        const groups = extractGroups(data, 'batch');
        tried.push(`readBulkControl(role=${role}): ${groups.length ? `${groups.length} مجموعة` : describe(data)}`);
        if (groups.length) return { groups, tried };
      } catch (e) {
        tried.push(`readBulkControl(role=${role}): ${(e as Error).message}`);
      }
    }

    const legacy: CtrlField[] = [];
    const seen = new Set<string>();
    for (const [path, extra] of [
      ['ppe/api/auth/web/queryDeviceCtrlStrategy', { role: d.role ?? 0 }],
      ['ppe/api/auth/web/queryDeviceCtrl', {}],
    ] as const) {
      try {
        const data = await this.call('GET', path, { query: { ...this.ident(d), ...extra } });
        const fields = extractGroups(data, 'legacy').flatMap((g) => g.fields);
        tried.push(`${path.split('/').pop()}: ${fields.length ? `${fields.length} إعداد` : describe(data)}`);
        for (const f of fields) {
          if (seen.has(f.id)) continue;
          seen.add(f.id);
          legacy.push(f);
        }
      } catch (e) {
        tried.push(`${path.split('/').pop()}: ${(e as Error).message}`);
      }
    }
    if (legacy.length) return { groups: groupLegacy(legacy), tried };
    return { groups: [], tried };
  }

  /** 🔍 — ask the inverter (through the datalogger) for current values of some fields in one group. */
  async readValues(d: CloudDevice, group: CtrlGroup, fields: CtrlField[]): Promise<Record<string, string>> {
    if (group.mode === 'legacy') {
      const out: Record<string, string> = {};
      for (const f of fields) {
        const data = await this.call('GET', 'ppe/api/auth/web/queryCtrlFieldKey', { query: { ...this.ident(d), id: f.id, datatype: f.datatype } });
        const v = pickValue(data, f.id);
        if (v != null) out[f.id] = v;
      }
      return out;
    }
    const data = await this.call('POST', 'ppe/api/auth/web/batch/control/item/readAll', {
      body: {
        ...this.ident(d),
        controlItemId: group.controlItemId,
        ids: fields.map((f) => ({ id: f.id, detailsId: f.detailsId, order: f.order })),
      },
    });
    const out: Record<string, string> = {};
    for (const f of fields) {
      const v = pickValue(data, f.id, fields.length === 1);
      if (v != null) out[f.id] = v;
    }
    return out;
  }

  async setValue(d: CloudDevice, group: CtrlGroup, field: CtrlField, val: string): Promise<void> {
    if (group.mode === 'legacy') {
      await this.call('GET', 'ppe/api/auth/web/ctrlDevice', { query: { ...this.ident(d), id: field.id, val, datatype: field.datatype } });
      return;
    }
    await this.call('POST', 'ppe/api/auth/web/batch/control/item/setUp', {
      body: {
        ...this.ident(d),
        controlItemId: group.controlItemId,
        ids: [{ id: field.id, detailsId: field.detailsId, order: field.order, val }],
      },
    });
  }
}

// ── Structural parsing helpers ────────────────────────────────────────────────

const describe = (data: unknown) => {
  if (data == null) return 'فارغ';
  if (Array.isArray(data)) return `قائمة فارغة (${data.length})`;
  if (typeof data === 'object') return `مفاتيح: ${Object.keys(data as object).slice(0, 8).join(', ') || 'لا شيء'}`;
  return String(data).slice(0, 60);
};

const looksLikeField = (o: any) =>
  o && typeof o === 'object' && !Array.isArray(o) && o.id != null && (o.name != null || o.title != null || o.par != null || o.detailsId != null);

function toField(p: any): CtrlField {
  return {
    id: str(p.id),
    detailsId: p.detailsId,
    order: p.order,
    datatype: p.datatype ?? p.dateType,
    name: str(p.name ?? p.title ?? p.par ?? p.id),
    unit: str(p.unit) || undefined,
    hint: str(p.hint) || undefined,
    options: optionsOf(p),
    min: numOrNull(p.minimum ?? p.min),
    max: numOrNull(p.maximum ?? p.max),
    readOnly: /^(r|ro|read|readonly|read_only)$/i.test(str(p.readwrite)),
    initial: p.val != null && p.val !== '' ? str(p.val) : p.displayValue != null && p.displayValue !== '' ? str(p.displayValue) : undefined,
  };
}

/** Finds every array of field-like objects anywhere in the response; its parent object is the group. */
function extractGroups(data: unknown, mode: CtrlGroup['mode']): CtrlGroup[] {
  const groups: CtrlGroup[] = [];
  const visit = (node: any, parent: any, depth: number) => {
    if (depth > 6 || node == null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      const fieldLike = node.filter(looksLikeField);
      // An array of groups (objects that themselves contain field arrays) is not a field list.
      const containsNested = node.some((x) => x && typeof x === 'object' && Object.values(x).some((v) => Array.isArray(v) && v.some(looksLikeField)));
      if (fieldLike.length && fieldLike.length >= node.length / 2 && !containsNested) {
        const owner = parent && !Array.isArray(parent) ? parent : {};
        const controlItemId = owner.controlItemId ?? owner.id ?? fieldLike[0].controlItemId;
        groups.push({
          id: `${mode}:${controlItemId ?? groups.length}`,
          mode,
          controlItemId,
          name: str(owner.name ?? owner.title ?? owner.controlItemName ?? owner.groupName) || 'الإعدادات',
          fields: fieldLike.map(toField),
        });
        return;
      }
      for (const x of node) visit(x, node, depth + 1);
      return;
    }
    for (const v of Object.values(node)) visit(v, node, depth + 1);
  };
  visit(data, null, 0);
  // Same group id twice (e.g. duplicated wrappers) → keep the first.
  const seen = new Set<string>();
  return groups.filter((g) => g.fields.length && !seen.has(g.id) && seen.add(g.id));
}

/** Legacy fields are flat — group them like SmartValue's tabs by name. */
function groupLegacy(fields: CtrlField[]): CtrlGroup[] {
  const buckets: [string, RegExp][] = [
    ['ON-OFF', /enable|switch|on\s*\/\s*off|buzzer|backlight|beep|restart|bypass|overload|record/i],
    ['Battery settings', /batt|equaliz|float|bulk|absorb|lithium|\bsoc\b|cut.?off/i],
    ['Mode Settings', /priority|mode|source|aim|utility|mains|charger|charging/i],
  ];
  const out = new Map<string, CtrlField[]>();
  for (const f of fields) {
    const name = buckets.find(([, re]) => re.test(f.name))?.[0] ?? 'Inverter settings';
    out.set(name, [...(out.get(name) ?? []), f]);
  }
  return [...out.entries()].map(([name, fs]) => ({ id: `legacy:${name}`, mode: 'legacy' as const, controlItemId: null, name, fields: fs }));
}

/** Pulls one field's value out of readAll / queryCtrlFieldKey responses of varying shape. */
function pickValue(data: any, id: string, single = false): string | undefined {
  const valOf = (o: any) => {
    const v = o?.val ?? o?.value ?? o?.displayValue ?? o?.key;
    return v == null || v === '' ? undefined : str(v);
  };
  let found: string | undefined;
  const visit = (node: any, depth: number) => {
    if (found != null || depth > 6 || node == null || typeof node !== 'object') return;
    if (!Array.isArray(node)) {
      if (str(node.id) === id && valOf(node) != null) return void (found = valOf(node));
      if (node[id] != null && typeof node[id] !== 'object') return void (found = str(node[id]));
    }
    for (const v of Object.values(node)) visit(v, depth + 1);
  };
  visit(data, 0);
  if (found == null && single) {
    if (data != null && typeof data !== 'object') found = str(data);
    else found = valOf(data);
  }
  return found;
}

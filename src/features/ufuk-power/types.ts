/** One value reported by the inverter through the Eybond cloud (queryDeviceLastData). */
export interface Point {
  title: string;
  val: string;
  unit?: string;
  /** SmartValue section prefix, e.g. gd_ (grid), pv_, bt_ (battery), bc_ (load), sy_ (system). */
  section?: string;
}

/** An inverter as registered in the user's SmartValue account. */
export interface CloudDevice {
  /** `${pn}:${sn}:${devcode}:${devaddr}` */
  id: string;
  pn: string;
  sn: string;
  devcode: number;
  devaddr: number;
  alias: string;
  plant: string;
  online: boolean | null;
  role: number;
}

export interface LiveData {
  deviceId: string;
  fetchedAt: number;
  points: Point[];
}

/** One sample recorded by this app from its own polls (SmartValue exposes no history endpoint we can rely on). */
export interface Sample {
  ts: number;
  pv: number | null;
  load: number | null;
  battV: number | null;
  battP: number | null;
}

export interface CtrlField {
  id: string;
  detailsId?: unknown;
  order?: unknown;
  datatype?: unknown;
  name: string;
  unit?: string;
  hint?: string;
  options?: { key: string; val: string }[];
  min: number | null;
  max: number | null;
  readOnly: boolean;
  initial?: string;
}

/** A settings tab exactly as SmartValue groups them (ON-OFF, Mode Settings, Battery settings…). */
export interface CtrlGroup {
  id: string;
  /** batch = SmartValue's grouped control (readAll/setUp); legacy = per-field (queryCtrlFieldKey/ctrlDevice). */
  mode: 'batch' | 'legacy';
  controlItemId: unknown;
  name: string;
  fields: CtrlField[];
}

export interface Session {
  account: string;
  /** SHA-1 of the password — what SmartValue itself sends; the plain password is never stored. */
  pwdSha1: string;
  token: string;
  secret: string;
  auth: string;
  userId: string;
}

export interface AlertPrefs {
  lowBatteryVoltage: number;
  notifyGridLoss: boolean;
  notifyErrors: boolean;
  systemNotifications: boolean;
  batteryAh: number;
}

export const DEFAULT_PREFS: AlertPrefs = {
  lowBatteryVoltage: 47,
  notifyGridLoss: true,
  notifyErrors: true,
  systemNotifications: false,
  batteryAh: 200,
};

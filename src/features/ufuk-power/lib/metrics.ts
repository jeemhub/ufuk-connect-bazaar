import type { Point } from '../types';

// Field titles differ between datalogger protocols (devcode): e.g. "Battery Voltage" vs
// "batteryVoltage", "work state" vs "Working State". Tiles pick the first matching title;
// the dashboard also lists every raw point, so nothing the inverter reports is hidden.

type Matcher = RegExp[];

const M = {
  pvPower: [/^pv\s*total\s*power/i, /^pv1?\s*input\s*power/i, /^p\s*pv$/i, /pv.*power/i, /charger\s*power/i],
  pvVoltage: [/^pv1?\s*(input\s*)?voltage/i, /pv.*volt/i],
  battVoltage: [/^batt(ery)?\s*voltage$/i, /^battery\s*voltage/i, /batt.*volt/i],
  battCurrent: [/^batt(ery)?\s*current/i],
  battChargeCurrent: [/battery\s*charging\s*current/i],
  battDischargeCurrent: [/battery\s*discharg\w*\s*current/i],
  battPower: [/^batt(ery)?\s*power/i],
  soc: [/battery\s*capacity/i, /\bsoc\b/i, /battery\s*percent/i],
  loadPower: [/output\s*active\s*power/i, /^p\s*load/i, /load\s*(active\s*)?power/i, /^ac\s*output\s*power/i],
  loadCurrent: [/^output\s*current/i, /^load\s*current/i, /^ac\s*output\s*current/i, /^i\s*load/i, /output.*current/i, /load.*current/i, /bc.*current/i],
  loadPercent: [/^(ac\s*)?output\s*load$/i, /load\s*(percent|percentage|rate|ratio|%)/i],
  gridVoltage: [/^grid\s*voltage/i, /^ac\s*input\s*voltage/i],
  gridFrequency: [/^grid\s*freq/i, /^ac\s*input\s*freq/i],
  gridPower: [/^p\s*grid/i, /^grid\s*power/i],
  outputVoltage: [/^output\s*voltage/i, /^inverter\s*voltage/i, /^ac\s*output\s*voltage/i],
  workState: [/work(ing)?\s*state/i, /operating\s*mode/i, /work\s*mode/i],
  chargingState: [/charging\s*state/i, /charger\s*work\s*state/i],
  temperature: [/radiator\s*temp/i, /temperature/i, /temp/i],
  gridRelay: [/grid\s*relay/i],
} satisfies Record<string, Matcher>;

export type MetricKey = keyof typeof M;

const SECTION: Record<string, string> = { gd_: 'grid', pv_: 'pv', bt_: 'battery', bc_: 'load', sy_: 'system', dc_: 'dc' };
/** SmartValue titles can be generic ("Voltage") inside a section, so also match "<section> <title>". */
const labelOf = (p: Point) => (p.section && SECTION[p.section] ? `${SECTION[p.section]} ${p.title}` : p.title);

export function find(points: Point[], key: MetricKey): Point | undefined {
  for (const re of M[key]) {
    const p = points.find((x) => re.test(x.title)) ?? points.find((x) => re.test(labelOf(x)));
    if (p) return p;
  }
  return undefined;
}

export const num = (p?: Point): number | null => {
  if (!p) return null;
  const n = parseFloat(String(p.val).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
};

export interface Summary {
  pvPower: number | null;
  pvVoltage: number | null;
  battVoltage: number | null;
  /** + charging, − discharging (W) */
  battPower: number | null;
  battCurrent: number | null;
  soc: number | null;
  loadPower: number | null;
  loadCurrent: number | null;
  loadPercent: number | null;
  gridVoltage: number | null;
  gridFrequency: number | null;
  gridPower: number | null;
  /** null when the inverter reports nothing that tells us */
  gridConnected: boolean | null;
  outputVoltage: number | null;
  workState: string | null;
  chargingState: string | null;
  temperature: number | null;
  faults: Point[];
}

const BAD_FAULT_VALUES = /^(|0|none|null|no|normal|--|nan|0x0+|ok)$/i;

export function summarize(points: Point[]): Summary {
  const g = (k: MetricKey) => num(find(points, k));

  let battPower = g('battPower');
  const battVoltage = g('battVoltage');
  let battCurrent = g('battCurrent');
  if (battCurrent == null) {
    const c = g('battChargeCurrent');
    const dc = g('battDischargeCurrent');
    if (c != null || dc != null) battCurrent = (c ?? 0) - (dc ?? 0);
  }
  if (battPower == null && battCurrent != null && battVoltage != null) battPower = Math.round(battCurrent * battVoltage);

  const gridVoltage = g('gridVoltage');
  const relay = find(points, 'gridRelay')?.val;
  const gridConnected = relay ? /connect/i.test(relay) && !/dis/i.test(relay) : gridVoltage == null ? null : gridVoltage > 90;

  let loadPower = g('loadPower');
  let loadCurrent = g('loadCurrent');
  const gridPower = g('gridPower');
  const outputVoltage = g('outputVoltage') ?? gridVoltage ?? 230;

  // If connected to national grid and loadPower reports 0/null (common in MUST line-bypass mode),
  // estimate load from grid power minus battery charging power
  if (gridConnected) {
    if ((loadPower == null || loadPower === 0) && gridPower != null && gridPower > 0) {
      const charPower = (battPower && battPower > 0) ? battPower : 0;
      const estimatedLoad = Math.max(0, gridPower - charPower);
      if (estimatedLoad > 0) {
        loadPower = estimatedLoad;
      }
    }
  }

  // Deduce loadCurrent in Amperes (A) if missing from inverter telemetry
  if (loadCurrent == null && loadPower != null && outputVoltage > 0) {
    loadCurrent = Number((loadPower / outputVoltage).toFixed(1));
  } else if (loadPower == null && loadCurrent != null && outputVoltage > 0) {
    loadPower = Math.round(loadCurrent * outputVoltage);
  }

  const faults = points.filter((p) => /(fault|error|warning|alarm)/i.test(p.title) && !BAD_FAULT_VALUES.test(p.val.trim()));

  return {
    pvPower: g('pvPower'),
    pvVoltage: g('pvVoltage'),
    battVoltage,
    battPower,
    battCurrent,
    soc: g('soc'),
    loadPower,
    loadCurrent,
    loadPercent: g('loadPercent') ?? num(points.find((p) => p.unit === '%' && /load/i.test(labelOf(p)))),
    gridVoltage,
    gridFrequency: g('gridFrequency'),
    gridPower,
    gridConnected,
    outputVoltage: g('outputVoltage'),
    workState: find(points, 'workState')?.val ?? null,
    chargingState: find(points, 'chargingState')?.val ?? null,
    temperature: g('temperature'),
    faults,
  };
}

/**
 * Engineering calculation for remaining battery runtime down to 15% SoC.
 */
export function calculateRemainingTimeMinutes({
  soc,
  battVoltage,
  loadPower,
  battPower,
  batteryAh = 200,
}: {
  soc: number | null;
  battVoltage: number | null;
  loadPower: number | null;
  battPower: number | null;
  batteryAh?: number;
}): number | null {
  if (soc == null || soc <= 15) return 0;

  const usableSocPct = (soc - 15) / 100;
  const vSys = battVoltage ?? (batteryAh >= 100 ? 48 : 24);
  const totalWh = batteryAh * vSys;
  const usableWh = totalWh * usableSocPct;

  let dischargeWatts = 0;
  if (battPower != null && battPower < -5) {
    dischargeWatts = Math.abs(battPower);
  } else if (loadPower != null && loadPower > 5) {
    dischargeWatts = loadPower / 0.92;
  }

  if (dischargeWatts <= 0) return null;

  const hours = usableWh / dischargeWatts;
  return Math.max(0, Math.round(hours * 60));
}

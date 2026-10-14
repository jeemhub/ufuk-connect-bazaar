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

/** Resolve the whole array, rather than treating the first MPPT input as the total. */
export function solarPowerWatts(points: Point[]): number | null {
  const label = (point: Point) => labelOf(point).replace(/\b(PV|MPPT)(?=[A-Z0-9])/g, '$1 ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
  const watts = (point: Point): number | null => {
    const value = num(point);
    if (value == null || value < 0) return null;
    const unit = (point.unit || String(point.val).match(/(?:kW|W)\s*$/i)?.[0] || 'W').trim().toLowerCase();
    return unit === 'kw' ? value * 1000 : unit === 'w' ? value : null;
  };
  const isPower = (text: string) => /\bpower\b/.test(text) && !/\b(max|maximum|rated|rating|limit|energy|daily|yield)\b/.test(text);
  const pvPoints = points.filter(point => /\b(pv|solar|photovoltaic|mppt)\s*\d*\b/.test(label(point)) && isPower(label(point)));
  // Explicit aggregate beats every channel and must not be added to those channels again.
  const total = pvPoints.find(point => /\b(total|combined|aggregate)\b/.test(label(point)) && watts(point) != null);
  if (total) return watts(total);
  const channels = new Map<string, Point>();
  for (const point of pvPoints) {
    const match = label(point).match(/\b(?:pv|mppt|solar)\s*(\d+)\b/);
    if (!match) continue;
    const previous = channels.get(match[1]);
    if (!previous || (watts(previous) == null && watts(point) != null)) channels.set(match[1], point);
  }
  if (channels.size) {
    const values = [...channels.values()].map(watts);
    // An unreadable channel is not zero: don't present a partial sum as the total.
    return values.some(value => value == null) ? null : values.reduce<number>((sum, value) => sum + value!, 0);
  }
  const single = pvPoints.find(point => watts(point) != null);
  if (single) return watts(single);
  // Compatibility for a protocol with one explicitly named P PV point.
  const compact = points.find(point => /^p\s*pv$/i.test(point.title.trim()));
  return compact ? watts(compact) : null;
}

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
    pvPower: solarPowerWatts(points),
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

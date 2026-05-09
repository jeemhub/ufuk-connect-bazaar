export type ConnectionType = "single" | "series" | "parallel" | "series-parallel";
export type BatteryChemistry = "lead" | "lithium";

export interface SolarInput {
  inverterPowerW: number;
  inverterVoltage: 12 | 24 | 36 | 48;
  batteryCount: number;
  batteryVoltage: 2 | 6 | 12 | 24;
  batteryAh: number;
  connection: ConnectionType;
  rows?: number; // for series-parallel: series count (rows)
  cols?: number; // for series-parallel: parallel count (cols)
  loadAmps: number;
  chemistry?: BatteryChemistry;
}

export interface SolarResult {
  bankVoltage: number;
  bankAh: number;
  bankWh: number;
  usableWh: number;
  loadWatts: number;
  runtimeHours: number;
  runtimeH: number;
  runtimeM: number;
  status: "ok" | "warn" | "error";
  checks: { label: string; ok: boolean; level: "ok" | "warn" | "error"; detail?: string }[];
}

export function computeBank(input: SolarInput): { bankVoltage: number; bankAh: number } {
  const { batteryVoltage, batteryAh, batteryCount, connection, rows = 1, cols = 1 } = input;
  switch (connection) {
    case "single":
      return { bankVoltage: batteryVoltage, bankAh: batteryAh };
    case "series":
      return { bankVoltage: batteryVoltage * batteryCount, bankAh: batteryAh };
    case "parallel":
      return { bankVoltage: batteryVoltage, bankAh: batteryAh * batteryCount };
    case "series-parallel":
      return { bankVoltage: batteryVoltage * rows, bankAh: batteryAh * cols };
  }
}

export function calcSolar(input: SolarInput): SolarResult {
  const { bankVoltage, bankAh } = computeBank(input);
  const bankWh = bankVoltage * bankAh;
  const dod = (input.chemistry ?? "lead") === "lithium" ? 0.9 : 0.8;
  const usableWh = bankWh * dod;

  // الحمل دائماً على 220 فولت AC
  const AC_VOLTAGE = 220;
  const loadWatts = input.loadAmps * AC_VOLTAGE;

  let runtimeHours = loadWatts > 0 ? usableWh / loadWatts : 0;
  // Peukert simplified: discharge rate > 0.1C
  const dischargeRateC = bankAh > 0 ? input.loadAmps / bankAh : 0;
  if (dischargeRateC > 0.1) runtimeHours *= 0.85;

  const runtimeH = Math.floor(runtimeHours);
  const runtimeM = Math.round((runtimeHours - runtimeH) * 60);

  const checks: SolarResult["checks"] = [];

  // 1. Voltage match
  const vMatch = bankVoltage === input.inverterVoltage;
  checks.push({
    label: `مطابقة فولطية البنك (${bankVoltage}V) مع العاكس (${input.inverterVoltage}V)`,
    ok: vMatch,
    level: vMatch ? "ok" : "error",
    detail: vMatch ? undefined : "يجب أن تتطابق فولطية بنك البطاريات مع نظام فولطية العاكس وإلا قد يتلف العاكس.",
  });

  // 2. Inverter sizing vs battery bank
  const fiveHourPower = bankWh * 0.2; // 5h discharge
  const halfBankPower = bankWh * 0.5;
  let invLevel: "ok" | "warn" | "error" = "ok";
  let invDetail: string | undefined;
  if (input.inverterPowerW > halfBankPower) {
    invLevel = "error";
    invDetail = "قدرة العاكس كبيرة جداً مقارنة ببنك البطاريات (تفريغ سريع جداً).";
  } else if (input.inverterPowerW > fiveHourPower) {
    invLevel = "warn";
    invDetail = "قدرة العاكس أعلى من معدل التفريغ المثالي (5 ساعات). البطاريات قد تستهلك بسرعة.";
  }
  checks.push({
    label: `ملاءمة قدرة العاكس (${input.inverterPowerW}W) لسعة البنك (${Math.round(bankWh)}Wh)`,
    ok: invLevel === "ok",
    level: invLevel,
    detail: invDetail,
  });

  // 3. Load within inverter
  const loadOk = loadWatts > 0 && loadWatts < input.inverterPowerW;
  checks.push({
    label: `الحمل (${Math.round(loadWatts)}W) ضمن قدرة العاكس (${input.inverterPowerW}W)`,
    ok: loadOk,
    level: loadOk ? "ok" : "error",
    detail: loadOk ? undefined : "الحمل المطلوب يتجاوز قدرة العاكس وقد يتسبب بإيقافه أو تلفه.",
  });

  let status: "ok" | "warn" | "error" = "ok";
  if (checks.some((c) => c.level === "error")) status = "error";
  else if (checks.some((c) => c.level === "warn")) status = "warn";

  return { bankVoltage, bankAh, bankWh, usableWh, loadWatts, runtimeHours, runtimeH, runtimeM, status, checks };
}

export { toLatinDigits } from "@/lib/digits";

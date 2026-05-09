export type ConnectionType = "single" | "series" | "parallel" | "series-parallel";
export type BatteryChemistry = "lead" | "lithium";

export interface BatterySpec {
  voltage: number; // V
  ah: number;      // Ah
}

export interface SolarInput {
  inverterPowerW: number;
  inverterVoltage: 12 | 24 | 36 | 48;
  batteries: BatterySpec[];
  connection: ConnectionType;
  rows?: number; // series count per string (for series-parallel)
  cols?: number; // number of parallel strings (for series-parallel)
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
  recommendations: { title: string; body: string; level: "tip" | "warn" | "critical" }[];
}

interface BankComputation {
  bankVoltage: number;
  bankAh: number;
  warnings: { label: string; detail: string; level: "warn" | "error" }[];
}

export function computeBank(input: SolarInput): BankComputation {
  const { batteries, connection, rows = 1, cols = 1 } = input;
  const warnings: BankComputation["warnings"] = [];
  const list = batteries.filter((b) => b.voltage > 0 && b.ah > 0);

  if (list.length === 0) return { bankVoltage: 0, bankAh: 0, warnings };

  const allSameV = list.every((b) => b.voltage === list[0].voltage);
  const allSameAh = list.every((b) => b.ah === list[0].ah);

  switch (connection) {
    case "single": {
      if (list.length > 1) {
        warnings.push({
          label: "وضع البطارية الواحدة",
          detail: "تم تجاهل البطاريات الإضافية لأن وضع التوصيل = بطارية واحدة.",
          level: "warn",
        });
      }
      return { bankVoltage: list[0].voltage, bankAh: list[0].ah, warnings };
    }
    case "series": {
      const v = list.reduce((s, b) => s + b.voltage, 0);
      const ah = Math.min(...list.map((b) => b.ah));
      if (!allSameAh) {
        warnings.push({
          label: "البطاريات على التوالي يجب أن تكون متساوية بالسعة (Ah)",
          detail: "في التوصيل على التوالي يمر نفس التيار في كل البطاريات، فإن اختلفت السعة ستحدد البطارية الأصغر سعة البنك وقد تتلف الأخرى.",
          level: "warn",
        });
      }
      return { bankVoltage: v, bankAh: ah, warnings };
    }
    case "parallel": {
      const ah = list.reduce((s, b) => s + b.ah, 0);
      if (!allSameV) {
        warnings.push({
          label: "البطاريات على التوازي يجب أن تكون متساوية بالفولطية",
          detail: "ربط بطاريات بفولطيات مختلفة على التوازي يسبب تيارات اندفاع كبيرة وتلف فوري للبطاريات.",
          level: "error",
        });
      }
      return { bankVoltage: list[0].voltage, bankAh: ah, warnings };
    }
    case "series-parallel": {
      const need = rows * cols;
      if (list.length !== need) {
        warnings.push({
          label: `عدد البطاريات (${list.length}) لا يطابق توالي/توازي (${rows}×${cols} = ${need})`,
          detail: "في توالي/توازي يجب أن يكون عدد البطاريات = عدد التوالي × عدد فروع التوازي.",
          level: "error",
        });
      }
      // Group sequentially into `cols` parallel strings of `rows` series batteries
      const stringsV: number[] = [];
      const stringsAh: number[] = [];
      for (let c = 0; c < cols; c++) {
        const slice = list.slice(c * rows, c * rows + rows);
        if (slice.length === 0) continue;
        stringsV.push(slice.reduce((s, b) => s + b.voltage, 0));
        stringsAh.push(Math.min(...slice.map((b) => b.ah)));
      }
      const stringsAllSameV = stringsV.every((v) => v === stringsV[0]);
      if (!stringsAllSameV) {
        warnings.push({
          label: "فروع التوازي يجب أن تكون بنفس الفولطية",
          detail: "كل سلسلة (Series String) يجب أن تعطي نفس الفولطية قبل ربطها على التوازي مع باقي السلاسل.",
          level: "error",
        });
      }
      return {
        bankVoltage: stringsV[0] ?? 0,
        bankAh: stringsAh.reduce((s, a) => s + a, 0),
        warnings,
      };
    }
  }
}

export function calcSolar(input: SolarInput): SolarResult {
  const { bankVoltage, bankAh, warnings } = computeBank(input);
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

  // 0. Battery configuration warnings
  for (const w of warnings) {
    checks.push({ label: w.label, ok: false, level: w.level, detail: w.detail });
  }

  // 1. Voltage match
  const vMatch = bankVoltage === input.inverterVoltage;
  checks.push({
    label: `مطابقة فولطية البنك (${bankVoltage}V) مع العاكس (${input.inverterVoltage}V)`,
    ok: vMatch,
    level: vMatch ? "ok" : "error",
    detail: vMatch ? undefined : "يجب أن تتطابق فولطية بنك البطاريات مع نظام فولطية العاكس وإلا قد يتلف العاكس.",
  });

  // 2. Inverter sizing vs battery bank (C/5 recommended, C/2 advisory limit)
  const recommendedMaxInverter = bankAh * bankVoltage * 0.2; // C/5
  const advisoryMaxInverter = bankAh * bankVoltage * 0.5;    // C/2
  let invLevel: "ok" | "warn" | "error" = "ok";
  let invDetail: string | undefined;
  if (input.inverterPowerW > advisoryMaxInverter) {
    invLevel = "warn";
    invDetail = "العاكس أكبر من الموصى به للبطاريات، لكن المنظومة تعمل إذا كان الحمل الفعلي منخفضاً.";
  } else if (input.inverterPowerW > recommendedMaxInverter) {
    invLevel = "warn";
    invDetail = `قدرة العاكس أعلى من الحد الموصى به (${Math.round(recommendedMaxInverter)}W ≈ C/5)، لكن المنظومة تعمل عند أحمال منخفضة.`;
  }
  checks.push({
    label: `ملاءمة قدرة العاكس (${input.inverterPowerW}W) لبنك البطاريات (موصى به حتى ${Math.round(recommendedMaxInverter)}W)`,
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

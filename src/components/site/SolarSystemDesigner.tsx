import React, { useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Battery, Bolt, CheckCircle2, ChevronLeft, ChevronRight, Download, Sun, TriangleAlert, XCircle, Zap, Leaf, Snowflake, Flame, Sparkles, Building2, Factory, Home as HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

// ───────── Engineering constants
const INVERTER_EFF = 0.90;
const WIRING_LOSS = 0.03;
const DOD = { lithium: 0.80, leadacid: 0.50 } as const;
const TEMP = { summer: 0.80, moderate: 0.90, winter: 0.97 } as const;
const CHARGE_EFF = { lithium: 0.97, leadacid: 0.85 } as const;
const PANEL_WATT = 615;
const PEAK_SUN_HOURS = 5.5;
const PANEL_EFF = 0.80;

// Multi-inverter constants
const MAX_INVERTER_W = 12000;        // Largest single-phase Must inverter
const MAX_PARALLEL_INVERTERS = 6;    // Must PV1900M EXP supports up to 6 in parallel
const PARALLEL_BATT_LIMIT_LP = 15;   // LP3000 PRO supports max 15 units parallel
const INVERTER_MAX_CHARGE_A = 150;   // Must 12kW max DC charge current at 48V
const LI_MODULE_KWH = 5.12;          // Single LP module size

// Charging tier (C-rate) — IEC 61427 / IEEE 1013/1562 / LiFePO4 best practice
type ChargeTier = "economy" | "balanced" | "fast";
const CHARGE_TIERS: Record<"lithium" | "leadacid", Record<ChargeTier, number>> = {
  lithium:  { economy: 0.2, balanced: 0.5, fast: 1.0 },
  leadacid: { economy: 0.1, balanced: 0.15, fast: 0.2 },
};
const MAX_MODULES_PER_INVERTER_LI: Record<ChargeTier, number> = { economy: 7, balanced: 3, fast: 1 };

type SystemType = "battery" | "full";
type BattType = "lithium" | "leadacid";
type Season = "summer" | "moderate" | "winter";

// ───────── Must product database
type LithiumOpt = { model: string; kwh: number; voltage: number; ah: number; maxCurrent: number };
const LITHIUM_OPTIONS: LithiumOpt[] = [
  { model: "Must LP1600 SE — 5kWh", kwh: 5.12, voltage: 48, ah: 100, maxCurrent: 100 },
  { model: "Must LP3000 PRO — 5kWh module", kwh: 5.12, voltage: 48, ah: 100, maxCurrent: 100 },
  { model: "Must LP3000 PRO — 10kWh (2 modules)", kwh: 10.24, voltage: 48, ah: 200, maxCurrent: 200 },
  { model: "Must LP3000 PRO — 15kWh (3 modules)", kwh: 15.36, voltage: 48, ah: 300, maxCurrent: 200 },
];
const LEADACID = { model: "Must 12V/200Ah", voltage: 12, ah: 200, kwh: 12 * 200 / 1000 };

type Inverter = {
  model: string; power: number; voltage: 12 | 24 | 48;
  maxPanels: number; maxPVwatt: number; minBattAh: number;
  mppt?: string; dualMPPT?: boolean; note: string;
};
const INVERTERS: Inverter[] = [
  { model: "Must PV1900 EXP — 1kW", power: 1000, voltage: 12, maxPanels: 1, maxPVwatt: 615, minBattAh: 100, note: "للأحمال الصغيرة جداً" },
  { model: "Must PV1900 EXP — 4kW", power: 4000, voltage: 24, maxPanels: 6, maxPVwatt: 3690, minBattAh: 100, mppt: "90~430V", note: "مناسب للمنازل الصغيرة" },
  { model: "Must PV1900 EXP — 6kW", power: 6000, voltage: 48, maxPanels: 10, maxPVwatt: 6150, minBattAh: 200, mppt: "150~450V", note: "مناسب للمنازل المتوسطة" },
  { model: "Must PV1900M EXP — 8kW", power: 8000, voltage: 48, maxPanels: 14, maxPVwatt: 8000, minBattAh: 200, mppt: "150~450V", dualMPPT: true, note: "مناسب للمنازل الكبيرة" },
  { model: "Must PV1900M EXP — 10kW", power: 10000, voltage: 48, maxPanels: 16, maxPVwatt: 10000, minBattAh: 300, mppt: "150~450V", dualMPPT: true, note: "مناسب للمنشآت التجارية" },
  { model: "Must PV1900M EXP — 12kW Single Phase", power: 12000, voltage: 48, maxPanels: 20, maxPVwatt: 12000, minBattAh: 400, mppt: "150~450V", dualMPPT: true, note: "للمنشآت الكبيرة" },
];
const INVERTER_12K = INVERTERS[INVERTERS.length - 1];

// ───────── Battery selection (scales for any size)
type BatteryConfig = {
  label: "موصى به" | "اقتصادي" | "متميز";
  model: string;
  voltage: number;
  ah: number;
  kwh: number;
  qty: number;
  maxCurrent?: number;
  connection?: string;
};

function pickLithiumConfigs(requiredWh: number): BatteryConfig[] {
  // Use 5kWh module (LP3000 PRO module) as base for the recommended scaled stack.
  const base5 = LITHIUM_OPTIONS[1];   // 5.12kWh module
  const base10 = LITHIUM_OPTIONS[2];  // 10.24kWh unit
  const base15 = LITHIUM_OPTIONS[3];  // 15.36kWh unit

  const qty5 = Math.max(1, Math.ceil(requiredWh / (base5.kwh * 1000)));
  const qty10 = Math.max(1, Math.ceil(requiredWh / (base10.kwh * 1000)));
  const qty15 = Math.max(1, Math.ceil(requiredWh / (base15.kwh * 1000)));

  const recommended: BatteryConfig = {
    label: "موصى به",
    model: base10.model,
    voltage: base10.voltage,
    ah: base10.ah * qty10,
    kwh: base10.kwh * qty10,
    qty: qty10,
    maxCurrent: base10.maxCurrent * qty10,
    connection: qty10 > 1 ? `${qty10} وحدة بالتوازي على 48V` : "—",
  };
  const economy: BatteryConfig = {
    label: "اقتصادي",
    model: base5.model,
    voltage: base5.voltage,
    ah: base5.ah * qty5,
    kwh: base5.kwh * qty5,
    qty: qty5,
    maxCurrent: base5.maxCurrent * qty5,
    connection: qty5 > 1 ? `${qty5} وحدة بالتوازي على 48V` : "—",
  };
  const premium: BatteryConfig = {
    label: "متميز",
    model: base15.model,
    voltage: base15.voltage,
    ah: base15.ah * qty15,
    kwh: base15.kwh * qty15,
    qty: qty15,
    maxCurrent: base15.maxCurrent * qty15,
    connection: qty15 > 1 ? `${qty15} وحدة بالتوازي على 48V` : "—",
  };

  return [recommended, economy, premium];
}

function pickLeadAcidConfig(requiredWh: number, targetVoltage: 12 | 24 | 48): BatteryConfig {
  const seriesCount = targetVoltage / LEADACID.voltage;
  const onePackWh = LEADACID.voltage * LEADACID.ah * seriesCount;
  const parallelStrings = Math.max(1, Math.ceil(requiredWh / onePackWh));
  const totalQty = seriesCount * parallelStrings;
  return {
    label: "موصى به",
    model: LEADACID.model,
    voltage: targetVoltage,
    ah: LEADACID.ah * parallelStrings,
    kwh: (onePackWh * parallelStrings) / 1000,
    qty: totalQty,
    connection: `${seriesCount} على التوالي × ${parallelStrings} توازي`,
  };
}

// ───────── Scale tier
type ScaleTier = {
  key: "small" | "medium" | "large" | "commercial" | "exceeded";
  label: string;
  icon: any;
  desc: string;
};
function scaleTierFor(invCount: number): ScaleTier {
  if (invCount <= 1) return { key: "small", label: "منزلي صغير", icon: HomeIcon, desc: "حتى ~12kW" };
  if (invCount === 2) return { key: "medium", label: "منزلي متوسط", icon: HomeIcon, desc: "حتى ~24kW" };
  if (invCount <= 4) return { key: "large", label: "منزلي كبير", icon: Building2, desc: "حتى ~48kW" };
  if (invCount <= 6) return { key: "commercial", label: "تجاري", icon: Factory, desc: "حتى ~72kW" };
  return { key: "exceeded", label: "يتجاوز حد التوازي", icon: TriangleAlert, desc: "يلزم تصميم خاص ثلاثي الطور" };
}

// ───────── UI helpers
const CARD = "rounded-2xl border border-amber-500/30 bg-white shadow-[0_0_25px_-15px_rgba(245,158,11,0.4)] p-5 text-slate-900";
const STAT = "rounded-xl border border-amber-500/20 bg-amber-50/60 p-4 text-slate-700";

function StepIndicator({ step }: { step: number }) {
  const steps = ["النوع", "الأحمال", "البطاريات", "العاكس والألواح", "النتائج"];
  return (
    <div className="mb-6">
      <Progress dir="ltr" value={(step / 5) * 100} className="h-2 bg-slate-200 [transform:scaleX(-1)] [&>div]:bg-amber-500" />
      <div className="mt-3 flex justify-between text-xs text-slate-500">
        {steps.map((s, i) => (
          <div key={s} className={cn("text-center transition-colors", i + 1 <= step && "text-amber-600 font-bold")}>
            {i + 1}. {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────── Multi-inverter wiring diagram
function MultiInverterDiagram({ count, hasPV, voltage }: { count: number; hasPV: boolean; voltage: number }) {
  const n = Math.max(1, Math.min(count, MAX_PARALLEL_INVERTERS));
  const W = 760;
  const invH = 60;
  const gapY = 14;
  const topPad = hasPV ? 110 : 30;
  const stackH = n * invH + (n - 1) * gapY;
  const H = topPad + stackH + 60;

  const battX = 30, battW = 130, battY = topPad, battH = stackH;
  const invX = 280, invW = 200;
  const acBusX = invX + invW + 50;
  const panelX = acBusX + 60;

  const wires: { d: string; color: string }[] = [];
  // DC bus (battery → each inverter): + (red) top, − (black) bottom
  for (let i = 0; i < n; i++) {
    const y = topPad + i * (invH + gapY) + invH / 2;
    wires.push({ d: `M ${battX + battW} ${y - 10} H ${invX}`, color: "#ef4444" });
    wires.push({ d: `M ${battX + battW} ${y + 10} H ${invX}`, color: "#111827" });
    // AC out (blue) to AC bus
    wires.push({ d: `M ${invX + invW} ${y} H ${acBusX}`, color: "#2563eb" });
  }
  // AC bus vertical
  wires.push({ d: `M ${acBusX} ${topPad} V ${topPad + stackH}`, color: "#2563eb" });
  // AC bus → distribution panel
  wires.push({ d: `M ${acBusX} ${topPad + stackH / 2} H ${acBusX + 50}`, color: "#2563eb" });

  // PV strings into each inverter (from top)
  if (hasPV) {
    for (let i = 0; i < n; i++) {
      const y = topPad + i * (invH + gapY) + 14;
      const x = invX + invW / 2;
      wires.push({ d: `M ${x} 70 V ${y}`, color: "#f59e0b" });
    }
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-amber-500/30 bg-[#F8FAFC] p-4">
      <style>{`@keyframes solar-flow { to { stroke-dashoffset: -20; } }`}</style>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 680 }}>
        <defs>
          <pattern id="sd-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#sd-grid)" />

        {/* Solar array */}
        {hasPV && (
          <g>
            <rect x={invX - 30} y={20} width={invW + 60} height={50} rx={6} fill="#FEF3C7" stroke="#F59E0B" strokeWidth={1.5} />
            <text x={invX + invW / 2} y={50} textAnchor="middle" fontSize="13" fontWeight="700" fill="#b45309">☀ مصفوفة الألواح الشمسية</text>
          </g>
        )}

        {/* Battery bank */}
        <rect x={battX} y={battY} width={battW} height={battH} rx={8} fill="#FEF3C7" stroke="#F59E0B" strokeWidth={2} />
        <text x={battX + battW / 2} y={battY + battH / 2 - 8} textAnchor="middle" fontSize="13" fontWeight="800" fill="#b45309">بنك البطاريات</text>
        <text x={battX + battW / 2} y={battY + battH / 2 + 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="#92400e">{voltage}V DC</text>

        {/* Wires (animated) */}
        {wires.map((w, i) => (
          <path key={i} d={w.d} fill="none" stroke={w.color} strokeWidth={2.4}
            strokeDasharray="6 4" style={{ animation: "solar-flow 1s linear infinite" }} />
        ))}

        {/* Inverters */}
        {Array.from({ length: n }).map((_, i) => {
          const y = topPad + i * (invH + gapY);
          return (
            <g key={i}>
              <rect x={invX} y={y} width={invW} height={invH} rx={6} fill="#F1F5F9" stroke="#3B82F6" strokeWidth={2} />
              <text x={invX + invW / 2} y={y + 24} textAnchor="middle" fontSize="12" fontWeight="700" fill="#1d4ed8">عاكس {i + 1} — Must 12kW</text>
              <text x={invX + invW / 2} y={y + 42} textAnchor="middle" fontSize="10" fill="#64748b">{i === 0 ? "Master" : `Slave ${i}`}</text>
              <text x={invX - 6} y={y + invH / 2 - 6} textAnchor="end" fontSize="9" fontWeight="700" fill="#ef4444">+DC</text>
              <text x={invX - 6} y={y + invH / 2 + 14} textAnchor="end" fontSize="9" fontWeight="700" fill="#111827">−DC</text>
            </g>
          );
        })}

        {/* Distribution panel */}
        <rect x={acBusX + 50} y={topPad + stackH / 2 - 30} width={140} height={60} rx={6} fill="#ECFDF5" stroke="#10B981" strokeWidth={2} />
        <text x={acBusX + 120} y={topPad + stackH / 2 + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#047857">لوحة التوزيع</text>
        <text x={acBusX + 120} y={topPad + stackH / 2 + 20} textAnchor="middle" fontSize="10" fill="#065f46">AC 220V</text>
      </svg>
    </div>
  );
}

export default function SolarSystemDesigner() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [systemType, setSystemType] = useState<SystemType>("full");

  const [nightHours, setNightHours] = useState(6);
  const [nightAmps, setNightAmps] = useState(10);
  const [dayAmps, setDayAmps] = useState(15);
  const [dayHours, setDayHours] = useState(5);
  const [battType, setBattType] = useState<BattType>("lithium");
  const [chargeTier, setChargeTier] = useState<ChargeTier>("economy");
  const [season, setSeason] = useState<Season>("summer");

  const [chosenBattery, setChosenBattery] = useState<BatteryConfig | null>(null);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });

  const loadExample = () => {
    setSystemType("full");
    setNightAmps(150); setNightHours(5);
    setDayAmps(100); setDayHours(6);
    setBattType("lithium");
    setChargeTier("economy");
    setSeason("summer");
    setChosenBattery(null);
    setStep(5);
  };

  // ───────── Calculations (multi-inverter aware)
  const calc = useMemo(() => {
    const nightLoadW = nightAmps * 220;
    const nightLoadActual = nightLoadW / INVERTER_EFF / (1 - WIRING_LOSS);
    const nightEnergyNeeded_Wh = nightLoadActual * nightHours;

    const requiredBankWh = nightEnergyNeeded_Wh / DOD[battType] / TEMP[season] / CHARGE_EFF[battType];

    // ── Inverter sizing (multi-inverter, load-based first)
    const peakAmps = Math.max(nightAmps, systemType === "full" ? dayAmps : 0);
    const peakLoadW = peakAmps * 220;
    const peakLoadWithMargin = peakLoadW * 1.25;

    let invertersForLoad = 1;
    let inverter: Inverter = INVERTERS[0];
    if (peakLoadWithMargin <= 0) {
      inverter = INVERTERS[0];
    } else if (peakLoadWithMargin <= MAX_INVERTER_W) {
      const candidates = INVERTERS.filter((i) => i.power >= peakLoadWithMargin);
      inverter = candidates[0] ?? INVERTER_12K;
      invertersForLoad = 1;
    } else {
      invertersForLoad = Math.ceil(peakLoadWithMargin / MAX_INVERTER_W);
      inverter = INVERTER_12K;
    }

    // ── Battery options
    let batteryOptions: BatteryConfig[] = [];
    if (battType === "lithium") {
      batteryOptions = pickLithiumConfigs(requiredBankWh);
    } else {
      batteryOptions = [pickLeadAcidConfig(requiredBankWh, inverter.voltage as 12 | 24 | 48)];
    }
    const selectedBattery = chosenBattery ?? batteryOptions[0];

    // ── Charging tier — required charge current = bankAh × C-rate
    const cRate = CHARGE_TIERS[battType][chargeTier];
    const requiredChargeA = selectedBattery.ah * cRate;
    const invertersForCharging = Math.max(1, Math.ceil(requiredChargeA / INVERTER_MAX_CHARGE_A));

    // Final inverter count
    let invertersNeeded = Math.max(invertersForLoad, invertersForCharging);
    const inverterBottleneck: "load" | "charging" =
      invertersForCharging > invertersForLoad ? "charging" : "load";
    let parallelExceeded = false;
    if (invertersNeeded > 1) inverter = INVERTER_12K;
    if (invertersNeeded > MAX_PARALLEL_INVERTERS) parallelExceeded = true;

    const totalInverterPower = invertersNeeded * inverter.power;
    const systemVoltage = inverter.voltage;

    // ── Panel sizing distributed across inverters
    let panelsNeeded = 0;
    let panelsCapped = 0;
    let totalPVneeded_Wh = 0;
    let panelsPerInverter = 0;
    let stringsPerInverter = 0;
    if (systemType === "full") {
      const dayEnergyNeeded_Wh = (dayAmps * 220 * dayHours) / INVERTER_EFF;
      const batteryRechargeWh = nightEnergyNeeded_Wh / CHARGE_EFF[battType];
      totalPVneeded_Wh = dayEnergyNeeded_Wh + batteryRechargeWh;
      panelsNeeded = Math.ceil(totalPVneeded_Wh / (PANEL_WATT * PEAK_SUN_HOURS * PANEL_EFF));
      const totalMaxPanels = inverter.maxPanels * invertersNeeded;
      panelsCapped = Math.min(panelsNeeded, totalMaxPanels);
      panelsPerInverter = Math.ceil(panelsCapped / invertersNeeded);
      stringsPerInverter = inverter.dualMPPT ? 2 : 1;
    }

    // Available energy after losses
    const availableWh = selectedBattery.kwh * 1000 * DOD[battType] * TEMP[season];
    const actualNightRuntimeMin = (availableWh / nightLoadActual) * 60;
    const theoreticalMin = ((selectedBattery.kwh * 1000) / nightLoadW) * 60;

    // ── Charging feasibility
    const totalChargeAmps = invertersNeeded * INVERTER_MAX_CHARGE_A;
    const dayLoadDCamps = systemType === "full"
      ? (dayAmps * 220) / (systemVoltage * INVERTER_EFF) : 0;
    const availableChargeAmps = Math.max(0, totalChargeAmps - dayLoadDCamps);
    const fullChargeHoursTheoretical = requiredChargeA > 0 ? selectedBattery.ah / requiredChargeA : 0;
    const fullChargeHoursActual = availableChargeAmps > 0
      ? selectedBattery.ah / availableChargeAmps : Infinity;
    const rechargeableWh = availableChargeAmps * systemVoltage * PEAK_SUN_HOURS * 0.97;
    const nightDischargedWh = nightEnergyNeeded_Wh;
    let chargeStatus: "ok" | "tight" | "fail" = "ok";
    let daysToFullCharge = 1;
    if (rechargeableWh >= nightDischargedWh * 1.1) chargeStatus = "ok";
    else if (rechargeableWh >= nightDischargedWh) chargeStatus = "tight";
    else { chargeStatus = "fail"; daysToFullCharge = nightDischargedWh / Math.max(1, rechargeableWh); }

    // Modules per inverter ratio (lithium only)
    const liModules = battType === "lithium" ? Math.round(selectedBattery.kwh / LI_MODULE_KWH) : 0;
    const modulesPerInverter = invertersNeeded > 0 ? Math.ceil(liModules / invertersNeeded) : 0;
    const maxModulesAllowed = MAX_MODULES_PER_INVERTER_LI[chargeTier];
    const modulesRatioOk = battType !== "lithium" || modulesPerInverter <= maxModulesAllowed;

    // Tier comparison
    const tierComparison = (Object.keys(CHARGE_TIERS[battType]) as ChargeTier[]).map((t) => {
      const cR = CHARGE_TIERS[battType][t];
      const reqA = selectedBattery.ah * cR;
      const invForCharge = Math.max(1, Math.ceil(reqA / INVERTER_MAX_CHARGE_A));
      const invTotal = Math.max(invertersForLoad, invForCharge);
      const panelsTier = systemType === "full"
        ? Math.min(Math.ceil(totalPVneeded_Wh / (PANEL_WATT * PEAK_SUN_HOURS * PANEL_EFF)), inverter.maxPanels * invTotal)
        : 0;
      return { tier: t, cRate: cR, inverters: invTotal, batteries: selectedBattery.qty, panels: panelsTier, hours: cR > 0 ? 1 / cR : 0 };
    });

    // Validations
    const errors: string[] = [];
    const warnings: string[] = [];
    const oks: string[] = [];

    if (parallelExceeded) {
      errors.push(`الحمل/الشحن يتجاوز حد التوازي للعاكس (${MAX_PARALLEL_INVERTERS} × 12kW = 72kW) — يلزم نظام ثلاثي الطور أو تقسيم الأحمال`);
    }
    if (selectedBattery.voltage !== systemVoltage) {
      errors.push("فولطية البطاريات لا تطابق فولطية العاكس");
    } else {
      oks.push(`توافق فولطية النظام (${systemVoltage}V)`);
    }
    if (peakLoadW > totalInverterPower) {
      errors.push("الحمل الذروي يتجاوز إجمالي قدرة العواكس");
    } else {
      oks.push(`الحمل (${(peakLoadW / 1000).toFixed(1)}kW) ضمن قدرة العواكس (${(totalInverterPower / 1000).toFixed(0)}kW)`);
    }
    if (invertersNeeded > 1 && invertersNeeded <= MAX_PARALLEL_INVERTERS) {
      const reason = inverterBottleneck === "charging" ? "متطلبات سرعة الشحن" : "قدرة الحمل";
      warnings.push(`نظام موزع: ${invertersNeeded} عواكس على التوازي — عدد العواكس محدد بـ${reason}`);
    }
    if (battType === "leadacid" && selectedBattery.qty > 40) {
      warnings.push(`عدد كبير من بطاريات الليد أسيد (${selectedBattery.qty}) — يُنصح بشدة بالليثيوم للأنظمة الكبيرة`);
    }
    if (systemType === "full" && panelsNeeded > inverter.maxPanels * invertersNeeded) {
      warnings.push(`عدد الألواح المطلوب (${panelsNeeded}) يتجاوز حد العواكس (${inverter.maxPanels * invertersNeeded})`);
    } else if (systemType === "full") {
      oks.push("توزيع الألواح ضمن قدرة MPPT للعواكس");
    }
    if (battType === "lithium" && selectedBattery.maxCurrent) {
      const requiredCurrent = totalInverterPower / systemVoltage;
      if (selectedBattery.maxCurrent < requiredCurrent) {
        warnings.push(`تيار التفريغ الأقصى للبطاريات (${selectedBattery.maxCurrent}A) أقل من المطلوب للعواكس (${requiredCurrent.toFixed(0)}A)`);
      } else {
        oks.push("تيار البطاريات يكفي قدرة العواكس");
      }
    }
    if (!modulesRatioOk) {
      errors.push(`نسبة البطاريات للعواكس (${modulesPerInverter}/عاكس) تتجاوز الحد للفئة المختارة (${maxModulesAllowed}/عاكس) — أضف عاكساً أو اختر فئة أبطأ`);
    } else if (battType === "lithium" && liModules > 0) {
      oks.push(`نسبة البطاريات/العواكس ${modulesPerInverter}:1 (الحد ${maxModulesAllowed}:1)`);
    }
    if (chargeStatus === "fail") {
      errors.push(`الشحن لا يكتمل في يوم واحد — يحتاج ~${daysToFullCharge.toFixed(1)} يوم. أضف عواكس أو ألواح إضافية`);
    } else if (chargeStatus === "tight") {
      warnings.push("الشحن يكتمل بشق الأنفس — لا هامش للأيام الغائمة");
    } else {
      oks.push("المنظومة تشحن بالكامل خلال يوم شمسي واحد");
    }
    if (nightEnergyNeeded_Wh > selectedBattery.kwh * 1000 * 0.8) {
      warnings.push("الحمل الليلي يتجاوز 80% من سعة البطاريات — يُنصح بزيادة السعة");
    } else {
      oks.push("البطاريات كافية للحمل الليلي");
    }

    // Health
    let health = 100;
    health -= errors.length * 25;
    health -= warnings.length * 10;
    health = Math.max(0, Math.min(100, health));

    const tier = scaleTierFor(invertersNeeded);

    return {
      nightLoadW, nightLoadActual, nightEnergyNeeded_Wh, requiredBankWh,
      batteryOptions, selectedBattery,
      inverter, invertersNeeded, invertersForLoad, invertersForCharging, inverterBottleneck,
      totalInverterPower, systemVoltage, parallelExceeded,
      panelsNeeded, panelsCapped, totalPVneeded_Wh, panelsPerInverter, stringsPerInverter,
      availableWh, actualNightRuntimeMin, theoreticalMin,
      cRate, requiredChargeA, totalChargeAmps, availableChargeAmps,
      fullChargeHoursTheoretical, fullChargeHoursActual,
      rechargeableWh, nightDischargedWh, chargeStatus, daysToFullCharge,
      liModules, modulesPerInverter, maxModulesAllowed, modulesRatioOk,
      tierComparison,
      errors, warnings, oks, health,
      peakLoadW, tier,
    };
  }, [nightAmps, nightHours, dayAmps, dayHours, battType, chargeTier, season, systemType, chosenBattery]);

  // ───────── PDF
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [reportNumber, setReportNumber] = useState<number>(() => {
    const n = parseInt(localStorage.getItem("ufuk_design_report_no") || "1000", 10);
    return n + 1;
  });

  const downloadPdf = async () => {
    if (!reportRef.current) return;
    setDownloading(true);
    try {
      localStorage.setItem("ufuk_design_report_no", String(reportNumber));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2, backgroundColor: "#ffffff", useCORS: true,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const marginX = 8;
      const availW = pageW - marginX * 2;
      const ratio = canvas.height / canvas.width;
      const imgH = availW * ratio;
      let y = 10;
      let remaining = imgH;
      let srcY = 0;
      const maxBodyH = pageH - y - 16;

      if (imgH <= maxBodyH) {
        pdf.addImage(imgData, "JPEG", marginX, y, availW, imgH);
      } else {
        const pxPerMm = canvas.width / availW;
        while (remaining > 0) {
          const sliceMm = Math.min(maxBodyH, remaining);
          const slicePx = sliceMm * pxPerMm;
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = slicePx;
          const ctx = sliceCanvas.getContext("2d")!;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(canvas, 0, srcY, canvas.width, slicePx, 0, 0, canvas.width, slicePx);
          const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.95);
          pdf.addImage(sliceData, "JPEG", marginX, y, availW, sliceMm);
          srcY += slicePx;
          remaining -= sliceMm;
          if (remaining > 0) { pdf.addPage(); y = 10; }
        }
      }

      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text("ufukalbasra.com", pageW / 2, pageH - 12, { align: "center" });
        pdf.text("sales@ufukbasra.com.iq", pageW / 2, pageH - 8, { align: "center" });
        pdf.text("+964 771 699 2955", pageW / 2, pageH - 4, { align: "center" });
      }

      pdf.save(`ufuk-system-design-${reportNumber}.pdf`);
      setReportNumber((n) => n + 1);
    } finally {
      setDownloading(false);
    }
  };

  const next = () => setStep((s) => (s < 5 ? ((s + 1) as any) : s));
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as any) : s));

  const seasonIcon = season === "summer" ? Flame : season === "winter" ? Snowflake : Leaf;
  const SeasonIcon = seasonIcon;
  const TierIcon = calc.tier.icon;

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8FAFC] text-slate-900" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        .reveal { animation: rv .5s ease-out both; }
        @keyframes rv { from { opacity: 0; transform: translateY(14px);} to { opacity: 1; transform: translateY(0);} }
      `}</style>

      <div className="container mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="mb-6 text-center reveal">
          <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 shadow-[0_0_40px_-5px_rgba(245,158,11,0.7)]">
            <Sun className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-amber-600">مصمم منظومات الطاقة الشمسية</h1>
          <p className="mt-2 text-slate-500">أداة هندسية احترافية لتصميم منظومات Must الشمسية — UFUK AL-Basra</p>
          <Button onClick={loadExample} variant="outline" className="mt-4 border-amber-500/50 text-amber-700 hover:bg-amber-50">
            <Sparkles className="ml-2 h-4 w-4" /> مثال تلقائي (150A / 5 ساعات)
          </Button>
        </div>

        <StepIndicator step={step} />

        {/* STEP 1 */}
        {step === 1 && (
          <div className="reveal grid gap-4 md:grid-cols-2">
            {[
              { v: "battery" as SystemType, icon: Battery, title: "منظومة مع بطاريات فقط", desc: "بطاريات + عاكس (بدون ألواح شمسية)" },
              { v: "full" as SystemType, icon: Sun, title: "منظومة متكاملة", desc: "بطاريات + عاكس + ألواح شمسية" },
            ].map(({ v, icon: Icon, title, desc }) => (
              <button
                key={v}
                onClick={() => { setSystemType(v); setStep(2); }}
                className={cn(
                  "rounded-2xl border-2 p-8 text-right transition-all",
                  systemType === v
                    ? "border-amber-400 bg-amber-500/10 shadow-[0_0_40px_-10px_rgba(245,158,11,0.7)]"
                    : "border-slate-300 bg-white hover:border-amber-500/50"
                )}
              >
                <Icon className="mb-3 h-10 w-10 text-amber-600" />
                <div className="text-xl font-extrabold">{title}</div>
                <div className="mt-1 text-sm text-slate-500">{desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="reveal space-y-5">
            <div className={CARD}>
              <h3 className="mb-3 text-lg font-bold text-amber-600">قسم أ: الأحمال الليلية</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>كم ساعة تحتاج تجهيز ليلي؟</Label>
                  <Input type="number" min={1} max={12} value={nightHours} onChange={(e) => setNightHours(+e.target.value || 0)} className="bg-white border-slate-300 text-slate-900" />
                </div>
                <div>
                  <Label>كم أمبير الحمل الليلي؟ (A عند 220V)</Label>
                  <Input type="number" min={0} value={nightAmps} onChange={(e) => setNightAmps(+e.target.value || 0)} className="bg-white border-slate-300 text-slate-900" />
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-slate-700">
                ⚡ الطاقة الليلية المطلوبة: <span className="font-bold text-amber-600">{(nightAmps * 220 * nightHours).toLocaleString()} Wh</span>
              </div>
            </div>

            {systemType === "full" && (
              <div className={CARD}>
                <h3 className="mb-3 text-lg font-bold text-amber-600">قسم ب: الأحمال النهارية</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>كم أمبير الحمل النهاري؟</Label>
                    <Input type="number" min={0} value={dayAmps} onChange={(e) => setDayAmps(+e.target.value || 0)} className="bg-white border-slate-300 text-slate-900" />
                  </div>
                  <div>
                    <Label>كم ساعة الحمل النهاري؟</Label>
                    <Input type="number" min={1} max={8} value={dayHours} onChange={(e) => setDayHours(+e.target.value || 0)} className="bg-white border-slate-300 text-slate-900" />
                  </div>
                </div>
              </div>
            )}

            <div className={CARD}>
              <h3 className="mb-3 text-lg font-bold text-amber-600">نوع البطارية المطلوبة</h3>
              <RadioGroup value={battType} onValueChange={(v) => { setBattType(v as BattType); setChosenBattery(null); }} className="grid gap-3 md:grid-cols-2">
                {[
                  { v: "lithium", label: "ليثيوم LiFePO4 — Must LP Series", hint: "موصى به — عمر طويل، DoD 80%" },
                  { v: "leadacid", label: "ليد أسيد 12V/200Ah — Must", hint: "اقتصادي — DoD 50%" },
                ].map((o) => (
                  <label key={o.v} className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
                    battType === o.v ? "border-amber-400 bg-amber-500/10" : "border-slate-300 bg-white hover:border-amber-500/40"
                  )}>
                    <RadioGroupItem value={o.v} className="mt-1" />
                    <div>
                      <div className="font-bold">{o.label}</div>
                      <div className="text-xs text-slate-500">{o.hint}</div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className={CARD}>
              <h3 className="mb-1 text-lg font-bold text-amber-600">سرعة شحن البطاريات</h3>
              <p className="mb-3 text-xs text-slate-500">معيار C-rate وفق IEC 61427 / IEEE 1013/1562 — يحدد التوازن بين عدد العواكس وعمر البطاريات</p>
              <RadioGroup value={chargeTier} onValueChange={(v) => setChargeTier(v as ChargeTier)} className="grid gap-3 md:grid-cols-3">
                {([
                  { v: "economy" as ChargeTier, icon: "🐢", title: "اقتصادي",
                    cLi: "C/5 (0.2C)", cPb: "C/10 (0.1C)",
                    pros: ["أطول عمر للبطارية", "أقل حرارة", "موصى به IEC 61427", "عواكس أقل = تكلفة أقل"] },
                  { v: "balanced" as ChargeTier, icon: "⚡", title: "متوازن",
                    cLi: "C/2 (0.5C)", cPb: "C/7 (0.15C)",
                    pros: ["توازن جيد", "شحن سريع نسبياً", "عمر طبيعي للبطارية"] },
                  { v: "fast" as ChargeTier, icon: "🚀", title: "سريع",
                    cLi: "1C", cPb: "C/5 (0.2C)",
                    pros: ["شحن أسرع", "للأنظمة التجارية مع تبريد", "يقلل عمر البطارية"] },
                ]).map((o) => (
                  <label key={o.v} className={cn(
                    "flex cursor-pointer flex-col gap-2 rounded-xl border p-3 text-right transition",
                    chargeTier === o.v ? "border-amber-400 bg-amber-500/10" : "border-slate-300 bg-white hover:border-amber-500/40"
                  )}>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value={o.v} />
                      <span className="text-2xl">{o.icon}</span>
                      <span className="font-bold">{o.title}</span>
                    </div>
                    <div className="text-xs text-slate-600">
                      <div>ليثيوم: <b>{o.cLi}</b></div>
                      <div>ليد أسيد: <b>{o.cPb}</b></div>
                    </div>
                    <ul className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                      {o.pros.map((p) => <li key={p}>• {p}</li>)}
                    </ul>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className={CARD}>
              <h3 className="mb-3 text-lg font-bold text-amber-600">الموسم (للتعويض الحراري)</h3>
              <RadioGroup value={season} onValueChange={(v) => setSeason(v as Season)} className="grid gap-3 md:grid-cols-3">
                {[
                  { v: "summer", label: "صيف", icon: Flame, t: "~45°C" },
                  { v: "moderate", label: "معتدل", icon: Leaf, t: "~30°C" },
                  { v: "winter", label: "شتاء", icon: Snowflake, t: "~20°C" },
                ].map((o) => {
                  const I = o.icon;
                  return (
                    <label key={o.v} className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition",
                      season === o.v ? "border-amber-400 bg-amber-500/10" : "border-slate-300 bg-white hover:border-amber-500/40"
                    )}>
                      <RadioGroupItem value={o.v} />
                      <I className="h-5 w-5 text-amber-600" />
                      <div>
                        <div className="font-bold">{o.label}</div>
                        <div className="text-xs text-slate-500">{o.t}</div>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="reveal space-y-5">
            <div className={CARD}>
              <h3 className="mb-2 text-lg font-bold text-amber-600">حساب البطاريات</h3>
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <div className={STAT}>الطاقة الليلية: <span className="font-bold text-amber-600">{calc.nightEnergyNeeded_Wh.toFixed(0)} Wh</span></div>
                <div className={STAT}>سعة البنك المطلوبة: <span className="font-bold text-amber-600">{(calc.requiredBankWh / 1000).toFixed(1)} kWh</span></div>
                <div className={STAT}>(بعد DoD/حرارة/كفاءة شحن)</div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-amber-600">اختر التكوين</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {calc.batteryOptions.map((opt, i) => {
                const active = (chosenBattery?.model === opt.model && chosenBattery?.qty === opt.qty) || (!chosenBattery && i === 0);
                return (
                  <button
                    key={`${opt.model}-${opt.qty}-${i}`}
                    onClick={() => setChosenBattery(opt)}
                    className={cn(
                      "rounded-2xl border-2 p-4 text-right transition-all",
                      active ? "border-amber-400 bg-amber-500/10 shadow-[0_0_25px_-8px_rgba(245,158,11,0.6)]" : "border-slate-300 bg-white hover:border-amber-500/40"
                    )}
                  >
                    <div className="mb-2 inline-block rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-700">{opt.label}</div>
                    <div className="font-extrabold">{opt.model}</div>
                    <div className="mt-2 text-sm text-slate-700 space-y-1">
                      <div>الفولطية: {opt.voltage}V</div>
                      <div>السعة: {opt.ah}Ah</div>
                      <div>الطاقة: {opt.kwh.toFixed(2)} kWh</div>
                      <div>الكمية: {opt.qty}</div>
                      {opt.connection && opt.connection !== "—" && <div>التوصيل: {opt.connection}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="reveal space-y-5">
            <div className={CARD}>
              <div className="mb-2 flex items-center gap-2 text-lg font-bold text-amber-600"><Zap className="h-5 w-5" /> العواكس المقترحة</div>
              <div className="text-xl font-extrabold">{calc.invertersNeeded} × {calc.inverter.model}</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
                <div className={STAT}>إجمالي القدرة: <b className="text-amber-600">{(calc.totalInverterPower / 1000).toFixed(0)} kW</b></div>
                <div className={STAT}>الفولطية: <b className="text-amber-600">{calc.systemVoltage}V</b></div>
                <div className={STAT}>MPPT: <b className="text-amber-600">{calc.inverter.mppt ?? "—"}</b> {calc.inverter.dualMPPT && "(Dual)"}</div>
                <div className={STAT}>الحد الأقصى للألواح/عاكس: <b className="text-amber-600">{calc.inverter.maxPanels}</b></div>
              </div>
              {calc.invertersNeeded > 1 && (
                <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-800">
                  ⚠️ ربط توازي: استخدم Parallel Cable Kit وضبط Master/Slave على جميع العواكس
                </div>
              )}
              <div className="mt-3 text-xs text-slate-500">{calc.inverter.note}</div>
            </div>

            {systemType === "full" && (
              <div className={CARD}>
                <div className="mb-2 flex items-center gap-2 text-lg font-bold text-amber-600"><Sun className="h-5 w-5" /> الألواح الشمسية</div>
                <div className="grid gap-3 md:grid-cols-3 text-sm">
                  <div className={STAT}>العدد الإجمالي: <b className="text-amber-600">{calc.panelsCapped} لوح</b></div>
                  <div className={STAT}>القدرة الكلية: <b className="text-amber-600">{(calc.panelsCapped * PANEL_WATT / 1000).toFixed(2)} kW</b></div>
                  <div className={STAT}>لكل عاكس: <b className="text-amber-600">{calc.panelsPerInverter} لوح</b></div>
                </div>
                {calc.panelsNeeded > calc.inverter.maxPanels * calc.invertersNeeded && (
                  <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-800">
                    ⚠️ المطلوب نظرياً {calc.panelsNeeded} لوح لكن الحد الأقصى {calc.inverter.maxPanels * calc.invertersNeeded}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <div className="reveal space-y-5">
            {/* System architecture summary */}
            <div className={cn(CARD, "border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-white")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-amber-700">
                    <TierIcon className="h-5 w-5" />
                    <span className="rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-bold">{calc.tier.label}</span>
                    <span className="text-xs text-slate-500">{calc.tier.desc}</span>
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-slate-900">
                    {calc.invertersNeeded > 1 ? `منظومة موزعة على ${calc.invertersNeeded} عواكس متوازية` : "منظومة بعاكس واحد"}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                    <div><span className="text-slate-500">القدرة الإجمالية: </span><b className="text-amber-700">{(calc.totalInverterPower / 1000).toFixed(0)}kW</b></div>
                    <div><span className="text-slate-500">النظام: </span><b className="text-amber-700">{calc.systemVoltage}V DC</b></div>
                    <div><span className="text-slate-500">الحمل المدعوم: </span><b className="text-amber-700">{Math.max(nightAmps, dayAmps)}A / {(calc.peakLoadW / 1000).toFixed(0)}kW</b></div>
                    <div><span className="text-slate-500">السعة التخزينية: </span><b className="text-amber-700">{calc.selectedBattery.kwh.toFixed(0)}kWh</b></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Health score */}
            <div className={CARD}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">مؤشر صحة المنظومة</div>
                  <div className="text-4xl font-extrabold text-amber-600">{calc.health}%</div>
                </div>
                <SeasonIcon className="h-10 w-10 text-amber-600" />
              </div>
              <Progress dir="ltr" value={calc.health} className="mt-3 h-3 bg-slate-200 [transform:scaleX(-1)] [&>div]:bg-amber-500" />
            </div>

            {/* Multi-inverter wiring diagram */}
            <div className={CARD}>
              <div className="mb-3 font-bold text-amber-600">📐 مخطط التوصيل</div>
              <MultiInverterDiagram count={calc.invertersNeeded} hasPV={systemType === "full"} voltage={calc.systemVoltage} />
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-red-500" /> DC+</span>
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-slate-900" /> DC−</span>
                <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-blue-600" /> AC 220V</span>
                {systemType === "full" && <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-amber-500" /> PV</span>}
              </div>
            </div>

            {/* Cards grid */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className={CARD}>
                <div className="mb-2 flex items-center gap-2 text-amber-600 font-bold"><Bolt className="h-5 w-5" /> العواكس</div>
                <div className="font-extrabold">{calc.invertersNeeded} × {calc.inverter.model}</div>
                <div className="mt-2 text-sm text-slate-700">إجمالي: {(calc.totalInverterPower / 1000).toFixed(0)}kW | {calc.systemVoltage}V</div>
                {calc.invertersNeeded > 1 && <div className="mt-1 text-xs text-amber-700">ربط توازي — Master/Slave</div>}
              </div>

              <div className={CARD}>
                <div className="mb-2 flex items-center gap-2 text-amber-600 font-bold"><Battery className="h-5 w-5" /> بنك البطاريات</div>
                <div className="font-extrabold">{calc.selectedBattery.qty} × {calc.selectedBattery.model}</div>
                <div className="mt-2 text-sm text-slate-700">
                  {calc.selectedBattery.voltage}V | {calc.selectedBattery.ah}Ah | {calc.selectedBattery.kwh.toFixed(1)} kWh
                </div>
                <div className="mt-1 text-xs text-slate-500">قابل للاستخدام: <b className="text-amber-700">{(calc.availableWh / 1000).toFixed(1)} kWh</b></div>
                {calc.selectedBattery.connection && calc.selectedBattery.connection !== "—" && (
                  <div className="mt-1 text-xs text-slate-500">{calc.selectedBattery.connection}</div>
                )}
              </div>

              {systemType === "full" && (
                <div className={CARD}>
                  <div className="mb-2 flex items-center gap-2 text-amber-600 font-bold"><Sun className="h-5 w-5" /> الألواح الشمسية</div>
                  <div className="font-extrabold">{calc.panelsCapped} لوح × 615W</div>
                  <div className="mt-2 text-sm text-slate-700">إجمالي: {(calc.panelsCapped * PANEL_WATT / 1000).toFixed(2)} kW</div>
                  <div className="mt-1 text-xs text-slate-500">توزيع: {calc.panelsPerInverter} لوح/عاكس ({calc.stringsPerInverter} سلسلة MPPT)</div>
                </div>
              )}

              <div className={CARD}>
                <div className="mb-2 flex items-center gap-2 text-amber-600 font-bold">⏱️ وقت التشغيل الفعلي</div>
                <div className="text-sm text-slate-700">ليلاً: <b className="text-amber-700">{Math.floor(calc.actualNightRuntimeMin / 60)} ساعة {Math.round(calc.actualNightRuntimeMin % 60)} دقيقة</b></div>
                <div className="text-sm text-slate-500">نظري: {(calc.theoreticalMin / 60).toFixed(1)} ساعة</div>
                {systemType === "full" && <div className="text-sm text-slate-500">نهاراً: مستمر مع الشمس</div>}
              </div>
            </div>

            {/* Loss breakdown */}
            <Collapsible>
              <CollapsibleTrigger className="w-full rounded-xl border border-amber-500/30 bg-white px-4 py-3 text-right font-bold text-amber-600 hover:bg-amber-50">
                📊 تفاصيل الخسائر (اضغط للعرض)
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2 rounded-xl border border-amber-500/20 bg-amber-50/40 p-4 text-sm text-slate-700">
                <div>خسائر العاكس 10%: <b className="text-amber-700">-{(calc.selectedBattery.kwh * 1000 * 0.10).toFixed(0)} Wh</b></div>
                <div>خسائر الأسلاك 3%: <b className="text-amber-700">-{(calc.selectedBattery.kwh * 1000 * 0.03).toFixed(0)} Wh</b></div>
                <div>عمق التفريغ {(DOD[battType] * 100).toFixed(0)}%: <b className="text-amber-700">-{(calc.selectedBattery.kwh * 1000 * (1 - DOD[battType])).toFixed(0)} Wh</b></div>
                <div>تأثير الحرارة ({season}): <b className="text-amber-700">-{(calc.selectedBattery.kwh * 1000 * (1 - TEMP[season])).toFixed(0)} Wh</b></div>
                <div className="mt-2 border-t border-amber-500/20 pt-2">الطاقة الفعلية المتاحة: <b className="text-amber-600">{calc.availableWh.toFixed(0)} Wh</b></div>
              </CollapsibleContent>
            </Collapsible>

            {/* Validation checklist */}
            <div className={CARD}>
              <div className="mb-3 font-bold text-amber-600">قائمة التحقق الهندسية</div>
              <ul className="space-y-2 text-sm">
                {calc.errors.map((e) => (
                  <li key={e} className="flex items-start gap-2 text-red-600"><XCircle className="mt-0.5 h-4 w-4 shrink-0" /> {e}</li>
                ))}
                {calc.warnings.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-amber-700"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {w}</li>
                ))}
                {calc.oks.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-emerald-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {o}</li>
                ))}
              </ul>
            </div>

            {/* Customer info */}
            <div className={CARD}>
              <div className="mb-3 font-bold text-amber-600">بيانات العميل (اختياري — تظهر في التقرير)</div>
              <div className="grid gap-3 md:grid-cols-3">
                <Input placeholder="اسم العميل" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="bg-white border-slate-300 text-slate-900" />
                <Input placeholder="رقم الهاتف" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="bg-white border-slate-300 text-slate-900" />
                <Input placeholder="العنوان" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} className="bg-white border-slate-300 text-slate-900" />
              </div>
            </div>

            <Button onClick={downloadPdf} disabled={downloading} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 font-bold hover:from-amber-400 hover:to-amber-500" size="lg">
              <Download className="ml-2 h-5 w-5" /> {downloading ? "جاري التحضير..." : "تحميل تقرير PDF"}
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="outline" onClick={back} disabled={step === 1} className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100">
            <ChevronRight className="ml-1 h-4 w-4" /> السابق
          </Button>
          {step < 5 ? (
            <Button onClick={next} className="bg-amber-500 text-slate-900 hover:bg-amber-400 font-bold">
              التالي <ChevronLeft className="mr-1 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setStep(1)} className="border-amber-500/40 text-amber-600 hover:bg-amber-500/10">
              تصميم جديد
            </Button>
          )}
        </div>
      </div>

      {/* Off-screen PDF report */}
      <div style={{ position: "fixed", left: "-10000px", top: 0, width: "794px", background: "#ffffff" }} aria-hidden>
        <div ref={reportRef} dir="rtl" style={{ width: "794px", padding: "24px", background: "#ffffff", color: "#0f172a", fontFamily: "'Cairo', system-ui, sans-serif" }}>
          {/* Header */}
          <div style={{ background: "#F59E0B", padding: "18px 16px", borderRadius: "8px", color: "#0f172a", textAlign: "center" }}>
            <div style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "1px" }}>أُفق البصرة | UFUK AL-Basra</div>
            <div style={{ fontSize: "12px", marginTop: "4px" }}>IT • Networking • Solar</div>
            <div style={{ fontSize: "15px", fontWeight: 700, marginTop: "6px" }}>تقرير تصميم منظومة الطاقة الشمسية</div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "12px", color: "#475569" }}>
            <div>التاريخ: {new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</div>
            <div>رقم التقرير: #{reportNumber}</div>
          </div>

          {/* Architecture summary */}
          <PdfSection title="ملخص بنية المنظومة">
            <PdfRow label="المستوى" value={calc.tier.label} />
            <PdfRow label="عدد العواكس" value={`${calc.invertersNeeded} × ${calc.inverter.model}`} />
            <PdfRow label="إجمالي القدرة" value={`${(calc.totalInverterPower / 1000).toFixed(0)} kW`} />
            <PdfRow label="نظام التشغيل" value={`${calc.systemVoltage}V DC`} />
            <PdfRow label="الحمل المدعوم" value={`${Math.max(nightAmps, dayAmps)}A / ${(calc.peakLoadW / 1000).toFixed(0)} kW`} />
            <PdfRow label="السعة التخزينية" value={`${calc.selectedBattery.kwh.toFixed(1)} kWh`} />
          </PdfSection>

          {/* Customer */}
          <PdfSection title="بيانات العميل">
            <PdfRow label="الاسم" value={customer.name || "—"} />
            <PdfRow label="الهاتف" value={customer.phone || "—"} />
            <PdfRow label="العنوان" value={customer.address || "—"} />
          </PdfSection>

          {/* Requirements */}
          <PdfSection title="ملخص المتطلبات">
            <PdfRow label="نوع المنظومة" value={systemType === "battery" ? "بطاريات + عاكس فقط" : "متكاملة (بطاريات + عاكس + ألواح)"} />
            <PdfRow label="الحمل الليلي" value={`${nightAmps} A  /  ${calc.nightLoadW} W`} />
            <PdfRow label="ساعات التشغيل الليلي" value={`${nightHours} ساعة`} />
            {systemType === "full" && <PdfRow label="الحمل النهاري" value={`${dayAmps} A  /  ${dayAmps * 220} W`} />}
            {systemType === "full" && <PdfRow label="ساعات التشغيل النهاري" value={`${dayHours} ساعة`} />}
            <PdfRow label="نوع البطارية" value={battType === "lithium" ? "ليثيوم LiFePO4" : "ليد أسيد"} />
            <PdfRow label="الموسم" value={season === "summer" ? "صيف" : season === "winter" ? "شتاء" : "معتدل"} />
          </PdfSection>

          {/* BOM table */}
          <PdfSection title="قائمة المواد (Bill of Materials)">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#F59E0B", color: "#0f172a" }}>
                  <th style={pdfTh}>المكون</th>
                  <th style={pdfTh}>الموديل</th>
                  <th style={pdfTh}>الكمية</th>
                  <th style={pdfTh}>السعر/الوحدة</th>
                  <th style={pdfTh}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={pdfTd}>عاكس</td><td style={pdfTd}>{calc.inverter.model}</td><td style={pdfTd}>{calc.invertersNeeded}</td><td style={pdfTd}>—</td><td style={pdfTd}>—</td></tr>
                <tr><td style={pdfTd}>بطاريات</td><td style={pdfTd}>{calc.selectedBattery.model}</td><td style={pdfTd}>{calc.selectedBattery.qty}</td><td style={pdfTd}>—</td><td style={pdfTd}>—</td></tr>
                {systemType === "full" && (
                  <tr><td style={pdfTd}>ألواح شمسية 615W Mono</td><td style={pdfTd}>Mono PERC 615W</td><td style={pdfTd}>{calc.panelsCapped}</td><td style={pdfTd}>—</td><td style={pdfTd}>—</td></tr>
                )}
                {calc.invertersNeeded > 1 && (
                  <tr><td style={pdfTd}>Parallel Cable Kit</td><td style={pdfTd}>Must Original</td><td style={pdfTd}>{calc.invertersNeeded - 1}</td><td style={pdfTd}>—</td><td style={pdfTd}>—</td></tr>
                )}
                <tr><td style={pdfTd}>كابل DC 95mm² (متر)</td><td style={pdfTd}>أحمر/أسود</td><td style={pdfTd}>—</td><td style={pdfTd}>—</td><td style={pdfTd}>—</td></tr>
                <tr><td style={pdfTd}>قاطع DC رئيسي</td><td style={pdfTd}>حسب التيار</td><td style={pdfTd}>{calc.invertersNeeded}</td><td style={pdfTd}>—</td><td style={pdfTd}>—</td></tr>
              </tbody>
              <tfoot>
                <tr><td style={{ ...pdfTd, fontWeight: 700 }} colSpan={4}>الإجمالي الكلي</td><td style={{ ...pdfTd, fontWeight: 700, color: "#b45309" }}>—</td></tr>
              </tfoot>
            </table>
            <div style={{ fontSize: "10px", color: "#64748b", marginTop: "6px" }}>* الأسعار قابلة للتعديل من قسم المبيعات حسب التوافر والكميات</div>
          </PdfSection>

          {/* Engineering */}
          <PdfSection title="الحسابات الهندسية">
            <PdfRow label="الحمل الليلي" value={`${calc.nightLoadW.toFixed(0)} W`} />
            <PdfRow label="بعد خسائر العاكس والأسلاك" value={`${calc.nightLoadActual.toFixed(0)} W`} />
            <PdfRow label="الطاقة الليلية المطلوبة" value={`${calc.nightEnergyNeeded_Wh.toFixed(0)} Wh`} />
            <PdfRow label="سعة البنك المطلوبة" value={`${calc.requiredBankWh.toFixed(0)} Wh`} />
            <PdfRow label="سعة البنك المختار" value={`${(calc.selectedBattery.kwh * 1000).toFixed(0)} Wh`} />
            <PdfRow label="الطاقة المتاحة بعد الخسائر" value={`${calc.availableWh.toFixed(0)} Wh`} />
            {systemType === "full" && <PdfRow label="إجمالي طاقة الألواح المطلوبة" value={`${calc.totalPVneeded_Wh.toFixed(0)} Wh`} />}
            {systemType === "full" && <PdfRow label="عدد الألواح" value={`${calc.panelsCapped} (${calc.panelsPerInverter}/عاكس)`} />}
          </PdfSection>

          {/* Runtime */}
          <PdfSection title="وقت التشغيل المتوقع">
            <PdfRow label="نظري (بدون خسائر)" value={`${(calc.theoreticalMin / 60).toFixed(1)} ساعة`} />
            <PdfRow label="واقعي (بعد الخسائر)" value={`${Math.floor(calc.actualNightRuntimeMin / 60)} ساعة و ${Math.round(calc.actualNightRuntimeMin % 60)} دقيقة`} />
            <PdfRow label="نهاراً" value={systemType === "full" ? "مستمر مع وجود الشمس" : "—"} />
          </PdfSection>

          {/* Wiring notes for large systems */}
          {calc.invertersNeeded > 1 && (
            <PdfSection title="ملاحظات التركيب للمنظومات الكبيرة">
              <ol style={{ margin: 0, paddingInlineStart: "20px", fontSize: "12px", lineHeight: 1.9, color: "#0f172a" }}>
                <li>يجب استخدام كابلات DC لا تقل عن 95mm² لبنك البطاريات</li>
                <li>يجب تركيب قاطع رئيسي DC بين البطاريات وكل عاكس</li>
                <li>يجب موازنة أطوال كابلات البطاريات بين العواكس لتوزيع التيار بالتساوي</li>
                <li>يجب ضبط العاكس الأول كـ Master والبقية كـ Slave عبر شاشة الإعدادات</li>
                <li>يجب أرضة (Earthing) منفصلة لكل عاكس مع ربطها على Bus Bar مشترك</li>
                <li>يجب استخدام Parallel Cable Kit الأصلي من Must وعدم تجاوز {MAX_PARALLEL_INVERTERS} عواكس متوازية</li>
              </ol>
            </PdfSection>
          )}

          {/* One-line diagram embedded */}
          <PdfSection title="مخطط التوصيل المبسط">
            <MultiInverterDiagram count={calc.invertersNeeded} hasPV={systemType === "full"} voltage={calc.systemVoltage} />
          </PdfSection>

          {/* Footer */}
          <div style={{ marginTop: "20px", borderTop: "2px solid #F59E0B", paddingTop: "10px", fontSize: "11px", color: "#475569", textAlign: "center", lineHeight: 1.7 }}>
            <div>هذا التقرير صادر من شركة أُفق البصرة للتقنية</div>
            <div>جميع الحسابات وفق المعايير الهندسية الدولية IEC 62109</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const pdfTh: React.CSSProperties = { padding: "8px 6px", textAlign: "right", fontWeight: 700, border: "1px solid #fbbf24" };
const pdfTd: React.CSSProperties = { padding: "7px 6px", textAlign: "right", border: "1px solid #e5e7eb" };

function PdfSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: "14px" }}>
      <div style={{ background: "#F59E0B", color: "#0f172a", padding: "6px 10px", fontWeight: 700, fontSize: "13px", borderRadius: "4px 4px 0 0" }}>{title}</div>
      <div style={{ border: "1px solid #fbbf24", borderTop: "none", padding: "8px 10px", borderRadius: "0 0 4px 4px" }}>{children}</div>
    </div>
  );
}

function PdfRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dashed #e5e7eb", fontSize: "12px" }}>
      <span style={{ color: "#475569" }}>{label}</span>
      <span style={{ fontWeight: 700, color: "#0f172a" }}>{value}</span>
    </div>
  );
}

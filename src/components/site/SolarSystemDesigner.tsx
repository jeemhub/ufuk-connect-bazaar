import { useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Battery, Bolt, CheckCircle2, ChevronLeft, ChevronRight, Download, Sun, TriangleAlert, XCircle, Zap, Leaf, Snowflake, Flame } from "lucide-react";
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

type SystemType = "battery" | "full";
type BattType = "lithium" | "leadacid";
type Season = "summer" | "moderate" | "winter";

// ───────── Must product database
type LithiumOpt = { model: string; kwh: number; voltage: number; ah: number; maxCurrent: number; maxInverter: number };
const LITHIUM_OPTIONS: LithiumOpt[] = [
  { model: "Must LP1600 SE — 5kWh", kwh: 5.12, voltage: 48, ah: 100, maxCurrent: 100, maxInverter: 5 },
  { model: "Must LP3000 PRO — 5kWh module", kwh: 5.12, voltage: 48, ah: 100, maxCurrent: 100, maxInverter: 5 },
  { model: "Must LP3000 PRO — 10kWh (2 modules)", kwh: 10.24, voltage: 48, ah: 200, maxCurrent: 200, maxInverter: 10 },
  { model: "Must LP3000 PRO — 15kWh (3 modules)", kwh: 15.36, voltage: 48, ah: 300, maxCurrent: 200, maxInverter: 10 },
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

// ───────── Battery selection
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
  // Find smallest single-option meeting requirement
  const ordered = [...LITHIUM_OPTIONS].sort((a, b) => a.kwh - b.kwh);
  const sufficient = ordered.filter((o) => o.kwh * 1000 >= requiredWh);
  const recommended = sufficient[0] ?? ordered[ordered.length - 1];

  // Economy: stack the smallest module to reach requirement
  const small = ordered[0];
  const qtyEconomy = Math.max(1, Math.ceil(requiredWh / (small.kwh * 1000)));
  const economy: BatteryConfig = {
    label: "اقتصادي",
    model: small.model,
    voltage: small.voltage,
    ah: small.ah * qtyEconomy,
    kwh: small.kwh * qtyEconomy,
    qty: qtyEconomy,
    maxCurrent: small.maxCurrent * qtyEconomy,
    connection: qtyEconomy > 1 ? "توازي" : "—",
  };

  const rec: BatteryConfig = {
    label: "موصى به",
    model: recommended.model,
    voltage: recommended.voltage,
    ah: recommended.ah,
    kwh: recommended.kwh,
    qty: 1,
    maxCurrent: recommended.maxCurrent,
    connection: "—",
  };

  // Premium: next size up if available
  const idx = ordered.findIndex((o) => o.model === recommended.model);
  const premiumOpt = ordered[idx + 1] ?? recommended;
  const premium: BatteryConfig = {
    label: "متميز",
    model: premiumOpt.model,
    voltage: premiumOpt.voltage,
    ah: premiumOpt.ah,
    kwh: premiumOpt.kwh,
    qty: 1,
    maxCurrent: premiumOpt.maxCurrent,
    connection: "—",
  };

  return [rec, economy, premium];
}

function pickLeadAcidConfig(requiredWh: number, targetVoltage: 12 | 24 | 48): BatteryConfig {
  const seriesCount = targetVoltage / LEADACID.voltage; // 4 for 48V
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

export default function SolarSystemDesigner() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [systemType, setSystemType] = useState<SystemType>("full");

  const [nightHours, setNightHours] = useState(6);
  const [nightAmps, setNightAmps] = useState(10);
  const [dayAmps, setDayAmps] = useState(15);
  const [dayHours, setDayHours] = useState(5);
  const [battType, setBattType] = useState<BattType>("lithium");
  const [season, setSeason] = useState<Season>("summer");

  const [chosenBattery, setChosenBattery] = useState<BatteryConfig | null>(null);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });

  // ───────── Calculations
  const calc = useMemo(() => {
    const nightLoadW = nightAmps * 220;
    const nightLoadActual = nightLoadW / INVERTER_EFF / (1 - WIRING_LOSS);
    const nightEnergyNeeded_Wh = nightLoadActual * nightHours;

    const requiredBankWh = nightEnergyNeeded_Wh / DOD[battType] / TEMP[season] / CHARGE_EFF[battType];

    // Battery options
    let batteryOptions: BatteryConfig[] = [];
    if (battType === "lithium") {
      batteryOptions = pickLithiumConfigs(requiredBankWh);
    } else {
      // Need to know inverter voltage; default 48V for big, 24V for small
      const tentativeVoltage: 12 | 24 | 48 = nightLoadW > 3000 ? 48 : nightLoadW > 1500 ? 24 : 12;
      batteryOptions = [pickLeadAcidConfig(requiredBankWh, tentativeVoltage)];
    }

    const selectedBattery = chosenBattery ?? batteryOptions[0];

    // Inverter sizing
    const peakAmps = Math.max(nightAmps, systemType === "full" ? dayAmps : 0);
    const peakLoadW = peakAmps * 220 * 1.25;

    const invCandidates = INVERTERS.filter(
      (i) => i.power >= peakLoadW && i.voltage === selectedBattery.voltage,
    );
    const inverter = invCandidates[0] ?? INVERTERS.find((i) => i.power >= peakLoadW) ?? INVERTERS[INVERTERS.length - 1];

    // Panel sizing
    let panelsNeeded = 0;
    let panelsCapped = 0;
    let totalPVneeded_Wh = 0;
    if (systemType === "full") {
      const dayEnergyNeeded_Wh = (dayAmps * 220 * dayHours) / INVERTER_EFF;
      const batteryRechargeWh = nightEnergyNeeded_Wh / CHARGE_EFF[battType];
      totalPVneeded_Wh = dayEnergyNeeded_Wh + batteryRechargeWh;
      panelsNeeded = Math.ceil(totalPVneeded_Wh / (PANEL_WATT * PEAK_SUN_HOURS * PANEL_EFF));
      panelsCapped = Math.min(panelsNeeded, inverter.maxPanels);
    }

    // Available energy after losses
    const availableWh = selectedBattery.kwh * 1000 * DOD[battType] * TEMP[season];
    const actualNightRuntimeMin = (availableWh / nightLoadActual) * 60;

    // Theoretical (no losses) runtime
    const theoreticalMin = ((selectedBattery.kwh * 1000) / nightLoadW) * 60;

    // Validations
    const errors: string[] = [];
    const warnings: string[] = [];
    const oks: string[] = [];

    if (selectedBattery.voltage !== inverter.voltage) errors.push("فولطية البطاريات لا تطابق فولطية العاكس");
    else oks.push("توافق فولطية العاكس مع البطاريات");

    if (peakLoadW > inverter.power * 1.25) errors.push("الحمل الذروي يتجاوز قدرة العاكس");
    else oks.push("الحمل ضمن طاقة العاكس");

    if (systemType === "full") {
      if (panelsNeeded > inverter.maxPanels) warnings.push(`عدد الألواح المطلوب (${panelsNeeded}) يتجاوز حد العاكس (${inverter.maxPanels})`);
      else oks.push("عدد الألواح ضمن حد MPPT");
    }

    if (battType === "leadacid" && selectedBattery.ah < inverter.minBattAh) {
      warnings.push(`سعة البطاريات أقل من الموصى به للعاكس (${inverter.minBattAh}Ah)`);
    }

    if (nightEnergyNeeded_Wh > selectedBattery.kwh * 1000 * 0.8) {
      warnings.push("الحمل الليلي يتجاوز 80% من سعة البطاريات — يُنصح بزيادة السعة");
    } else {
      oks.push("البطاريات كافية للحمل الليلي");
    }

    if (battType === "lithium" && selectedBattery.maxCurrent) {
      const requiredCurrent = inverter.power / inverter.voltage;
      if (selectedBattery.maxCurrent < requiredCurrent) {
        errors.push(`تيار التفريغ الأقصى للبطاريات (${selectedBattery.maxCurrent}A) أقل من المطلوب (${requiredCurrent.toFixed(0)}A)`);
      }
    }

    // Health score
    let health = 100;
    health -= errors.length * 25;
    health -= warnings.length * 10;
    health = Math.max(0, Math.min(100, health));

    return {
      nightLoadW, nightLoadActual, nightEnergyNeeded_Wh, requiredBankWh,
      batteryOptions, selectedBattery, inverter,
      panelsNeeded, panelsCapped, totalPVneeded_Wh,
      availableWh, actualNightRuntimeMin, theoreticalMin,
      errors, warnings, oks, health,
      peakLoadW,
    };
  }, [nightAmps, nightHours, dayAmps, dayHours, battType, season, systemType, chosenBattery]);

  // ───────── PDF (renders Arabic-friendly DOM via html2canvas)
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
      // Reserve and persist report number
      localStorage.setItem("ufuk_design_report_no", String(reportNumber));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
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
          if (remaining > 0) {
            pdf.addPage();
            y = 10;
          }
        }
      }

      // Footer on each page
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
        </div>

        <StepIndicator step={step} />

        {/* STEP 1 — System Type */}
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

        {/* STEP 2 — Loads */}
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
                    <Label>كم أمبير الحمل النهاري؟ (مع وجود الشمس)</Label>
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

        {/* STEP 3 — Battery sizing */}
        {step === 3 && (
          <div className="reveal space-y-5">
            <div className={CARD}>
              <h3 className="mb-2 text-lg font-bold text-amber-600">حساب البطاريات</h3>
              <div className="grid gap-3 md:grid-cols-3 text-sm">
                <div className={STAT}>الطاقة الليلية: <span className="font-bold text-amber-600">{calc.nightEnergyNeeded_Wh.toFixed(0)} Wh</span></div>
                <div className={STAT}>سعة البنك المطلوبة: <span className="font-bold text-amber-600">{calc.requiredBankWh.toFixed(0)} Wh</span></div>
                <div className={STAT}>(بعد DoD/حرارة/كفاءة شحن)</div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-amber-600">اختر التكوين</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {calc.batteryOptions.map((opt, i) => {
                const active = (chosenBattery?.model === opt.model && chosenBattery?.qty === opt.qty) || (!chosenBattery && i === 0);
                return (
                  <button
                    key={`${opt.model}-${opt.qty}`}
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

        {/* STEP 4 — Inverter & Panels */}
        {step === 4 && (
          <div className="reveal space-y-5">
            <div className={CARD}>
              <div className="mb-2 flex items-center gap-2 text-lg font-bold text-amber-600"><Zap className="h-5 w-5" /> العاكس المقترح</div>
              <div className="text-xl font-extrabold">{calc.inverter.model}</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
                <div className={STAT}>القدرة: <b className="text-amber-600">{calc.inverter.power} W</b></div>
                <div className={STAT}>الفولطية: <b className="text-amber-600">{calc.inverter.voltage}V</b></div>
                <div className={STAT}>MPPT: <b className="text-amber-600">{calc.inverter.mppt ?? "—"}</b> {calc.inverter.dualMPPT && "(Dual)"}</div>
                <div className={STAT}>الحد الأقصى للألواح: <b className="text-amber-600">{calc.inverter.maxPanels}</b></div>
              </div>
              <div className="mt-3 text-xs text-slate-500">{calc.inverter.note}</div>
            </div>

            {systemType === "full" && (
              <div className={CARD}>
                <div className="mb-2 flex items-center gap-2 text-lg font-bold text-amber-600"><Sun className="h-5 w-5" /> الألواح الشمسية</div>
                <div className="grid gap-3 md:grid-cols-3 text-sm">
                  <div className={STAT}>العدد: <b className="text-amber-600">{calc.panelsCapped} لوح</b></div>
                  <div className={STAT}>القدرة الكلية: <b className="text-amber-600">{(calc.panelsCapped * PANEL_WATT / 1000).toFixed(2)} kW</b></div>
                  <div className={STAT}>إنتاج يومي متوقع: <b className="text-amber-600">{((calc.panelsCapped * PANEL_WATT * PEAK_SUN_HOURS * PANEL_EFF) / 1000).toFixed(1)} kWh</b></div>
                </div>
                {calc.panelsNeeded > calc.inverter.maxPanels && (
                  <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
                    ⚠️ المطلوب نظرياً {calc.panelsNeeded} لوح لكن العاكس محدود بـ {calc.inverter.maxPanels} — يُنصح بترقية العاكس
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 5 — Results */}
        {step === 5 && (
          <div className="reveal space-y-5">
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

            {/* Cards grid */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className={CARD}>
                <div className="mb-2 flex items-center gap-2 text-amber-600 font-bold"><Battery className="h-5 w-5" /> بنك البطاريات المقترح</div>
                <div className="font-extrabold">{calc.selectedBattery.model}</div>
                <div className="mt-2 text-sm text-slate-700">
                  الفولطية: {calc.selectedBattery.voltage}V | السعة: {calc.selectedBattery.ah}Ah | {calc.selectedBattery.kwh.toFixed(2)} kWh
                </div>
                <div className="mt-1 text-sm text-slate-500">الطاقة القابلة للاستخدام: <b className="text-amber-700">{calc.availableWh.toFixed(0)} Wh</b></div>
              </div>

              <div className={CARD}>
                <div className="mb-2 flex items-center gap-2 text-amber-600 font-bold"><Bolt className="h-5 w-5" /> العاكس المقترح</div>
                <div className="font-extrabold">{calc.inverter.model}</div>
                <div className="mt-2 text-sm text-slate-700">نظام: {calc.inverter.voltage}V | MPPT: {calc.inverter.mppt ?? "—"}</div>
                <div className="mt-1 text-sm text-slate-500">الحد الأقصى للألواح: {calc.inverter.maxPanels}</div>
              </div>

              {systemType === "full" && (
                <div className={CARD}>
                  <div className="mb-2 flex items-center gap-2 text-amber-600 font-bold"><Sun className="h-5 w-5" /> الألواح الشمسية</div>
                  <div className="font-extrabold">{calc.panelsCapped} لوح بقدرة 615W</div>
                  <div className="mt-2 text-sm text-slate-700">إجمالي القدرة: {(calc.panelsCapped * PANEL_WATT / 1000).toFixed(2)} kW</div>
                  <div className="mt-1 text-sm text-slate-500">إنتاج يومي متوقع: {((calc.panelsCapped * PANEL_WATT * PEAK_SUN_HOURS * PANEL_EFF) / 1000).toFixed(1)} kWh</div>
                </div>
              )}

              <div className={CARD}>
                <div className="mb-2 flex items-center gap-2 text-amber-600 font-bold">⏱️ وقت التشغيل الفعلي</div>
                <div className="text-sm text-slate-700">ليلاً: <b className="text-amber-700">{Math.floor(calc.actualNightRuntimeMin / 60)} ساعة {Math.round(calc.actualNightRuntimeMin % 60)} دقيقة</b></div>
                <div className="text-sm text-slate-500">نظري (بدون خسائر): {(calc.theoreticalMin / 60).toFixed(1)} ساعة</div>
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
                <div className="mt-2 border-t border-amber-500/20 pt-2">الطاقة الفعلية المتاحة: <b className="text-amber-600">{calc.availableWh.toFixed(0)} Wh</b> (من أصل {(calc.selectedBattery.kwh * 1000).toFixed(0)} Wh)</div>
              </CollapsibleContent>
            </Collapsible>

            {/* Validation checklist */}
            <div className={CARD}>
              <div className="mb-3 font-bold text-amber-600">قائمة التحقق الهندسية</div>
              <ul className="space-y-2 text-sm">
                {calc.errors.map((e) => (
                  <li key={e} className="flex items-start gap-2 text-red-400"><XCircle className="mt-0.5 h-4 w-4 shrink-0" /> {e}</li>
                ))}
                {calc.warnings.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-amber-700"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {w}</li>
                ))}
                {calc.oks.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-emerald-400"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {o}</li>
                ))}
              </ul>
            </div>

            {/* Customer info before PDF */}
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

      {/* Off-screen PDF report (rendered as image so Arabic works) */}
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

          {/* Section 1 — Customer */}
          <PdfSection title="بيانات العميل">
            <PdfRow label="الاسم" value={customer.name || "—"} />
            <PdfRow label="الهاتف" value={customer.phone || "—"} />
            <PdfRow label="العنوان" value={customer.address || "—"} />
          </PdfSection>

          {/* Section 2 — Requirements */}
          <PdfSection title="ملخص المتطلبات">
            <PdfRow label="نوع المنظومة" value={systemType === "battery" ? "بطاريات + عاكس فقط" : "متكاملة (بطاريات + عاكس + ألواح)"} />
            <PdfRow label="الحمل الليلي" value={`${nightAmps} A  /  ${calc.nightLoadW} W`} />
            <PdfRow label="ساعات التشغيل الليلي" value={`${nightHours} ساعة`} />
            {systemType === "full" && <PdfRow label="الحمل النهاري" value={`${dayAmps} A  /  ${dayAmps * 220} W`} />}
            {systemType === "full" && <PdfRow label="ساعات التشغيل النهاري" value={`${dayHours} ساعة`} />}
            <PdfRow label="نوع البطارية" value={battType === "lithium" ? "ليثيوم LiFePO4" : "ليد أسيد"} />
            <PdfRow label="الموسم" value={season === "summer" ? "صيف" : season === "winter" ? "شتاء" : "معتدل"} />
          </PdfSection>

          {/* Section 3 — Components */}
          <PdfSection title="المكونات المقترحة">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#F59E0B", color: "#0f172a" }}>
                  <th style={pdfTh}>المكون</th>
                  <th style={pdfTh}>الموديل</th>
                  <th style={pdfTh}>الكمية</th>
                  <th style={pdfTh}>الملاحظات</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={pdfTd}>العاكس</td><td style={pdfTd}>{calc.inverter.model}</td><td style={pdfTd}>1</td><td style={pdfTd}>{calc.inverter.voltage}V {calc.inverter.mppt ? `، MPPT ${calc.inverter.mppt}` : ""}</td></tr>
                <tr><td style={pdfTd}>البطاريات</td><td style={pdfTd}>{calc.selectedBattery.model}</td><td style={pdfTd}>{calc.selectedBattery.qty}</td><td style={pdfTd}>{calc.selectedBattery.connection ?? "—"}</td></tr>
                {systemType === "full" && (
                  <tr><td style={pdfTd}>الألواح الشمسية</td><td style={pdfTd}>615W Mono</td><td style={pdfTd}>{calc.panelsCapped}</td><td style={pdfTd}>إجمالي {(calc.panelsCapped * PANEL_WATT / 1000).toFixed(2)} kW</td></tr>
                )}
              </tbody>
            </table>
          </PdfSection>

          {/* Section 4 — Engineering */}
          <PdfSection title="الحسابات الهندسية">
            <PdfRow label="الحمل الليلي" value={`${calc.nightLoadW.toFixed(0)} W`} />
            <PdfRow label="بعد خسائر العاكس والأسلاك" value={`${calc.nightLoadActual.toFixed(0)} W`} />
            <PdfRow label="الطاقة الليلية المطلوبة" value={`${calc.nightEnergyNeeded_Wh.toFixed(0)} Wh`} />
            <PdfRow label="سعة البنك المطلوبة (بعد DoD/حرارة)" value={`${calc.requiredBankWh.toFixed(0)} Wh`} />
            <PdfRow label="سعة البنك المختار" value={`${(calc.selectedBattery.kwh * 1000).toFixed(0)} Wh`} />
            <PdfRow label="الطاقة المتاحة بعد الخسائر" value={`${calc.availableWh.toFixed(0)} Wh`} />
            {systemType === "full" && <PdfRow label="إجمالي طاقة الألواح المطلوبة" value={`${calc.totalPVneeded_Wh.toFixed(0)} Wh`} />}
            {systemType === "full" && <PdfRow label="عدد الألواح المطلوب نظرياً" value={String(calc.panelsNeeded)} />}
            {systemType === "full" && <PdfRow label="عدد الألواح المثبت (ضمن حد العاكس)" value={String(calc.panelsCapped)} />}
          </PdfSection>

          {/* Section 5 — Runtime */}
          <PdfSection title="وقت التشغيل المتوقع">
            <PdfRow label="نظري (بدون خسائر)" value={`${(calc.theoreticalMin / 60).toFixed(1)} ساعة`} />
            <PdfRow label="واقعي (بعد الخسائر)" value={`${Math.floor(calc.actualNightRuntimeMin / 60)} ساعة و ${Math.round(calc.actualNightRuntimeMin % 60)} دقيقة`} />
            <PdfRow label="نهاراً" value={systemType === "full" ? "مستمر مع وجود الشمس" : "—"} />
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


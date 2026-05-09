import { useState } from "react";
import { Battery, Bolt, CheckCircle2, ChevronLeft, ChevronRight, CircuitBoard, Gauge, HelpCircle, Lightbulb, RefreshCw, Sun, TriangleAlert, XCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { calcSolar, ConnectionType, SolarInput, SolarResult } from "@/lib/solarCalc";
import { WiringDiagram } from "@/components/site/SolarWiringDiagram";

const CARD = "rounded-2xl border border-amber-500/20 bg-[#111827] shadow-[0_0_30px_-15px_rgba(245,158,11,0.5)]";

function Hint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="text-amber-500/70 hover:text-amber-400" aria-label="مساعدة">
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-right" dir="rtl">{text}</TooltipContent>
    </Tooltip>
  );
}

const ConnectionOption = ({
  value, label, hint, current, onSelect,
}: { value: ConnectionType; label: string; hint: string; current: ConnectionType; onSelect: (v: ConnectionType) => void }) => (
  <button
    type="button"
    onClick={() => onSelect(value)}
    className={cn(
      "rounded-xl border p-3 text-right transition-all",
      current === value
        ? "border-amber-400 bg-amber-500/10 shadow-[0_0_20px_-5px_rgba(245,158,11,0.6)]"
        : "border-slate-700 bg-slate-900/50 hover:border-amber-500/40"
    )}
  >
    <div className="flex items-center justify-between gap-2">
      <CircuitBoard className="h-5 w-5 text-amber-400" />
      <div className="font-bold text-slate-100">{label}</div>
    </div>
    <div className="mt-1 text-xs text-slate-400">{hint}</div>
  </button>
);

export default function SolarCalculator() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [inverterPowerW, setInverterPowerW] = useState<number>(2000);
  const [inverterVoltage, setInverterVoltage] = useState<12 | 24 | 36 | 48>(24);
  const [batteryCount, setBatteryCount] = useState<number>(2);
  const [batteryVoltage, setBatteryVoltage] = useState<2 | 6 | 12 | 24>(12);
  const [batteryAh, setBatteryAh] = useState<number>(200);
  const [connection, setConnection] = useState<ConnectionType>("series");
  const [rows, setRows] = useState<number>(2);
  const [cols, setCols] = useState<number>(2);
  const [loadAmps, setLoadAmps] = useState<number>(10);
  const [useWatts, setUseWatts] = useState(false);
  const [loadWattsInput, setLoadWattsInput] = useState<number>(500);
  const [result, setResult] = useState<SolarResult | null>(null);

  const progress = step === 4 ? 100 : ((step - 1) / 3) * 100;

  const buildInput = (): SolarInput => {
    const tempBankV =
      connection === "single" ? batteryVoltage
      : connection === "series" ? batteryVoltage * batteryCount
      : connection === "parallel" ? batteryVoltage
      : batteryVoltage * rows;
    const finalLoadAmps = useWatts ? loadWattsInput / Math.max(tempBankV, 1) : loadAmps;
    return {
      inverterPowerW,
      inverterVoltage,
      batteryCount: connection === "series-parallel" ? rows * cols : (connection === "single" ? 1 : batteryCount),
      batteryVoltage,
      batteryAh,
      connection,
      rows,
      cols,
      loadAmps: finalLoadAmps,
    };
  };

  const handleCalc = () => {
    setResult(calcSolar(buildInput()));
    setStep(4);
  };

  const reset = () => { setResult(null); setStep(1); };

  const next = () => setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));

  return (
    <div dir="rtl" lang="en" className="min-h-screen bg-[#0A0E1A] text-slate-100" style={{ fontFamily: "'Cairo', system-ui, sans-serif", fontVariantNumeric: "lining-nums tabular-nums", fontFeatureSettings: '"lnum"' }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>{`
        .solar-glow:hover { box-shadow: 0 0 30px -5px rgba(245,158,11,0.7), 0 0 60px -20px rgba(245,158,11,0.5); }
        .reveal-up { animation: reveal-up 0.5s ease-out both; }
        @keyframes reveal-up { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: translateY(0);} }
        .bg-grid {
          background-image:
            linear-gradient(rgba(245,158,11,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,158,11,0.04) 1px, transparent 1px);
          background-size: 32px 32px;
        }
      `}</style>

      <div className="bg-grid">
        <div className="container mx-auto max-w-5xl px-4 py-10">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 shadow-[0_0_40px_-5px_rgba(245,158,11,0.6)]">
              <Sun className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-amber-400 md:text-4xl">حاسبة منظومات الطاقة الشمسية</h1>
            <p className="mt-2 text-sm text-slate-400">احسب وقت تشغيل منظومتك الشمسية بدقة هندسية</p>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="mb-2 flex justify-between text-xs text-slate-400">
              <span className={cn(step >= 1 && "text-amber-400")}>1. العاكس</span>
              <span className={cn(step >= 2 && "text-amber-400")}>2. البطاريات</span>
              <span className={cn(step >= 3 && "text-amber-400")}>3. الأحمال</span>
              <span className={cn(step >= 4 && "text-amber-400")}>4. النتائج</span>
            </div>
            <Progress value={progress} className="h-2 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-amber-600" />
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className={cn(CARD, "p-6 reveal-up")}>
              <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-amber-400">
                <Bolt className="h-5 w-5" /> معلومات العاكس
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-200">
                    قدرة العاكس (واط) <Hint text="القدرة الاسمية للعاكس بالواط — مكتوبة عادة على ملصق الجهاز." />
                  </Label>
                  <Input type="number" value={inverterPowerW} onChange={(e) => setInverterPowerW(+e.target.value)}
                    className="border-slate-700 bg-slate-900/60 text-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-200">
                    نظام فولطية العاكس <Hint text="فولطية الإدخال DC للعاكس من بنك البطاريات." />
                  </Label>
                  <RadioGroup
                    value={String(inverterVoltage)}
                    onValueChange={(v) => setInverterVoltage(+v as 12 | 24 | 36 | 48)}
                    className="grid grid-cols-4 gap-2"
                  >
                    {[12, 24, 36, 48].map((v) => (
                      <Label key={v} htmlFor={`iv-${v}`}
                        className={cn(
                          "cursor-pointer rounded-lg border p-3 text-center transition-all",
                          inverterVoltage === v
                            ? "border-amber-400 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_-5px_rgba(245,158,11,0.6)]"
                            : "border-slate-700 bg-slate-900/50 text-slate-300"
                        )}
                      >
                        <RadioGroupItem id={`iv-${v}`} value={String(v)} className="sr-only" />
                        <span className="text-lg font-bold">{v}V</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <span />
                <Button onClick={next} className="bg-amber-500 text-slate-900 hover:bg-amber-400 solar-glow">
                  التالي <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className={cn(CARD, "p-6 reveal-up")}>
              <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-amber-400">
                <Battery className="h-5 w-5" /> معلومات البطاريات
              </h2>
              <div className="grid gap-5 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-slate-200">عدد البطاريات</Label>
                  <Input type="number" min={1} value={batteryCount} onChange={(e) => setBatteryCount(Math.max(1, +e.target.value))}
                    className="border-slate-700 bg-slate-900/60 text-slate-100" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">فولطية البطارية</Label>
                  <Select value={String(batteryVoltage)} onValueChange={(v) => setBatteryVoltage(+v as 2 | 6 | 12 | 24)}>
                    <SelectTrigger className="border-slate-700 bg-slate-900/60 text-slate-100"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 text-slate-100">
                      {[2, 6, 12, 24].map((v) => <SelectItem key={v} value={String(v)}>{v}V</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-200">
                    سعة البطارية (Ah) <Hint text="السعة بالأمبير/ساعة لبطارية واحدة — مذكورة على البطارية." />
                  </Label>
                  <Input type="number" value={batteryAh} onChange={(e) => setBatteryAh(+e.target.value)}
                    className="border-slate-700 bg-slate-900/60 text-slate-100" />
                </div>
              </div>

              <div className="mt-6">
                <Label className="mb-3 flex items-center gap-2 text-slate-200">
                  طريقة الربط <Hint text="توالي يزيد الفولطية، توازي يزيد السعة، توالي/توازي يزيد الاثنين." />
                </Label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <ConnectionOption value="single" label="بطارية واحدة" hint="بطارية فردية" current={connection} onSelect={setConnection} />
                  <ConnectionOption value="series" label="توالي" hint="يرفع الفولطية" current={connection} onSelect={setConnection} />
                  <ConnectionOption value="parallel" label="توازي" hint="يرفع السعة" current={connection} onSelect={setConnection} />
                  <ConnectionOption value="series-parallel" label="توالي/توازي" hint="مزيج" current={connection} onSelect={setConnection} />
                </div>
              </div>

              {connection === "series-parallel" && (
                <div className="mt-5 grid gap-4 rounded-xl border border-amber-500/20 bg-slate-900/40 p-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-200">عدد بطاريات التوالي (Rows)</Label>
                    <Input type="number" min={1} value={rows} onChange={(e) => setRows(Math.max(1, +e.target.value))}
                      className="border-slate-700 bg-slate-900/60 text-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200">عدد فروع التوازي (Cols)</Label>
                    <Input type="number" min={1} value={cols} onChange={(e) => setCols(Math.max(1, +e.target.value))}
                      className="border-slate-700 bg-slate-900/60 text-slate-100" />
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={back} className="border-slate-700 bg-transparent text-slate-200">
                  <ChevronRight className="h-4 w-4" /> السابق
                </Button>
                <Button onClick={next} className="bg-amber-500 text-slate-900 hover:bg-amber-400 solar-glow">
                  التالي <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className={cn(CARD, "p-6 reveal-up")}>
              <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-amber-400">
                <Zap className="h-5 w-5" /> الأحمال
              </h2>
              <div className="mb-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setUseWatts(false)}
                  className={cn("rounded-lg px-3 py-1.5 text-sm transition", !useWatts ? "bg-amber-500 text-slate-900" : "bg-slate-800 text-slate-300")}
                >أمبير</button>
                <button
                  type="button"
                  onClick={() => setUseWatts(true)}
                  className={cn("rounded-lg px-3 py-1.5 text-sm transition", useWatts ? "bg-amber-500 text-slate-900" : "bg-slate-800 text-slate-300")}
                >واط</button>
              </div>

              {!useWatts ? (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-200">
                    إجمالي الأحمال (أمبير) <Hint text="مجموع التيار المسحوب من البنك بالأمبير." />
                  </Label>
                  <Input type="number" value={loadAmps} onChange={(e) => setLoadAmps(+e.target.value)}
                    className="border-slate-700 bg-slate-900/60 text-slate-100" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-200">
                    إجمالي الأحمال (واط) <Hint text="مجموع استهلاك الأجهزة بالواط — سيتم تحويله تلقائياً." />
                  </Label>
                  <Input type="number" value={loadWattsInput} onChange={(e) => setLoadWattsInput(+e.target.value)}
                    className="border-slate-700 bg-slate-900/60 text-slate-100" />
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={back} className="border-slate-700 bg-transparent text-slate-200">
                  <ChevronRight className="h-4 w-4" /> السابق
                </Button>
                <Button onClick={handleCalc} className="bg-gradient-to-r from-amber-400 to-amber-600 text-slate-900 hover:from-amber-300 hover:to-amber-500 solar-glow">
                  <Sun className="h-4 w-4" /> احسب المنظومة
                </Button>
              </div>
            </div>
          )}

          {/* RESULTS */}
          {step === 4 && result && (
            <div className="space-y-5 reveal-up">
              <div className="grid gap-4 md:grid-cols-3">
                <ResultCard icon={<Battery className="h-5 w-5" />} title="فولطية البنك" value={`${result.bankVoltage} V`} />
                <ResultCard icon={<Gauge className="h-5 w-5" />} title="سعة البنك" value={`${result.bankAh} Ah`} sub={`${Math.round(result.bankWh)} Wh`} />
                <ResultCard
                  icon={<Lightbulb className="h-5 w-5" />}
                  title="وقت التشغيل الفعلي"
                  value={result.runtimeHours > 0 && isFinite(result.runtimeHours)
                    ? `${result.runtimeH} ساعة و ${result.runtimeM} دقيقة`
                    : "—"}
                  sub={`الحمل: ${Math.round(result.loadWatts)} W`}
                />
              </div>

              <div className={cn(CARD, "p-5")}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-amber-400">حالة المنظومة</h3>
                  <StatusBadge status={result.status} />
                </div>
                <div className="space-y-2">
                  {result.checks.map((c, i) => (
                    <div key={i} className={cn(
                      "flex gap-3 rounded-lg border p-3",
                      c.level === "ok" && "border-emerald-500/30 bg-emerald-500/5",
                      c.level === "warn" && "border-amber-500/40 bg-amber-500/10",
                      c.level === "error" && "border-red-500/40 bg-red-500/10",
                    )}>
                      {c.level === "ok" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                        : c.level === "warn" ? <TriangleAlert className="h-5 w-5 shrink-0 text-amber-400" />
                        : <XCircle className="h-5 w-5 shrink-0 text-red-400" />}
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{c.label}</div>
                        {c.detail && <div className="mt-1 text-xs text-slate-400">{c.detail}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cn(CARD, "p-5")}>
                <h3 className="mb-3 text-lg font-bold text-amber-400">المخطط الكهربائي</h3>
                <WiringDiagram
                  count={connection === "series-parallel" ? rows * cols : (connection === "single" ? 1 : batteryCount)}
                  connection={connection}
                  rows={rows}
                  cols={cols}
                  batteryVoltage={batteryVoltage}
                  batteryAh={batteryAh}
                  bankVoltage={result.bankVoltage}
                  bankAh={result.bankAh}
                />
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
                  <span><span className="inline-block h-2 w-4 bg-red-500 align-middle" /> موجب +</span>
                  <span><span className="inline-block h-2 w-4 bg-slate-400 align-middle" /> سالب −</span>
                  <span><span className="inline-block h-2 w-4 bg-emerald-500 align-middle" /> خرج AC</span>
                </div>
              </div>

              <div className="flex justify-center">
                <Button onClick={reset} variant="outline" className="border-amber-500/40 bg-transparent text-amber-300 hover:bg-amber-500/10">
                  <RefreshCw className="h-4 w-4" /> إعادة الحساب
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCard({ icon, title, value, sub }: { icon: React.ReactNode; title: string; value: string; sub?: string }) {
  return (
    <div className={cn(CARD, "p-5 transition-transform hover:-translate-y-1")}>
      <div className="mb-2 flex items-center gap-2 text-amber-400">{icon}<span className="text-sm">{title}</span></div>
      <div className="text-2xl font-bold text-slate-100">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: "ok" | "warn" | "error" }) {
  const map = {
    ok: { label: "✅ سليمة", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
    warn: { label: "⚠️ تحذير", cls: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
    error: { label: "❌ خطأ", cls: "bg-red-500/15 text-red-300 border-red-500/40" },
  };
  const s = map[status];
  return <span className={cn("rounded-full border px-3 py-1 text-sm font-bold", s.cls)}>{s.label}</span>;
}

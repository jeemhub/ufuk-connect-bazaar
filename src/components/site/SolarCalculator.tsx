import { useRef, useState } from "react";
import { Battery, Bolt, CheckCircle2, ChevronLeft, ChevronRight, CircuitBoard, Download, Gauge, HelpCircle, Lightbulb, Lightbulb as Bulb, RefreshCw, Sun, TriangleAlert, Wrench, XCircle, Zap } from "lucide-react";
import logoUrl from "@/assets/logo.png";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { BatterySpec, calcSolar, ConnectionType, SolarInput, SolarResult } from "@/lib/solarCalc";
import { Plus, Trash2 } from "lucide-react";
import { WiringDiagram } from "@/components/site/SolarWiringDiagram";

const CARD = "rounded-2xl border border-amber-500/20 bg-white shadow-[0_0_30px_-15px_rgba(245,158,11,0.5)]";

function Hint({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="text-amber-500/70 hover:text-amber-600" aria-label="مساعدة">
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
        : "border-slate-300 bg-slate-50 hover:border-amber-500/40"
    )}
  >
    <div className="flex items-center justify-between gap-2">
      <CircuitBoard className="h-5 w-5 text-amber-600" />
      <div className="font-bold text-slate-900">{label}</div>
    </div>
    <div className="mt-1 text-xs text-slate-500">{hint}</div>
  </button>
);

export default function SolarCalculator() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [inverterPowerW, setInverterPowerW] = useState<number>(2000);
  const [inverterVoltage, setInverterVoltage] = useState<12 | 24 | 36 | 48>(24);
  const [batteries, setBatteries] = useState<BatterySpec[]>([
    { voltage: 12, ah: 200 },
    { voltage: 12, ah: 200 },
  ]);
  const [connection, setConnection] = useState<ConnectionType>("series");
  const [rows, setRows] = useState<number>(2);
  const [cols, setCols] = useState<number>(2);
  const [loadAmps, setLoadAmps] = useState<number>(10);
  const [useWatts, setUseWatts] = useState(false);
  const [loadWattsInput, setLoadWattsInput] = useState<number>(500);
  const [result, setResult] = useState<SolarResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const downloadPdf = async () => {
    if (!reportRef.current || !result) return;
    setDownloading(true);

    // Render off-screen at a fixed desktop width so mobile PDFs match desktop.
    const RENDER_WIDTH_PX = 900;
    const stage = document.createElement("div");
    stage.style.position = "fixed";
    stage.style.left = "-10000px";
    stage.style.top = "0";
    stage.style.width = `${RENDER_WIDTH_PX}px`;
    stage.style.background = "#ffffff";
    stage.style.zIndex = "-1";
    stage.setAttribute("dir", "rtl");
    stage.style.fontFamily = "'Cairo', system-ui, sans-serif";

    const clone = reportRef.current.cloneNode(true) as HTMLElement;
    clone.style.width = `${RENDER_WIDTH_PX}px`;
    clone.style.maxWidth = "none";
    stage.appendChild(clone);
    document.body.appendChild(stage);

    // Wait a frame for layout/fonts
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const marginX = 8;
      const marginTop = 10;
      const marginBottom = 18; // room for footer
      const availW = pageW - marginX * 2;
      const maxBodyH = pageH - marginTop - marginBottom;

      const sections = Array.from(clone.children) as HTMLElement[];
      let y = marginTop;

      const renderNode = async (node: HTMLElement) => {
        const c = await html2canvas(node, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          windowWidth: RENDER_WIDTH_PX,
          width: RENDER_WIDTH_PX,
        });
        return {
          data: c.toDataURL("image/jpeg", 0.95),
          canvas: c,
          heightMm: (availW * c.height) / c.width,
        };
      };

      for (const node of sections) {
        const img = await renderNode(node);

        if (img.heightMm <= maxBodyH - (y - marginTop)) {
          pdf.addImage(img.data, "JPEG", marginX, y, availW, img.heightMm);
          y += img.heightMm + 4;
          continue;
        }

        if (y > marginTop) {
          pdf.addPage();
          y = marginTop;
        }

        if (img.heightMm <= maxBodyH) {
          pdf.addImage(img.data, "JPEG", marginX, y, availW, img.heightMm);
          y += img.heightMm + 4;
          continue;
        }

        const pxPerMm = img.canvas.width / availW;
        let srcY = 0;
        let remaining = img.heightMm;
        while (remaining > 0) {
          const sliceMm = Math.min(maxBodyH, remaining);
          const slicePx = Math.round(sliceMm * pxPerMm);
          const sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = img.canvas.width;
          sliceCanvas.height = slicePx;
          const ctx = sliceCanvas.getContext("2d")!;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(img.canvas, 0, srcY, img.canvas.width, slicePx, 0, 0, img.canvas.width, slicePx);
          pdf.addImage(sliceCanvas.toDataURL("image/jpeg", 0.95), "JPEG", marginX, marginTop, availW, sliceMm);
          srcY += slicePx;
          remaining -= sliceMm;
          if (remaining > 0) pdf.addPage();
        }
        y = marginTop + Math.min(img.heightMm % maxBodyH || maxBodyH, maxBodyH) + 4;
      }

      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text("ufukalbasra.com", pageW / 2, pageH - 14, { align: "center" });
        pdf.text("sales@ufukbasra.com.iq", pageW / 2, pageH - 9, { align: "center" });
        pdf.text("+964 771 699 2955", pageW / 2, pageH - 4, { align: "center" });
      }

      pdf.save(`ufuk-solar-report-${Date.now()}.pdf`);
    } finally {
      document.body.removeChild(stage);
      setDownloading(false);
    }
  };


  const progress = step === 4 ? 100 : ((step - 1) / 3) * 100;

  const effectiveBatteries = (): BatterySpec[] => {
    if (connection === "single") return batteries.slice(0, 1);
    return batteries;
  };

  const addBattery = () => {
    const last = batteries[batteries.length - 1] ?? { voltage: 12, ah: 200 };
    setBatteries([...batteries, { ...last }]);
  };
  const removeBattery = (i: number) => {
    if (batteries.length <= 1) return;
    setBatteries(batteries.filter((_, idx) => idx !== i));
  };
  const updateBattery = (i: number, patch: Partial<BatterySpec>) => {
    setBatteries(batteries.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  };

  const buildInput = (): SolarInput => {
    const finalLoadAmps = useWatts ? loadWattsInput / 220 : loadAmps;
    return {
      inverterPowerW,
      inverterVoltage,
      batteries: effectiveBatteries(),
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
    <div dir="rtl" lang="en" className="min-h-screen bg-[#F8FAFC] text-slate-900" style={{ fontFamily: "'Cairo', system-ui, sans-serif", fontVariantNumeric: "lining-nums tabular-nums", fontFeatureSettings: '"lnum"' }}>
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
            <h1 className="text-3xl font-bold text-amber-600 md:text-4xl">حاسبة منظومات الطاقة الشمسية</h1>
            <p className="mt-2 text-sm text-slate-500">احسب وقت تشغيل منظومتك الشمسية بدقة هندسية</p>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="mb-2 flex justify-between text-xs text-slate-500">
              <span className={cn(step >= 1 && "text-amber-600")}>1. العاكس</span>
              <span className={cn(step >= 2 && "text-amber-600")}>2. البطاريات</span>
              <span className={cn(step >= 3 && "text-amber-600")}>3. الأحمال</span>
              <span className={cn(step >= 4 && "text-amber-600")}>4. النتائج</span>
            </div>
            <Progress value={progress} className="h-2 bg-slate-200 [transform:scaleX(-1)] [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-amber-600" />
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className={cn(CARD, "p-6 reveal-up")}>
              <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-amber-600">
                <Bolt className="h-5 w-5" /> معلومات العاكس
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700">
                    قدرة العاكس (واط) <Hint text="القدرة الاسمية للعاكس بالواط — مكتوبة عادة على ملصق الجهاز." />
                  </Label>
                  <Input type="number" value={inverterPowerW} onChange={(e) => setInverterPowerW(+e.target.value)}
                    className="border-slate-300 bg-white text-slate-900" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700">
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
                            ? "border-amber-400 bg-amber-500/10 text-amber-700 shadow-[0_0_15px_-5px_rgba(245,158,11,0.6)]"
                            : "border-slate-300 bg-slate-50 text-slate-600"
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
              <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-amber-600">
                <Battery className="h-5 w-5" /> معلومات البطاريات
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-slate-700">
                    قائمة البطاريات <Hint text="أضف كل بطارية على حدة بفولطيتها وسعتها. الحساب يأخذ كل بطارية بشكل مستقل وفق طريقة الربط." />
                  </Label>
                  <Button
                    type="button"
                    onClick={addBattery}
                    disabled={connection === "single"}
                    className="bg-amber-500 text-slate-900 hover:bg-amber-400"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" /> إضافة بطارية
                  </Button>
                </div>

                <div className="space-y-2">
                  {effectiveBatteries().map((b, i) => (
                    <div key={i} className="grid grid-cols-12 items-end gap-3 rounded-xl border border-slate-300 bg-slate-50 p-3">
                      <div className="col-span-2 text-center">
                        <div className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-sm font-bold text-amber-700">
                          #{i + 1}
                        </div>
                      </div>
                      <div className="col-span-4 space-y-1">
                        <Label className="text-xs text-slate-600">الفولطية</Label>
                        <Select value={String(b.voltage)} onValueChange={(v) => updateBattery(i, { voltage: +v })}>
                          <SelectTrigger className="border-slate-300 bg-white text-slate-900 h-9"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-white text-slate-900">
                            {[2, 6, 12, 24, 48].map((v) => <SelectItem key={v} value={String(v)}>{v}V</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4 space-y-1">
                        <Label className="text-xs text-slate-600">السعة (Ah)</Label>
                        <Input
                          type="number"
                          value={b.ah}
                          onChange={(e) => updateBattery(i, { ah: +e.target.value })}
                          className="border-slate-300 bg-white text-slate-900 h-9"
                        />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeBattery(i)}
                          disabled={batteries.length <= 1 || connection === "single"}
                          className="h-9 w-9 border-red-200 text-red-500 hover:bg-red-50"
                          aria-label="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {connection === "single" && batteries.length > 1 && (
                  <p className="text-xs text-amber-700">وضع "بطارية واحدة" مفعّل — سيُستخدم البطارية الأولى فقط.</p>
                )}
              </div>

              <div className="mt-6">
                <Label className="mb-3 flex items-center gap-2 text-slate-700">
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
                <div className="mt-5 grid gap-4 rounded-xl border border-amber-500/20 bg-slate-50 p-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700">عدد بطاريات التوالي (Rows)</Label>
                    <Input type="number" min={1} value={rows} onChange={(e) => setRows(Math.max(1, +e.target.value))}
                      className="border-slate-300 bg-white text-slate-900" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">عدد فروع التوازي (Cols)</Label>
                    <Input type="number" min={1} value={cols} onChange={(e) => setCols(Math.max(1, +e.target.value))}
                      className="border-slate-300 bg-white text-slate-900" />
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={back} className="border-slate-300 bg-transparent text-slate-700">
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
              <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-amber-600">
                <Zap className="h-5 w-5" /> الأحمال
              </h2>
              <div className="mb-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setUseWatts(false)}
                  className={cn("rounded-lg px-3 py-1.5 text-sm transition", !useWatts ? "bg-amber-500 text-slate-900" : "bg-slate-200 text-slate-600")}
                >أمبير</button>
                <button
                  type="button"
                  onClick={() => setUseWatts(true)}
                  className={cn("rounded-lg px-3 py-1.5 text-sm transition", useWatts ? "bg-amber-500 text-slate-900" : "bg-slate-200 text-slate-600")}
                >واط</button>
              </div>

              {!useWatts ? (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700">
                    إجمالي الأحمال (أمبير على 220V) <Hint text="إجمالي التيار المسحوب من مخرج العاكس على فولطية AC الثابتة 220V. القدرة = أمبير × 220." />
                  </Label>
                  <Input type="number" value={loadAmps} onChange={(e) => setLoadAmps(+e.target.value)}
                    className="border-slate-300 bg-white text-slate-900" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700">
                    إجمالي الأحمال (واط) <Hint text="مجموع استهلاك الأجهزة بالواط — سيتم تحويله تلقائياً." />
                  </Label>
                  <Input type="number" value={loadWattsInput} onChange={(e) => setLoadWattsInput(+e.target.value)}
                    className="border-slate-300 bg-white text-slate-900" />
                </div>
              )}

              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={back} className="border-slate-300 bg-transparent text-slate-700">
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
              <div ref={reportRef} dir="rtl" className="space-y-5 bg-white p-3">
                <div className="flex items-center justify-between rounded-xl border-2 border-amber-500/40 bg-amber-50 p-6">
                  <img src={logoUrl} alt="افق البصرة" className="h-24 w-auto" crossOrigin="anonymous" />
                  <div className="text-left">
                    <div className="text-2xl font-extrabold text-amber-700">افق البصرة | Ufuk Albasra</div>
                    <div className="text-base font-semibold text-slate-700 mt-1">تقرير حاسبة الطاقة الشمسية</div>
                    <div className="text-sm text-slate-500 mt-1">{new Date().toLocaleString("en-GB")}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="mb-2 font-bold text-slate-900">مدخلات المنظومة</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>قدرة العاكس: <b>{inverterPowerW}W</b></div>
                    <div>فولطية العاكس: <b>{inverterVoltage}V</b></div>
                    <div>طريقة الربط: <b>{connection}</b></div>
                    <div>عدد البطاريات: <b>{effectiveBatteries().length}</b></div>
                    <div className="sm:col-span-2">
                      البطاريات: {effectiveBatteries().map((b, i) => `#${i + 1} ${b.voltage}V/${b.ah}Ah`).join("، ")}
                    </div>
                    <div>
                      الحمل: <b>{useWatts ? `${loadWattsInput}W` : `${loadAmps}A × 220V = ${loadAmps * 220}W`}</b>
                    </div>
                  </div>
                </div>
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
                  <h3 className="text-lg font-bold text-amber-600">حالة المنظومة</h3>
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
                        : c.level === "warn" ? <TriangleAlert className="h-5 w-5 shrink-0 text-amber-600" />
                        : <XCircle className="h-5 w-5 shrink-0 text-red-400" />}
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{c.label}</div>
                        {c.detail && <div className="mt-1 text-xs text-slate-500">{c.detail}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* نصائح هندسية */}
              <div className={cn(CARD, "p-5")}>
                <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-amber-600">
                  <Wrench className="h-5 w-5" /> نصائح هندسية لحل المشاكل
                </h3>
                <div className="space-y-3">
                  {result.recommendations.map((r, i) => {
                    const styles =
                      r.level === "critical"
                        ? "border-red-500/40 bg-red-500/5"
                        : r.level === "warn"
                        ? "border-amber-500/40 bg-amber-500/10"
                        : "border-emerald-500/30 bg-emerald-500/5";
                    const iconColor =
                      r.level === "critical"
                        ? "text-red-500"
                        : r.level === "warn"
                        ? "text-amber-600"
                        : "text-emerald-600";
                    return (
                      <div key={i} className={cn("flex gap-3 rounded-lg border p-3", styles)}>
                        <Bulb className={cn("h-5 w-5 shrink-0 mt-0.5", iconColor)} />
                        <div>
                          <div className="text-sm font-bold text-slate-900">{r.title}</div>
                          <div className="mt-1 text-xs leading-relaxed text-slate-700">{r.body}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={cn(CARD, "p-5")}>
                <h3 className="mb-3 text-lg font-bold text-amber-600">المخطط الكهربائي</h3>
                <WiringDiagram
                  batteries={effectiveBatteries()}
                  connection={connection}
                  rows={rows}
                  cols={cols}
                  bankVoltage={result.bankVoltage}
                  bankAh={result.bankAh}
                />
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span><span className="inline-block h-2 w-4 bg-red-500 align-middle" /> موجب +</span>
                  <span><span className="inline-block h-2 w-4 bg-slate-400 align-middle" /> سالب −</span>
                  <span><span className="inline-block h-2 w-4 bg-emerald-500 align-middle" /> خرج AC</span>
                </div>
              </div>

              </div>
              {/* end reportRef */}

              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={downloadPdf} disabled={downloading} className="bg-amber-500 text-slate-900 hover:bg-amber-400 solar-glow">
                  <Download className="h-4 w-4" /> {downloading ? "جارٍ التحضير..." : "تنزيل التقرير PDF"}
                </Button>
                <Button onClick={reset} variant="outline" className="border-amber-500/40 bg-transparent text-amber-700 hover:bg-amber-500/10">
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
      <div className="mb-2 flex items-center gap-2 text-amber-600">{icon}<span className="text-sm">{title}</span></div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function StatusBadge({ status }: { status: "ok" | "warn" | "error" }) {
  const map = {
    ok: { icon: "✅", text: "سليمة", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40" },
    warn: { icon: "⚠️", text: "تحذير", cls: "bg-amber-500/15 text-amber-700 border-amber-500/40" },
    error: { icon: "❌", text: "خطأ", cls: "bg-red-500/15 text-red-600 border-red-500/40" },
  };
  const s = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold leading-none", s.cls)}>
      <span className="inline-flex items-center leading-none">{s.icon}</span>
      <span className="leading-none">{s.text}</span>
    </span>
  );
}

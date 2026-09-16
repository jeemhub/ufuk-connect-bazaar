import { lazy, Suspense, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SolarCalculator from "@/components/site/SolarCalculator";
import SolarSystemDesigner from "@/components/site/SolarSystemDesigner";
import { cn } from "@/lib/utils";
import { Calculator, Sun, Zap } from "lucide-react";
import { Seo, SITE_NAME } from "@/components/seo/Seo";

type Tool = "calculator" | "designer" | "power";

// Loaded only when opened: it pulls in the SmartValue cloud client, QR scanner and IndexedDB layer.
const UfukPower = lazy(() => import("@/features/ufuk-power/UfukPower"));

const isTool = (v: string | null): v is Tool => v === "calculator" || v === "designer" || v === "power";

export default function ToolsPage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("tool");
  const [tool, setToolState] = useState<Tool>(isTool(initial) ? initial : "calculator");
  // Keep the tab in the URL so /tools?tool=power can be linked to directly.
  const setTool = (t: Tool) => {
    setToolState(t);
    setParams(t === "calculator" ? {} : { tool: t }, { replace: true });
  };

  return (
    <div dir="rtl">
      <Seo
        title={`أدوات هندسية — حاسبة ومصمم منظومات الطاقة الشمسية | ${SITE_NAME}`}
        description="أدوات مجانية من أُفُق البصرة: حاسبة وقت تشغيل الأحمال، مصمم منظومات الطاقة الشمسية، وUFUK POWER لمراقبة والتحكم بعواكس MUST."
        path="/tools"
        lang="ar"
      />
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div className="bg-white border-b border-amber-200" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
        <div className="container mx-auto max-w-5xl px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {[
              { v: "calculator" as Tool, icon: Calculator, label: "حاسبة وقت التشغيل" },
              { v: "designer" as Tool, icon: Sun, label: "مصمم منظومات الطاقة الشمسية" },
              { v: "power" as Tool, icon: Zap, label: "UFUK POWER — مراقبة العاكس" },
            ].map((t) => {
              const I = t.icon;
              return (
                <button
                  key={t.v}
                  onClick={() => setTool(t.v)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all",
                    tool === t.v
                      ? "border-amber-400 bg-amber-50 text-amber-700 shadow-[0_0_20px_-8px_rgba(245,158,11,0.5)]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-amber-400/60 hover:text-amber-700"
                  )}
                >
                  <I className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {tool === "calculator" && <SolarCalculator />}
      {tool === "designer" && <SolarSystemDesigner />}
      {tool === "power" && (
        <Suspense fallback={<div className="grid min-h-[50vh] place-items-center text-slate-400">…</div>}>
          <UfukPower />
        </Suspense>
      )}
    </div>
  );
}

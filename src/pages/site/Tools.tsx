import { useState } from "react";
import SolarCalculator from "@/components/site/SolarCalculator";
import SolarSystemDesigner from "@/components/site/SolarSystemDesigner";
import { cn } from "@/lib/utils";
import { Calculator, Sun } from "lucide-react";

type Tool = "calculator" | "designer";

export default function ToolsPage() {
  const [tool, setTool] = useState<Tool>("calculator");

  return (
    <div dir="rtl">
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <div className="bg-slate-950 border-b border-amber-500/20" style={{ fontFamily: "'Cairo', system-ui, sans-serif" }}>
        <div className="container mx-auto max-w-5xl px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {[
              { v: "calculator" as Tool, icon: Calculator, label: "حاسبة وقت التشغيل" },
              { v: "designer" as Tool, icon: Sun, label: "مصمم منظومات الطاقة الشمسية" },
            ].map((t) => {
              const I = t.icon;
              return (
                <button
                  key={t.v}
                  onClick={() => setTool(t.v)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all",
                    tool === t.v
                      ? "border-amber-400 bg-amber-500/15 text-amber-300 shadow-[0_0_20px_-5px_rgba(245,158,11,0.6)]"
                      : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-amber-500/40"
                  )}
                >
                  <I className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {tool === "calculator" ? <SolarCalculator /> : <SolarSystemDesigner />}
    </div>
  );
}

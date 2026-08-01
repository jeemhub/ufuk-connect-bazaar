import { useState } from "react";
import SolarCalculator from "@/components/site/SolarCalculator";
import SolarSystemDesigner from "@/components/site/SolarSystemDesigner";
import { cn } from "@/lib/utils";
import { Calculator, Sun } from "lucide-react";
import { Seo, SITE_NAME } from "@/components/seo/Seo";

type Tool = "calculator" | "designer";

export default function ToolsPage() {
  const [tool, setTool] = useState<Tool>("calculator");

  return (
    <div dir="rtl">
      <Seo
        title={`أدوات هندسية — حاسبة ومصمم منظومات الطاقة الشمسية | ${SITE_NAME}`}
        description="أدوات مجانية من أُفُق البصرة: حاسبة وقت تشغيل الأحمال ومصمم منظومات الطاقة الشمسية مع تقارير PDF هندسية جاهزة للطباعة."
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

      {tool === "calculator" ? <SolarCalculator /> : <SolarSystemDesigner />}
    </div>
  );
}

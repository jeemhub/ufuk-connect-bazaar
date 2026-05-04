import { Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useGlassTheme, type GlassIntensity } from "@/hooks/useGlassTheme";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export function GlassThemeSettings() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const { enabled, intensity, setEnabled, setIntensity } = useGlassTheme();

  const intensities: { key: GlassIntensity; label: string; desc: string }[] = [
    {
      key: "light",
      label: ar ? "خفيف" : "Light",
      desc: ar ? "شفافية بسيطة، أداء سريع" : "Subtle blur, snappy",
    },
    {
      key: "medium",
      label: ar ? "متوسط" : "Medium",
      desc: ar ? "موصى به — مظهر زجاج واضح" : "Recommended balance",
    },
    {
      key: "strong",
      label: ar ? "قوي" : "Strong",
      desc: ar ? "تأثير زجاجي درامي" : "Dramatic frosted glass",
    },
  ];

  return (
    <div className="surface-card p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            {ar ? "ثيم Liquid Glass" : "Liquid Glass theme"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {ar
              ? "مظهر زجاجي شفاف للوحة التحكم. يُحفَظ التفضيل لكل مسؤول على هذا الجهاز."
              : "Frosted-glass look for the admin panel. Preference is saved per admin on this device."}
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          aria-label={ar ? "تشغيل/إيقاف Liquid Glass" : "Toggle Liquid Glass"}
        />
      </div>

      <div className={cn("space-y-3", !enabled && "opacity-50 pointer-events-none")}>
        <Label className="text-sm font-medium">
          {ar ? "شدة التأثير" : "Intensity"}
        </Label>
        <RadioGroup
          value={intensity}
          onValueChange={(v) => setIntensity(v as GlassIntensity)}
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
        >
          {intensities.map((opt) => (
            <label
              key={opt.key}
              htmlFor={`glass-${opt.key}`}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-md border p-3 transition",
                "hover:bg-accent/40",
                intensity === opt.key
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border"
              )}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem id={`glass-${opt.key}`} value={opt.key} />
                <span className="text-sm font-semibold">{opt.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">{opt.desc}</span>
            </label>
          ))}
        </RadioGroup>

        {/* Preview */}
        <div className="relative mt-3 overflow-hidden rounded-lg border border-border">
          <div
            className="h-32 w-full"
            style={{
              background:
                "linear-gradient(135deg, hsl(217 91% 55%) 0%, hsl(280 80% 65%) 50%, hsl(190 90% 60%) 100%)",
            }}
          />
          <div className="absolute inset-x-6 top-6 rounded-md border border-white/40 bg-white/40 p-4 shadow-lg backdrop-blur-md">
            <div className="text-xs font-semibold text-foreground">
              {ar ? "معاينة الزجاج" : "Glass preview"}
            </div>
            <div className="mt-1 text-[11px] text-foreground/80">
              {ar
                ? "هكذا تبدو البطاقات والحوارات."
                : "This is how cards and dialogs will look."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

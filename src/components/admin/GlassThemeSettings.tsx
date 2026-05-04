import { Sparkles, Moon, Sun, Palette, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  useGlassTheme,
  type GlassIntensity,
  type AccentColor,
  ACCENT_PRESETS,
} from "@/hooks/useGlassTheme";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

export function GlassThemeSettings() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  const {
    enabled, intensity, accent, dark,
    setEnabled, setIntensity, setAccent, setDark,
  } = useGlassTheme();

  const intensities: { key: GlassIntensity; label: string; desc: string }[] = [
    { key: "light",  label: ar ? "خفيف" : "Light",   desc: ar ? "شفافية بسيطة، أداء سريع" : "Subtle blur, snappy" },
    { key: "medium", label: ar ? "متوسط" : "Medium", desc: ar ? "موصى به — مظهر زجاج واضح" : "Recommended balance" },
    { key: "strong", label: ar ? "قوي" : "Strong",   desc: ar ? "تأثير زجاجي درامي" : "Dramatic frosted glass" },
  ];

  const accentEntries = Object.entries(ACCENT_PRESETS) as [AccentColor, typeof ACCENT_PRESETS[AccentColor]][];

  return (
    <div className="space-y-6">
      {/* Accent color + dark mode */}
      <div className="surface-card p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <Palette className="h-4 w-4 text-primary" />
              {ar ? "ألوان لوحة التحكم" : "Dashboard colors"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {ar
                ? "اختر اللون الأساسي للوحة التحكم. يُحفَظ تفضيلك ويُزامَن عبر أجهزتك."
                : "Pick the primary accent color. Synced across your devices."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDark(!dark)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold",
              "hover:bg-accent transition-colors"
            )}
            aria-pressed={dark}
          >
            {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {dark
              ? (ar ? "الوضع الفاتح" : "Light mode")
              : (ar ? "الوضع الداكن" : "Dark mode")}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-11">
          {accentEntries.map(([key, preset]) => {
            const active = accent === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setAccent(key)}
                title={ar ? preset.labelAr : preset.label}
                aria-label={ar ? preset.labelAr : preset.label}
                aria-pressed={active}
                className={cn(
                  "group relative flex aspect-square w-full items-center justify-center rounded-xl border transition-all",
                  active
                    ? "border-foreground/40 ring-2 ring-offset-2 ring-offset-background"
                    : "border-border hover:scale-105"
                )}
                style={{
                  background: preset.gradient,
                  // @ts-expect-error css var
                  "--tw-ring-color": `hsl(${preset.primary})`,
                }}
              >
                {active && (
                  <Check className="h-5 w-5 text-white drop-shadow" strokeWidth={3} />
                )}
                <span className="sr-only">{ar ? preset.labelAr : preset.label}</span>
                <span className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  {ar ? preset.labelAr : preset.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Liquid Glass */}
      <div className="surface-card p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              {ar ? "ثيم Liquid Glass" : "Liquid Glass theme"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {ar
                ? "مظهر زجاجي شفاف للوحة التحكم. يُحفَظ التفضيل ويُزامَن عبر أجهزتك."
                : "Frosted-glass look for the admin panel. Synced across your devices."}
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

          <div className="relative mt-3 overflow-hidden rounded-lg border border-border">
            <div className="h-32 w-full" style={{ background: "var(--gradient-brand)" }} />
            <div className="absolute inset-x-6 top-6 rounded-md border border-white/40 bg-white/40 p-4 shadow-lg backdrop-blur-md">
              <div className="text-xs font-semibold text-foreground">
                {ar ? "معاينة الزجاج" : "Glass preview"}
              </div>
              <div className="mt-1 text-[11px] text-foreground/80">
                {ar ? "هكذا تبدو البطاقات والحوارات." : "This is how cards and dialogs will look."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

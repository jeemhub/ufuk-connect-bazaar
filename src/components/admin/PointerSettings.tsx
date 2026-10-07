import { usePointerPreference } from "@/hooks/usePointerPreference";
import { useLanguage } from "@/i18n/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
export function PointerSettings() {
  const {lang}=useLanguage(); const ar=lang==="ar";
  const {query,save}=usePointerPreference();
  return <section className="surface-card p-5">
    <h2 className="font-semibold">{ar ? "حركة الفأرة الدائرية" : "Circular pointer animation"}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{ar ? "تفضيل شخصي لحسابك، يُحفظ عبر أجهزتك ولا يؤثر على بقية الموظفين." : "Personal to your account, synced across your devices without affecting colleagues."}</p>
    {query.isError && <p role="alert" className="mt-3 text-destructive">{ar ? "تعذر تحميل تفضيلك." : "Failed to load your preference."}</p>}
    <div className="mt-4 flex items-center justify-between gap-3">
      <Label htmlFor="pointer-enabled">{ar ? "تشغيل أنميشن الفأرة" : "Enable pointer animation"}</Label>
      <Switch id="pointer-enabled" checked={query.data ?? true} disabled={!query.isSuccess || save.isPending}
        onCheckedChange={value=>save.mutate(value,{onError:()=>toast.error(ar ? "تعذر حفظ التفضيل" : "Failed to save preference")})}/>
    </div>
  </section>;
}

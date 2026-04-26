import { useEffect, useState } from "react";
import { Bell, Sparkles, Tag, FileText, Package } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthProvider";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { toast } from "sonner";

const STORAGE_KEY = "push_onboarding_seen_v1";

export function PushOnboardingDialog() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { supported, enabled, enable, permission, loading } = usePushSubscription();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (authLoading || !user || !supported) return;
    if (enabled) return;
    if (permission === "denied") return;

    const key = `${STORAGE_KEY}:${user.id}`;
    if (localStorage.getItem(key)) return;

    const t1 = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t1);
  }, [user, authLoading, supported, enabled, permission]);

  const dismiss = () => {
    if (user) localStorage.setItem(`${STORAGE_KEY}:${user.id}`, "1");
    setOpen(false);
  };

  const handleEnable = async () => {
    const res = await enable();
    if (res.ok) {
      toast.success(t("notif_push_enabled"));
    } else if (res.reason === "denied") {
      toast.error(t("notif_push_denied"));
    }
    dismiss();
  };

  const benefits = [
    { icon: Tag, text: t("push_onboard_b1") },
    { icon: FileText, text: t("push_onboard_b2") },
    { icon: Package, text: t("push_onboard_b3") },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && dismiss()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl">
        {/* Hero */}
        <div className="relative bg-gradient-brand px-6 pt-8 pb-10 text-center text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/30 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          </div>
          <div className="relative">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/30">
              <Bell className="h-8 w-8" />
              <Sparkles className="absolute h-4 w-4 translate-x-5 -translate-y-4 text-yellow-200" />
            </div>
            <h2 className="text-xl font-bold mb-1">{t("push_onboard_title")}</h2>
            <p className="text-sm opacity-90 leading-relaxed px-2">{t("push_onboard_sub")}</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="px-6 py-5 space-y-3">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <b.icon className="h-4 w-4" />
              </div>
              <span className="text-foreground/90">{b.text}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-2 flex flex-col gap-2">
          <Button
            onClick={handleEnable}
            disabled={loading}
            size="lg"
            className="w-full bg-gradient-brand hover:opacity-95 transition-opacity font-semibold"
          >
            <Bell className="me-2 h-4 w-4" />
            {t("push_onboard_enable")}
          </Button>
          <Button onClick={dismiss} variant="ghost" size="sm" className="w-full text-muted-foreground">
            {t("push_onboard_later")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

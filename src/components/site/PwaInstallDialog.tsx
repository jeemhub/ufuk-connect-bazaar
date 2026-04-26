import { useEffect, useState } from "react";
import { Download, Smartphone, Zap, MousePointerClick, Share } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/auth/AuthProvider";
import { usePwaInstall } from "@/hooks/usePwaInstall";

const STORAGE_KEY = "pwa_onboarding_seen_v1";

export function PwaInstallDialog() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { canInstall, installed, ios, promptInstall, hasNativePrompt } = usePwaInstall();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    if (installed || !canInstall) return;

    const key = `${STORAGE_KEY}:${user.id}`;
    if (localStorage.getItem(key)) return;

    // Delay so it appears after the push onboarding dialog
    const timer = setTimeout(() => setOpen(true), 4500);
    return () => clearTimeout(timer);
  }, [user, authLoading, installed, canInstall]);

  const dismiss = () => {
    if (user) localStorage.setItem(`${STORAGE_KEY}:${user.id}`, "1");
    setOpen(false);
  };

  const handleInstall = async () => {
    if (hasNativePrompt) {
      await promptInstall();
    }
    dismiss();
  };

  const benefits = [
    { icon: MousePointerClick, text: t("pwa_b1") },
    { icon: Smartphone, text: t("pwa_b2") },
    { icon: Zap, text: t("pwa_b3") },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && dismiss()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl">
        <div className="relative bg-gradient-brand px-6 pt-8 pb-10 text-center text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/30 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          </div>
          <div className="relative">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/30">
              <Smartphone className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold mb-1">{t("pwa_title")}</h2>
            <p className="text-sm opacity-90 leading-relaxed px-2">{t("pwa_sub")}</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-3">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <b.icon className="h-4 w-4" />
              </div>
              <span className="text-foreground/90">{b.text}</span>
            </div>
          ))}

          {ios && !hasNativePrompt && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/80">
              <Share className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <span>{t("pwa_ios_hint")}</span>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-2 flex flex-col gap-2">
          {hasNativePrompt && (
            <Button
              onClick={handleInstall}
              size="lg"
              className="w-full bg-gradient-brand hover:opacity-95 transition-opacity font-semibold"
            >
              <Download className="me-2 h-4 w-4" />
              {t("pwa_install")}
            </Button>
          )}
          <Button onClick={dismiss} variant="ghost" size="sm" className="w-full text-muted-foreground">
            {hasNativePrompt ? t("pwa_later") : t("push_onboard_later")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

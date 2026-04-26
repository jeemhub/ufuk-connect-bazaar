import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

export function PushToggleButton() {
  const { t } = useLanguage();
  const { supported, enabled, loading, enable, disable, permission } = usePushSubscription();

  if (!supported) return null;

  const handleClick = async () => {
    if (enabled) {
      await disable();
      return;
    }
    const res = await enable();
    if (res.ok) toast.success(t("notif_push_enabled"));
    else if (res.reason === "denied") toast.error(t("notif_push_denied"));
    else toast.error(t("notif_push_denied"));
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            disabled={loading || permission === "denied"}
            aria-label={t("notif_enable_push")}
            className="relative"
          >
            {enabled ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5" />
            )}
            {enabled && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("notif_enable_push")}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

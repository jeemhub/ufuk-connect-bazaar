import { Search, Languages, Home, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/i18n/LanguageContext";
import { NotificationBell } from "@/components/site/NotificationBell";
import { useGlassTheme } from "@/hooks/useGlassTheme";

export function AdminHeader() {
  const { t, lang, toggle } = useLanguage();
  const { enabled: glassOn, setEnabled: setGlassOn } = useGlassTheme();
  const ar = lang === "ar";

  return (
    <header className="glass-panel sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="text-foreground" />

      <div className="relative ms-2 hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("search_products")}
          className="ps-10 bg-secondary/60 border-transparent focus-visible:bg-card"
        />
      </div>

      <div className="ms-auto flex items-center gap-2">
        <TooltipProvider delayDuration={250}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={glassOn ? "default" : "outline"}
                size="icon"
                onClick={() => setGlassOn(!glassOn)}
                aria-pressed={glassOn}
                aria-label={ar ? "تبديل ثيم Liquid Glass" : "Toggle Liquid Glass theme"}
                className="h-9 w-9"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {glassOn
                ? ar ? "إيقاف ثيم Liquid Glass" : "Disable Liquid Glass"
                : ar ? "تشغيل ثيم Liquid Glass" : "Enable Liquid Glass"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/">
            <Home className="h-4 w-4" />
            <span className="hidden text-xs font-semibold sm:inline">{t("back_to_site")}</span>
          </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={toggle} className="gap-2">
          <Languages className="h-4 w-4" />
          <span className="text-xs font-semibold">
            {lang === "ar" ? t("switch_to_english") : t("switch_to_arabic")}
          </span>
        </Button>
        <NotificationBell />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-primary-foreground">
          A
        </div>
      </div>
    </header>
  );
}

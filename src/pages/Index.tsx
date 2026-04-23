import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, LayoutDashboard, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

const Index = () => {
  const { t, lang, toggle } = useLanguage();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero text-primary-foreground">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, hsl(217 91% 55% / 0.4), transparent 40%), radial-gradient(circle at 80% 80%, hsl(0 84% 50% / 0.25), transparent 40%)" }} />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10 backdrop-blur-md ring-1 ring-primary-foreground/20">
            <span className="font-bold">U</span>
          </div>
          <span className="font-bold tracking-wide">{t("brand")}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={toggle} className="gap-2 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
          <Languages className="h-4 w-4" />
          {lang === "ar" ? "English" : "العربية"}
        </Button>
      </header>

      <main className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 py-16 text-center md:py-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          IT · Networking · Solar · UPS
        </div>
        <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
          {t("brand")}
        </h1>
        <p className="mt-4 max-w-2xl text-balance text-lg text-primary-foreground/80 md:text-xl">
          {t("brand_tagline")}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
            <Link to="/admin">
              <LayoutDashboard className="h-4 w-4" />
              {t("admin_panel")}
              <Arrow className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-6 text-start sm:gap-12">
          {["MikroTik", "Ruijie", "Must"].map((b) => (
            <div key={b} className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-4 text-center backdrop-blur-md">
              <div className="text-xl font-bold tracking-tight">{b}</div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-primary-foreground/60">Authorized Partner</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;

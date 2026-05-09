import { useLanguage } from "@/i18n/LanguageContext";
import { Wrench } from "lucide-react";

export default function ToolsPage() {
  const { lang } = useLanguage();
  const ar = lang === "ar";
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-lg">
          <Wrench className="h-8 w-8" />
        </div>
        <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
          {ar ? "الأدوات" : "Tools"}
        </h1>
        <p className="text-muted-foreground">
          {ar
            ? "هذه الصفحة ستضم مجموعة من الأدوات المفيدة التي سنضيفها للموقع مستقبلاً."
            : "This page will host a collection of useful tools that we will add to the site in the future."}
        </p>
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/50 p-10 text-sm text-muted-foreground">
          {ar ? "قريباً..." : "Coming soon..."}
        </div>
      </div>
    </div>
  );
}

import { Plus, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { categories, products } from "@/data/mockData";

export default function Categories() {
  const { t, lang } = useLanguage();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("categories_title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("categories_subtitle")}</p>
        </div>
        <Button className="gap-2 bg-gradient-brand">
          <Plus className="h-4 w-4" /> {t("add_category")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {categories.map((c) => {
          const count = products.filter((p) => p.category === c.key).length;
          return (
            <div key={c.key} className="surface-card overflow-hidden">
              <div className="bg-gradient-brand p-5 text-primary-foreground">
                <FolderTree className="h-6 w-6 opacity-80" />
                <h3 className="mt-3 text-lg font-bold">{lang === "ar" ? c.ar : c.en}</h3>
                <div className="mt-1 text-xs opacity-80">{count} {t("products_count")}</div>
              </div>
              <div className="p-4">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("subcategories")}</div>
                <ul className="space-y-1.5">
                  {c.subs.map((s, i) => (
                    <li key={i} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 text-sm">
                      <span>{lang === "ar" ? s.ar : s.en}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

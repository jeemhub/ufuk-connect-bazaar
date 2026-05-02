import { useState } from "react";
import { Image as ImageIcon, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const initialZones = [
  { gov: "البصرة", fee: 5000, on: true },
  { gov: "بغداد", fee: 8000, on: true },
  { gov: "أربيل", fee: 12000, on: true },
  { gov: "النجف", fee: 7000, on: true },
  { gov: "الموصل", fee: 10000, on: false },
  { gov: "الديوانية", fee: 7000, on: true },
];

export default function Settings() {
  const { t, lang } = useLanguage();
  const ar = lang === "ar";
  const [vat, setVat] = useState(0);
  const [zones, setZones] = useState(initialZones);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAllProducts = async () => {
    setDeleting(true);
    const { error, count } = await supabase
      .from("products")
      .delete({ count: "exact" })
      .not("id", "is", null);
    setDeleting(false);
    setConfirmText("");
    if (error) { toast.error(error.message); return; }
    toast.success(ar ? `تم حذف ${count ?? 0} منتج` : `Deleted ${count ?? 0} products`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("settings_title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("settings_subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">{t("hero_banners")}</h2>
            <Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> {t("add_category")}</Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex aspect-[2/1] items-center justify-center rounded-lg border border-dashed border-border bg-secondary/40 text-muted-foreground">
                <div className="flex flex-col items-center gap-2 text-xs">
                  <ImageIcon className="h-6 w-6" />
                  Banner {i}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-5">
          <h2 className="mb-4 font-semibold">{t("tax_rates")}</h2>
          <div className="space-y-2">
            <Label htmlFor="vat">VAT %</Label>
            <Input id="vat" type="number" value={vat} onChange={(e) => setVat(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">{t("currency_iqd")}</p>
          </div>
        </div>
      </div>

      <div className="surface-card p-5">
        <h2 className="mb-4 font-semibold">{t("shipping_zones")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 text-start font-medium">{t("governorate")}</th>
                <th className="py-2 text-start font-medium">{t("shipping_fee")}</th>
                <th className="py-2 text-end font-medium">{t("enabled")}</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z, i) => (
                <tr key={z.gov} className="border-b border-border/50 last:border-0">
                  <td className="py-3 font-medium">{z.gov}</td>
                  <td className="py-3">
                    <Input
                      type="number"
                      value={z.fee}
                      onChange={(e) => setZones((p) => p.map((x, j) => (j === i ? { ...x, fee: Number(e.target.value) } : x)))}
                      className="h-8 w-32"
                    />
                  </td>
                  <td className="py-3 text-end">
                    <Switch checked={z.on} onCheckedChange={(v) => setZones((p) => p.map((x, j) => (j === i ? { ...x, on: v } : x)))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="surface-card border border-destructive/40 p-5">
        <h2 className="mb-1 font-semibold text-destructive">{ar ? "منطقة الخطر" : "Danger zone"}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {ar ? "إجراءات لا يمكن التراجع عنها. تعامَل معها بحذر." : "Irreversible actions. Proceed with caution."}
        </p>
        <div className="flex flex-col items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium">{ar ? "حذف جميع المنتجات" : "Delete all products"}</div>
            <div className="text-sm text-muted-foreground">
              {ar ? "سيُحذف كل منتج في المتجر بشكل نهائي." : "Permanently removes every product in the store."}
            </div>
          </div>
          <AlertDialog onOpenChange={(o) => { if (!o) setConfirmText(""); }}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" /> {ar ? "حذف الكل" : "Delete all"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{ar ? "تأكيد حذف جميع المنتجات" : "Confirm delete all products"}</AlertDialogTitle>
                <AlertDialogDescription>
                  {ar
                    ? 'لا يمكن التراجع عن هذا الإجراء. اكتب DELETE للتأكيد.'
                    : 'This cannot be undone. Type DELETE to confirm.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                autoFocus
              />
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>{ar ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                <AlertDialogAction
                  disabled={confirmText !== "DELETE" || deleting}
                  onClick={(e) => { e.preventDefault(); handleDeleteAllProducts(); }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {ar ? "حذف نهائي" : "Delete permanently"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

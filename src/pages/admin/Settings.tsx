import { useAuth } from "@/auth/AuthProvider";
import { PricingModeSettings } from "@/components/admin/PricingModeSettings";
import { PointerSettings } from "@/components/admin/PointerSettings";
import { GlobalPriceSettings } from "@/components/admin/GlobalPriceSettings";
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CommerceSettings } from "@/components/admin/CommerceSettings";
import { ProductDetailsSettings } from "@/components/admin/ProductDetailsSettings";
import { GlassThemeSettings } from "@/components/admin/GlassThemeSettings";

export default function Settings() {
  const { t, lang } = useLanguage();
  const ar = lang === "ar";
  const { isAdmin } = useAuth();
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

      <GlassThemeSettings />
      <PointerSettings />
      <PricingModeSettings />
      {isAdmin && <>
      <GlobalPriceSettings />

      <CommerceSettings />
      <ProductDetailsSettings />

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
      </>}
    </div>
  );
}

import { Ban, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthProvider";
import { useLanguage } from "@/i18n/LanguageContext";

export function BlockedScreen() {
  const { signOut } = useAuth();
  const { lang } = useLanguage();
  const ar = lang === "ar";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-destructive/10 via-background to-background p-6">
      <div className="w-full max-w-md rounded-3xl border border-destructive/30 bg-card p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <Ban className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-destructive">
          {ar ? "تم حظر حسابك" : "Account Blocked"}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {ar
            ? "لقد تم تقييد وصولك إلى الموقع من قبل الإدارة. للاستفسار يرجى التواصل معنا."
            : "Your access to this site has been restricted by the administration. Please contact us for assistance."}
        </p>
        <div className="mb-6 space-y-1 rounded-xl bg-muted/50 p-4 text-sm">
          <div className="font-semibold">UFUK AL-Basra</div>
          <div className="text-muted-foreground">sales@ufukbasra.com.iq</div>
          <div className="text-muted-foreground" dir="ltr">+964 771 699 2955</div>
        </div>
        <Button onClick={() => signOut()} variant="outline" className="w-full">
          <LogOut className="me-2 h-4 w-4" />
          {ar ? "تسجيل الخروج" : "Sign out"}
        </Button>
      </div>
    </div>
  );
}
